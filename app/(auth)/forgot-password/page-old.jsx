"use client";

import { ContainerCenterCard } from "@/components/site/ui/center-cards";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
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

  useEffect(() => {
    let interval;
    if (otpExpiryTimer > 0 && !submitting) {
      interval = setInterval(() => {
        setOtpExpiryTimer((prev) => {
          if (prev <= 1) {
            setGeneratedOtp("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [otpExpiryTimer, submitting]);

  const startTimer = () => {
    setOtpExpiryTimer(OTP_EXPIRY_SECONDS);
  };

  const resetOtpState = () => {
    setOtp("");
    setGeneratedOtp("");
    setOtpExpiryTimer(0);
    setIsResending(false);
  };

  const handleSendOtp = async (type = "initial", overrideEmail) => {
    const normalizedEmail = (overrideEmail ?? email).trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (type === "initial") {
      setSubmitting(true);
    } else {
      setIsResending(true);
    }

    try {
      const exists = await isUserExist(normalizedEmail);
      if (!exists) {
        toast.error("We couldn't find an account with that email.");
        return;
      }

      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        toast.error("We couldn't find an account with that email.");
        return;
      }

      setUserId(user.id);

      const otpValue = generateOTP();
      const response = await fetch("/api/sendEmailOTP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: normalizedEmail,
          otp: otpValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      setGeneratedOtp(otpValue);
      setOtp("");
      startTimer();
      setStep("otp");
      toast.success(
        `OTP ${type === "initial" ? "sent" : "resent"} successfully.`
      );
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      if (type === "initial") {
        setSubmitting(false);
      } else {
        setIsResending(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setSubmitting(true);

    if (!otp.trim() || otp.length !== OTP_LENGTH) {
      toast.error("Please enter the 6-digit OTP.");
      setSubmitting(false);
      return;
    }

    if (!generatedOtp) {
      toast.warning("OTP has expired. Please request a new one.");
      setSubmitting(false);
      return;
    }

    if (otp !== generatedOtp) {
      toast.error("Invalid OTP. Please try again.");
      setSubmitting(false);
      return;
    }

    toast.success("OTP verified successfully.");
    setStep("reset");
    resetOtpState();
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    setSubmitting(true);

    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword) {
      toast.error("Please enter your new password.");
      setSubmitting(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setSubmitting(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      toast.error("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    if (!userId) {
      toast.error("We could not verify your account. Please start over.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: trimmedPassword }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Failed to update password. Please try again.");
        setSubmitting(false);
        return;
      }

      toast.success("Password updated successfully.");
      router.push("/login");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to update password. Please try again.");
      setSubmitting(false);
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    resetOtpState();
    setSubmitting(false);
    setUserId(null);
  };

  if (step === "otp") {
    return (
      <ContainerCenterCard sm className="gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2>Verify Your Identity</h2>
          <p className="leading-5">
            We have sent an OTP to {email}{" "}
            <span
              className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
              onClick={handleChangeEmail}
            >
              Change Email
            </span>
          </p>
        </div>
        <div className="w-full flex flex-col items-center gap-6">
          <div className="grid self-stretch gap-2">
            <Label htmlFor="otp">OTP</Label>
            <InputOTP
              id="otp"
              maxLength={OTP_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={(value) => setOtp(value)}
              className="w-full"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            className="w-full uppercase"
            onClick={handleVerifyOtp}
            disabled={submitting}
          >
            {submitting && <Loader />}
            Verify
          </Button>
        </div>
        <div className="flex flex-col items-center">
          {otpExpiryTimer > 0 ? (
            <p className="text-muted-foreground">
              OTP will expire in {Math.floor(otpExpiryTimer / 60)}:
              {(otpExpiryTimer % 60).toString().padStart(2, "0")}
            </p>
          ) : (
            <p
              className={`text-sky-500 cursor-pointer ${
                isResending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:underline underline-offset-4"
              }`}
              onClick={!isResending ? () => handleSendOtp("resend") : undefined}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </p>
          )}
        </div>
      </ContainerCenterCard>
    );
  }

  if (step === "reset") {
    return (
      <ContainerCenterCard sm>
        <div className="flex flex-col items-center gap-1">
          <h2>Change Password</h2>
          <p className="text-center text-muted-foreground">
            Enter a strong password you have not used before.
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
            />
            <div className="flex items-center gap-2 mt-1">
              <Checkbox
                id="show-password"
                checked={showPassword}
                onCheckedChange={(checked) => setShowPassword(!!checked)}
                disabled={submitting}
              />
              <Label htmlFor="show-password">Show Password</Label>
            </div>
          </div>
          <Button
            className="w-full uppercase"
            onClick={handleResetPassword}
            disabled={submitting}
          >
            {submitting && <Loader />}
            Confirm
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

  return (
    <ContainerCenterCard sm>
      <div className="flex flex-col items-center gap-1">
        <h2>{isChange ? "Change" : "Forgot"} Password</h2>
        <p className="text-center text-muted-foreground">
          Enter your registered email to receive an OTP.
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
          onClick={() => handleSendOtp("initial")}
          disabled={submitting}
        >
          {submitting && <Loader />}
          {submitting ? "Sending..." : "Send OTP"}
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
