"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layouts/AuthLayout";

export default function RegisterFirst() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { registerFirst } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match" });
      return;
    }

    setErrorText(null);
    setIsLoading(true);
    try {
      await registerFirst({
        companyName: formData.companyName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      toast({ title: "Success", description: "Account created successfully" });
      router.push("/dashboard");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create account";
      toast({
        title: "Error",
        description: msg,
      });
      setErrorText(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <AuthLayout
      title="Create your company"
      description="Register the first user and your company"
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} required disabled={isLoading} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" value={formData.companyName} onChange={handleChange} required disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required disabled={isLoading} className="pr-10" />
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
            <Input id="confirmPassword" type={showConfirm ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} className="pr-10" />
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

        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
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
