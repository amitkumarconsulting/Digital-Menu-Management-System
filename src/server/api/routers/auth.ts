import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { createSession, deleteSession } from "~/server/auth";
import { Resend } from "resend";
import { env } from "~/env";

const getResend = () => {
  try {
    return new Resend(env.RESEND_API_KEY);
  } catch {
    return null;
  }
};

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).optional(),
        country: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { email} = input;

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

      // Delete old codes for this email
      await db.emailVerificationCode.deleteMany({
        where: { email },
      });

      // Check if user exists
      let user = await db.user.findUnique({
        where: { email },
      });

      // If user doesn't exist and name/country provided, create user
      if (!user) {
        user = await db.user.create({
          data: {
            email
          },
        });
      }

      // Create new code
      const verificationCode = await db.emailVerificationCode.create({
        data: {
          email,
          code,
          expiresAt,
          ...(user ? { userId: user.id } : {}),
        },
      });

      // Send email
      try {
        const resend = getResend();
        if (!resend) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Email service not configured",
          });
        }
        await resend.emails.send({
          from: "Digital Menu <onboarding@resend.dev>",
          to: email,
          subject: "Your Verification Code",
          html: `
            <h1>Your Verification Code</h1>
            <p>Your verification code is: <strong>${code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification code",
        });
      }

      return { success: true };
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().min(1), // Allow codes of any length for master code support
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, code } = input;

      // Check if master code is configured and matches
      const masterCodeConfigured = !!env.MASTER_CODE;
      const isMasterCode = masterCodeConfigured && code === env.MASTER_CODE;

      let user;
      
      if (isMasterCode) {
        // Master code authentication - find or create user
        user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Create user if doesn't exist (master code allows bypassing registration)
          user = await db.user.create({
            data: {
              email,
              name: email.split("@")[0] ?? "User", // Default name from email
              country: "Unknown", // Default country
              emailVerified: true, // Auto-verify with master code
            },
          });
        } else {
          // Mark email as verified if user exists
          await db.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          });
        }
      } else {
        // Normal email verification code flow
        if (code.length !== 6) {
          // If not 6 digits and not master code, check if master code is configured
          const masterCodeHint = env.MASTER_CODE 
            ? " Or use the master code if configured." 
            : "";
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Verification code must be 6 digits.${masterCodeHint}`,
          });
        }

        // Find verification code
        const verificationCode = await db.emailVerificationCode.findFirst({
          where: {
            email,
            code,
            expiresAt: {
              gte: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (!verificationCode) {
          // Check if user exists but code is wrong
          const existingUser = await db.user.findUnique({
            where: { email },
          });

          // Check if they might be trying to use a master code
          const possibleMasterCodeAttempt = !masterCodeConfigured && code.length !== 6;

          if (existingUser) {
            const masterHint = masterCodeConfigured 
              ? " Or if you have a master code configured, make sure you're using it correctly." 
              : "";
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Invalid or expired verification code. Please request a new code.${masterHint}`,
            });
          } else {
            let errorMessage = "Invalid or expired verification code.";
            
            if (possibleMasterCodeAttempt && masterCodeConfigured) {
              errorMessage += " If you're trying to use a master code, please verify it matches the configured value.";
            } else if (code.length !== 6 && masterCodeConfigured) {
              errorMessage += ` The code must be 6 digits for email verification, or use the master code if configured.`;
            } else {
              errorMessage += " Please send a verification code first and ensure you've provided your name and country during registration.";
            }
            
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: errorMessage,
            });
          }
        }

        // Get user
        user = verificationCode.user;
        if (!user) {
          // Find existing user by email
          user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User not found. Please send a verification code with your name and country to register first.",
            });
          }
        }

        // Mark email as verified
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });

        // Delete used verification code
        await db.emailVerificationCode.delete({
          where: { id: verificationCode.id },
        });
      }

      // Create session
      const token = await createSession(user.id);

      // Return token, cookie will be set in the route handler
      return { user, token };
    }),

  getSession: publicProcedure.query(async () => {
    const { getServerSession } = await import("~/server/auth");
    const session = await getServerSession();
    return session ? { user: session.user } : null;
  }),

  logout: publicProcedure.mutation(async () => {
    // Session deletion will be handled in the route handler via cookie
    return { success: true };
  }),
});

