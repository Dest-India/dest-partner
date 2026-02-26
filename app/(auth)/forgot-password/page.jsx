"use client";

import { ContainerCenterCard } from "@/components/site/ui/center-cards";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check if token is in URL
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setStep("reset");
    }
  }, [searchParams]);

  // Request password reset email
  const handleRequestReset = async () => {
    setSubmitting(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to send reset link.");
        setSubmitting(false);
        return;
      }

      // Show debug link in development
      if (result.debug && process.env.NODE_ENV === "development") {
        toast.success(result.message, { duration: 5000 });
        // Log the reset link to console for easy access in development
        console.log("🔑 Password Reset Link:", result.debug.resetLink);
        toast.info("Check console for reset link (dev mode)", {
          duration: 3000,
        });
      } else {
        toast.success(result.message);
      }

      setStep("success");
    } catch (error) {
      console.error("Error requesting reset:", error);
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset password with token
  const handleResetPassword = async () => {
    setSubmitting(true);

    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword) {
      toast.error("Please enter your new password.");
      setSubmitting(false);
      return;
    }

    if (trimmedPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setSubmitting(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      toast.error("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: trimmedPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to update password.");
        setSubmitting(false);
        return;
      }

      toast.success("Password updated successfully!");
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to update password. Please try again.");
      setSubmitting(false);
    }
  };

  // Success screen after requesting reset
  if (step === "success") {
    return (
      <ContainerCenterCard sm>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2>Check Your Email</h2>
          <p className="text-muted-foreground">
            If an account exists with <strong>{email}</strong>, you will receive
            a password reset link shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            The link will expire in 1 hour for security reasons.
          </p>
        </div>
        <div className="w-full flex flex-col gap-3 mt-4">
          <Button onClick={() => router.push("/login")} className="w-full">
            Back to Login
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep("email")}
            className="w-full"
          >
            Send Another Link
          </Button>
        </div>
      </ContainerCenterCard>
    );
  }

  // Reset password screen (with token)
  if (step === "reset") {
    return (
      <ContainerCenterCard sm>
        <div className="flex flex-col items-center gap-1">
          <h2>Set New Password</h2>
          <p className="text-center text-muted-foreground">
            Enter a strong password you haven't used before.
          </p>
        </div>
        <div className="w-full flex flex-col items-center gap-6">
          <div className="grid self-stretch gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="grid self-stretch gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              placeholder="Re-enter your password"
            />
            <div className="flex items-center gap-2 mt-1">
              <Checkbox
                id="show-password"
                checked={showPassword}
                onCheckedChange={(checked) => setShowPassword(!!checked)}
                disabled={submitting}
              />
              <Label htmlFor="show-password" className="text-sm font-normal">
                Show Password
              </Label>
            </div>
          </div>
          <Button
            className="w-full uppercase"
            onClick={handleResetPassword}
            disabled={submitting}
          >
            {submitting && <Loader />}
            Reset Password
          </Button>
          <Button
            variant="ghost"
            className="w-full uppercase"
            onClick={() => router.push("/login")}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </ContainerCenterCard>
    );
  }

  // Request reset email screen
  return (
    <ContainerCenterCard sm>
      <div className="flex flex-col items-center gap-1">
        <h2>Forgot Password?</h2>
        <p className="text-center text-muted-foreground">
          Enter your email address and we'll send you a reset link.
        </p>
      </div>
      <div className="w-full flex flex-col items-center gap-6">
        <div className="grid self-stretch gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="dest@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
        <Button
          className="w-full uppercase"
          onClick={handleRequestReset}
          disabled={submitting}
        >
          {submitting && <Loader />}
          {submitting ? "Sending..." : "Send Reset Link"}
        </Button>
        <Button
          variant="ghost"
          className="w-full uppercase -mt-2"
          onClick={() => router.push("/login")}
          disabled={submitting}
        >
          Back to Login
        </Button>
      </div>
    </ContainerCenterCard>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <ContainerCenterCard sm>
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        </ContainerCenterCard>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
