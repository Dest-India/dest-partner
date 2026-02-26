"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { ContainerCenterCard } from '@/components/site/ui/center-cards'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react'
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { updateUserData } from '@/lib/supabase';
import { generateOTP } from "@/lib/store";

export default function RegisterVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(0)
  const [userInfo, setUserInfo] = useState(null)
  const [sentOtp, setSentOtp] = useState('')

  const sendOTPWithNumber = useCallback((phoneNumber, type) => {
    toast.loading(`${type === 'resend' ? 'Resending' : 'Sending'} OTP...`, { id: `${type}-whatsapp` });
    if (!phoneNumber || phoneNumber.trim() === '') {
      console.error(`${type} OTP Error: WhatsApp number is empty or undefined`);
      type === 'resend' ? setIsResending(false) : setLoading(false);
      toast.error("WhatsApp number not found. Please try again.");
      return;
    }

    type === 'resend' ? setIsResending(true) : setLoading(true);

    const generatedOtp = generateOTP();
    setSentOtp(generatedOtp);
    
    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber,
      type: "template",
      template: {
        name: "register_verification_code",
        language: {
          code: "en"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: generatedOtp
              }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: generatedOtp
              }
            ]
          }
        ]
      }
    }

    let token = process.env.NEXT_PUBLIC_WHATSAPP_AUTH_TOKEN;
    let url = process.env.NEXT_PUBLIC_WHATSAPP_API_URL;
    if (!token || !url) {
      console.error("WhatsApp API token or URL is not set in environment variables.");
      type === 'resend' ? setIsResending(false) : setLoading(false);
      toast.error("Failed to send OTP, please try again later !");
      return;
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(async response => {
      if (response.ok) {
        const responseData = await response.json();
        type === 'resend' ? setIsResending(false) : setLoading(false);
        startTimer();
        toast.success("OTP sent successfully !", { id: `${type}-whatsapp` });
        if (type === 'resend') {
          setOtp('');
        }
      } else {
        const errorData = await response.text();
        console.error(`${type} OTP Error:`, {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        type === 'resend' ? setIsResending(false) : setLoading(false);
        toast.error(`Failed to send OTP (${response.status}): ${response.statusText}`, { id: `${type}-whatsapp` });
      }
    })
      .catch(error => {
        console.error(`${type} OTP Fetch Error:`, error)
        type === 'resend' ? setIsResending(false) : setLoading(false);
        toast.error("Failed to send OTP, please try again later !");
      });
  }, []);

  const startTimer = () => {
    setOtpExpiryTimer(120);
  };

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const storedInfo = localStorage.getItem('userInfo');
          if (!storedInfo) {
            router.replace('/register');
            toast.error("Some error occurred, please login or register again !");
            return
          }
          const userInfoData = JSON.parse(storedInfo);
          if (userInfoData && userInfoData.email && userInfoData.id && userInfoData.whatsapp) {
            setUserInfo(userInfoData);
            if (userInfoData.whatsapp_verified && userInfoData.verified) {
              router.replace('/home');
              toast.info("Welcome back !");
            } else if (userInfoData.whatsapp_verified && !userInfoData.verified) {
              router.replace('/register/wait');
              toast.info("Welcome back !");
            } else if (!userInfoData.whatsapp_verified) {
              setWhatsappNumber(userInfoData.whatsapp);
              // Send OTP after setting the number
              setTimeout(() => {
                sendOTPWithNumber(userInfoData.whatsapp, 'initial');
              }, 100);
              setLoading(false);
            }
          } else {
            localStorage.removeItem('userInfo');
            router.replace('/register');
            toast.error("Some error occurred, please login or register again !");
          }
        }
      } catch (error) {
        console.error("Error checking user:", error);
        router.replace('/register');
      }
    };
    checkUser();
  }, [router, sendOTPWithNumber]);

  useEffect(() => {
    let interval;
    if (otpExpiryTimer > 0 && !submitting) {
      interval = setInterval(() => {
        setOtpExpiryTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpExpiryTimer, submitting]);

  const sendOTP = (type) => {
    sendOTPWithNumber(whatsappNumber, type);
  }

  const handleVerifyOTP = async () => {
    toast.loading("Verifying OTP...", { id: "verify-whatsapp" });
    setSubmitting(true);

    if (!otp.trim() || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP", { id: "verify-whatsapp" });
      setSubmitting(false);
      return;
    }

    if (otpExpiryTimer === 0) {
      toast.warning("OTP has expired. Please request a new one.", { id: "verify-whatsapp" });
      setSubmitting(false);
      return;
    }

    // Verify OTP against the sent OTP
    if (otp !== sentOtp) {
      toast.error("Invalid OTP. Please check and try again.", { id: "verify-whatsapp" });
      setSubmitting(false);
      return;
    }

    try {
      // Update user's whatsapp_verified status
      const updatedUser = await updateUserData(userInfo.id, { whatsapp_verified: true });
      if (updatedUser) {
        const updatedUserInfo = { ...userInfo, whatsapp_verified: true };
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

        toast.success("WhatsApp number verified successfully !", { id: "verify-whatsapp" });

        if (updatedUser.verified) {
          router.replace('/home');
          toast.success("Welcome to Dest !", { id: "verify-whatsapp" });
        } else {
          router.replace('/register/wait');
        }
      } else {
        toast.error("Failed to verify WhatsApp number.", { id: "verify-whatsapp" });
      }
    } catch (error) {
      console.error("Error verifying WhatsApp:", error);
      toast.error("Failed to verify WhatsApp number.", { id: "verify-whatsapp" });
    }

    setSubmitting(false);
  }

  const handleResendOTP = () => {
    sendOTP('resend');
  }

  return loading ? <ContainerCenterCard sm className="h-32 gap-12 [&>svg]:last:size-6">
    <Loader />
  </ContainerCenterCard> : <ContainerCenterCard className="!px-6 md:!px-8" sm>
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-center">Verify Your<br />WhatsApp Number</h2>
      <p className="leading-5 text-center">
        We have send you OTP on WhatsApp<br />{whatsappNumber}
      </p>
    </div>
    <div className="w-full flex flex-col items-center gap-4">
      <div className="grid self-stretch gap-2">
        <Label htmlFor="otp">OTP</Label>
        <InputOTP
          id="otp"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={otp}
          onChange={(value) => setOtp(value)}
          className="w-fit"
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
      <Button className="w-full uppercase" onClick={handleVerifyOTP} disabled={submitting}>
        {submitting && <Loader />}
        Verify
      </Button>
    </div>
    <div className="flex flex-col items-center">
      {otpExpiryTimer > 0 ? (
        <p className="text-muted-foreground">
          OTP will expire in {Math.floor(otpExpiryTimer / 60)}:{(otpExpiryTimer % 60).toString().padStart(2, '0')} minutes
        </p>
      ) : (
        <p
          className={`text-sky-500 cursor-pointer ${isResending ? 'opacity-50 cursor-not-allowed' : 'hover:underline underline-offset-4'}`}
          onClick={!isResending ? handleResendOTP : undefined}
        >
          {isResending ? 'Resending...' : 'Resend OTP'}
        </p>
      )}
    </div>
  </ContainerCenterCard>
}
