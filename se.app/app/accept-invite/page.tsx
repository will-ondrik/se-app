"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import Link from "next/link";
import { getInvitePreview, type InvitePreview } from "@/services/api";

export default function AcceptInvite() {
  const searchParams = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [formData, setFormData] = useState({
    token: initialToken,
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  const { registerInvited } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If token appears later (client nav), sync it once
    const t = searchParams.get("token");
    if (t && !formData.token) {
      setFormData((prev) => ({ ...prev, token: t }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const t = formData.token;
    if (!t) return;
    setPreviewState("loading");
    getInvitePreview(t)
      .then((data) => {
        setPreview(data);
        setPreviewState("loaded");
        // Optionally prefill names from invite if none set yet
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || data.firstName || "",
          lastName: prev.lastName || data.lastName || "",
        }));
      })
      .catch((e) => {
        console.warn("invite preview failed", e);
        setPreviewState("error");
      });
  }, [formData.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.token) {
      toast({ title: "Error", description: "Invitation token is required" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    try {
      await registerInvited({
        token: formData.token,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });
      toast({ title: "Success", description: "You're all set!" });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invite",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <AuthLayout
      title="Accept your invite"
      description="Create your password to join your company"
      footer={
        <span>
          Not invited yet?{" "}
          <Link href="/register-first" className="font-medium text-primary hover:underline">
            Create a new company
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="token">Invitation token</Label>
          <Input id="token" value={formData.token} onChange={handleChange} required disabled={isLoading} />
        </div>

        {formData.token && (
          <div className="rounded-md border p-4 text-sm">
            {previewState === "loading" && <div className="text-muted-foreground">Loading invite…</div>}
            {previewState === "error" && (
              <div className="text-red-600">Unable to load invite preview. The token may be invalid or expired.</div>
            )}
            {previewState === "loaded" && preview && (
              <div className="space-y-1">
                {preview.companyName && (
                  <div>
                    <span className="text-muted-foreground">Company: </span>
                    <span className="font-medium">{preview.companyName}</span>
                  </div>
                )}
                {preview.email && (
                  <div>
                    <span className="text-muted-foreground">Invited email: </span>
                    <span className="font-medium">{preview.email}</span>
                  </div>
                )}
                {preview.roles && preview.roles.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Roles: </span>
                    <span className="font-medium">{preview.roles.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name (optional)</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name (optional)</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} disabled={isLoading} />
          </div>
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
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Accept invite
        </Button>
      </form>
    </AuthLayout>
  );
}
