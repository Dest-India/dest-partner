//Register Page

"use client";

import {
  CardImageOnRight,
  ContainerCenterCard,
} from "@/components/site/ui/center-cards";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { generateOTP } from "@/lib/store";
import { isUserExist } from "@/lib/supabase";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        if (typeof window !== "undefined") {
          const storedInfo = localStorage.getItem("userInfo");
          if (!storedInfo) {
            setLoading(false);
            return;
          }

          const userInfo = JSON.parse(storedInfo);
          if (userInfo && userInfo.email && userInfo.id) {
            // Verify user session via API
            const response = await fetch("/api/auth/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userInfo.id,
                email: userInfo.email,
              }),
            });

            const result = await response.json();

            if (!result.success) {
              toast.error("User does not exist", { id: "register" });
              setTimeout(() => {
                toast.info("Please register or login", { id: "register" });
              }, 3000);
              localStorage.removeItem("userInfo");
              setLoading(false);
              return;
            }

            if (result.user) {
              const data = result.user;
              localStorage.removeItem("userInfo");
              const userToStore = { ...data };
              delete userToStore.gallery;
              localStorage.setItem("userInfo", JSON.stringify(userToStore));
              if (data.name && data.verified) {
                router.replace("/home");
                toast.info("Welcome back !", { id: "welcome-back" });
              } else if (data.name && !data.verified) {
                router.replace("/register/wait");
                toast.info("Please wait till verification is complete !", {
                  id: "wait-info",
                });
              } else if (!data.name) {
                router.replace("/register/onboarding");
              }
            } else {
              localStorage.removeItem("userInfo");
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    let interval;
    if (otpExpiryTimer > 0 && !submitting) {
      // Pause timer when submitting
      interval = setInterval(() => {
        setOtpExpiryTimer((prev) => {
          if (prev <= 1) {
            setGeneratedOtp(""); // Clear OTP after expiry
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpExpiryTimer, submitting]); // Add submitting to dependencies

  const startTimer = () => {
    setOtpExpiryTimer(90); // 90 seconds = 1.5 minutes for expiry
  };

  const handleContinue = async () => {
    setSubmitting(true);
    if (!email.trim()) {
      toast.error("Please enter your email", { id: "empty-error" });
      setSubmitting(false);
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter your password", { id: "empty-error" });
      setSubmitting(false);
      return;
    }
    const userExists = await isUserExist(email);
    if (userExists) {
      toast.error("User already exists");
      setSubmitting(false);
      return;
    } else {
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);
      try {
        const response = await fetch("/api/sendEmailOTP", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            otp: newOtp,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to send OTP");
        }
        setSubmitting(false);
        setVerifyingEmail(true);
        startTimer(); // Start expiry timer
        toast.success("OTP sent successfully");
      } catch (error) {
        console.error("Error sending OTP:", error);
        toast.error("Failed to send OTP");
        setSubmitting(false);
      }
      return;
    }
  };

  const handleVerifyOTP = async () => {
    toast.success("Verifying OTP...", { id: "verify-register" });
    setSubmitting(true);
    if (!otp.trim() || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP", {
        id: "verify-register",
      });
      setSubmitting(false);
      return;
    }

    if (!generatedOtp) {
      toast.warning("OTP has expired. Please request a new one.", {
        id: "verify-register",
      });
      setSubmitting(false);
      return;
    }

    if (otp === generatedOtp) {
      toast.success("OTP verified successfully !", { id: "verify-register" });

      try {
        // Call API to register user with bcrypt hashing
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            otp,
            generatedOtp,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || "Failed to register user.", {
            id: "verify-register",
          });
          setSubmitting(false);
          return;
        }

        if (result.success && result.user) {
          const userToStore = { ...result.user };
          delete userToStore.gallery;
          localStorage.setItem("userInfo", JSON.stringify(userToStore));
          router.replace("/register/onboarding");
          toast.success("User registered successfully !", {
            id: "verify-register",
          });
          setTimeout(() => {
            toast.info("Provide your details to complete onboarding !", {
              id: "verify-register",
            });
          }, 3000);
        } else {
          toast.error("Failed to register user.", { id: "verify-register" });
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error("Failed to register user.", { id: "verify-register" });
      }
      setSubmitting(false);
    } else {
      toast.error("Invalid OTP. Please try again.", { id: "verify-register" });
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    setOtp(""); // Clear current OTP input

    try {
      const response = await fetch("/api/sendEmailOTP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          otp: newOtp,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }
      startTimer(); // Restart expiry timer
      toast.success("OTP resent successfully");
      setIsResending(false);
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP");
      setIsResending(false);
    }
  };

  const changeEmail = () => {
    setVerifyingEmail(false);
    setEmail("");
    setOtp("");
    setGeneratedOtp("");
    setOtpExpiryTimer(0);
  };

  if (verifyingEmail) {
    return (
      <CardImageOnRight>
        <div className="flex flex-col items-center gap-3">
          <h2>Verify Your Identity</h2>
          <p className="leading-5 text-center">
            We have send you OTP on {email}{" "}
            <span
              className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
              onClick={() => changeEmail()}
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
              maxLength={6}
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
            onClick={handleVerifyOTP}
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
              onClick={!isResending ? handleResendOTP : undefined}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-3">
          <p>
            By registering you agree to our{" "}
            <a
              href="https://dest.co.in/privacy-policy"
              className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://dest.co.in/terms-and-conditions"
              className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
            >
              Terms and Conditions
            </a>
            .
          </p>
        </div>
      </CardImageOnRight>
    );
  }

  return loading ? (
    <ContainerCenterCard sm className="h-32 gap-12 [&>svg]:last:size-6">
      <Loader />
    </ContainerCenterCard>
  ) : (
    <CardImageOnRight>
      <div className="flex flex-col items-center gap-1">
        <h2>Register at Dest</h2>
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
        <div className="grid self-stretch gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          <div className="flex items-center gap-2 mt-1">
            <Checkbox
              id="show-password"
              checked={showPassword}
              onCheckedChange={(checked) => setShowPassword(checked)}
            />
            <Label htmlFor="show-password">Show Password</Label>
          </div>
        </div>
        <Button
          className="w-full uppercase"
          onClick={handleContinue}
          disabled={submitting}
        >
          {submitting && <Loader />}
          Continue
        </Button>
      </div>
      <div className="flex flex-col items-center gap-3 [&>p]:text-center">
        <p>
          Already registered ?{" "}
          <span
            className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
        <p>
          By registering you agree to our
          <br />
          <a
            href="https://dest.co.in/privacy-policy"
            className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://dest.co.in/terms-and-conditions"
            className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
          >
            Terms and Conditions
          </a>
          .
        </p>
      </div>
    </CardImageOnRight>
  );
}
