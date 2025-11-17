"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthLayout({ title, description, children, footer, className }: AuthLayoutProps) {
  return (
    <div className="relative min-h-svh flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4 py-10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <Card className={cn("relative z-10 w-full max-w-4xl overflow-hidden border-0 bg-background/70 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
        <div className="grid md:grid-cols-2">
          {/* Brand / Visual panel */}
          <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-10">
            <div className="flex items-center gap-3 text-primary">
              <div className="rounded-xl bg-primary/15 p-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-lg font-semibold">StraightEdge</span>
            </div>

            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
              {description ? (
                <p className="mt-2 text-muted-foreground">{description}</p>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} StraightEdge. All rights reserved.</p>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-10">
            <div className="mb-6 md:hidden">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>

            {children}

            {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
