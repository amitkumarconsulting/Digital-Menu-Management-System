"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const registerMutation = api.auth.register.useMutation({
    onSuccess: (data) => {
      setRegisteredEmail(data.email);
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

  const handleRegister = () => {
    if (!email || !name || !country) {
      alert("Please fill in all fields");
      return;
    }

    registerMutation.mutate({
      email,
      name,
      country,
    });
  };

  const handleVerifyCode = () => {
    if (!code || code.length === 0) {
      alert("Please enter a verification code or master code");
      return;
    }

    verifyCodeMutation.mutate({ email: registeredEmail, code });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            {step === "form"
              ? "Enter your details to create an account"
              : "Enter the verification code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "form" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="India"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleRegister}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/auth/login" className="text-primary hover:underline">
                  Login
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
                <p className="text-xs text-muted-foreground">
                  A verification code has been sent to {registeredEmail}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("form");
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

