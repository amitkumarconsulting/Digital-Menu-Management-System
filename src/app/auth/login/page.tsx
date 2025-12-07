"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");

  const sendCodeMutation = api.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      setStep("verify");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const verifyCodeMutation = api.auth.verifyCode.useMutation({
    onSuccess: (data) => {
      // Set session cookie
      document.cookie = `session_token=${data.token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      router.push("/admin/restaurants");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSendCode = () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    sendCodeMutation.mutate({ email });
  };

  const handleVerifyCode = () => {
    if (!code || code.length === 0) {
      alert("Please enter a verification code or master code");
      return;
    }

    verifyCodeMutation.mutate({ email, code });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a verification code"
              : "Enter the verification code sent to your email, or use the master code if configured"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending}
              >
                {sendCodeMutation.isPending ? "Sending..." : "Send Verification Code"}
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/auth/register" className="text-primary hover:underline">
                  Register
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456 or master code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
