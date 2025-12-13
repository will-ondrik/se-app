"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const { requestPasswordReset, resetPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const isResetMode = !!token;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    // Validate before starting async action
    if (isResetMode && password !== confirmPassword) {
      const msg = "Passwords do not match";
      toast({ title: "Error", description: msg });
      setErrorText(msg);
      return;
    }

    setIsLoading(true);

    try {
      if (isResetMode) {
        await resetPassword(token, password);
        toast({ title: "Success", description: "Password reset. Please log in." });
        router.push("/login");
      } else {
        await requestPasswordReset(email);
        toast({
          title: "If the email exists",
          description: "A password reset link has been sent.",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "Request failed";
      toast({ title: "Error", description: msg });
      setErrorText(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isResetMode ? "Reset password" : "Request password reset"}
      description={isResetMode ? "Create a new password for your account" : "We'll email you a reset link"}
      footer={null}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {!isResetMode ? (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isResetMode ? "Reset password" : "Send reset link"}
        </Button>
        {errorText && (
          <div className="text-sm text-red-600 mt-2" role="alert">
            {errorText}
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
