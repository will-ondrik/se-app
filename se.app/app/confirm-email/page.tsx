"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmEmail } from "@/services/api";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Loader2 } from "lucide-react";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = useMemo(() => searchParams.get("status"), [searchParams]);
  const tokenParam = useMemo(() => searchParams.get("token"), [searchParams]);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Confirming your email...");

  useEffect(() => {
    // Preferred flow: backend redirects here with ?status=success|error after hitting
    // /api/v1/auth/confirm-email?token=...&redirect=1
    if (statusParam === "success") {
      setStatus("success");
      setMessage("Email confirmed! Redirecting to your dashboard...");
      const t = setTimeout(() => router.push("/dashboard"), 1200);
      return () => clearTimeout(t);
    }
    if (statusParam === "error") {
      setStatus("error");
      setMessage("Email confirmation failed");
      return;
    }

    // Fallback: if a token is present directly on the client URL (not recommended),
    // call the API without redirect.
    if (tokenParam) {
      (async () => {
        try {
          await confirmEmail(tokenParam);
          setStatus("success");
          setMessage("Email confirmed! Redirecting to your dashboard...");
          setTimeout(() => router.push("/dashboard"), 1200);
        } catch (e: any) {
          setStatus("error");
          setMessage(e?.message || "Email confirmation failed");
        }
      })();
      return;
    }

    // If neither status nor token provided
    setStatus("error");
    setMessage("Missing confirmation information");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam, tokenParam]);

  return (
    <AuthLayout title="Confirming email" description="Just a moment" footer={null}>
      <div className="flex h-32 items-center justify-center text-center">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {message}
          </div>
        )}
        {status !== "loading" && <p className={status === "error" ? "text-red-600" : "text-green-600"}>{message}</p>}
      </div>
    </AuthLayout>
  );
}
