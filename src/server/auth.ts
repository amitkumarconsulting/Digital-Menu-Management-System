import { db } from "~/server/db";
import { cookies } from "next/headers";
import { type Session, type User } from "@prisma/client";

export async function getServerSession(): Promise<
  (Session & { user: User }) | null
> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session as Session & { user: User };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({
    where: { token },
  });
}

