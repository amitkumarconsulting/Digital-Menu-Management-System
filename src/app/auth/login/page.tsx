"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isNewUser, setIsNewUser] = useState(false);

  const sendCodeMutation = api.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      setStep("verify");
    },
    onError: (error) => {
      // If user doesn't exist, ask for name and country
      if (error.message.includes("not found")) {
        setIsNewUser(true);
      } else {
        alert(error.message);
      }
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

    if (isNewUser && (!name || !country)) {
      alert("Please enter your name and country");
      return;
    }

    sendCodeMutation.mutate({
      email,
      ...(isNewUser ? { name, country } : {}),
    });
  };

  const handleVerifyCode = () => {
    if (!code || code.length === 0) {
      alert("Please enter a verification code or master code");
      return;
    }

    verifyCodeMutation.mutate({ email, code });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Digital Menu Management</CardTitle>
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
              {isNewUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </>
              )}
              <Button
                className="w-full"
                onClick={handleSendCode}
                disabled={sendCodeMutation.isPending}
              >
                {sendCodeMutation.isPending ? "Sending..." : "Send Verification Code"}
              </Button>
              {isNewUser && (
                <p className="text-sm text-muted-foreground">
                  New user detected. Please provide your name and country.
                </p>
              )}
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

