// login page

"use client";

import {
  CardImageOnRight,
  ContainerCenterCard,
} from "@/components/site/ui/center-cards";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      try {
        if (typeof window !== "undefined") {
          let userInfo = null;
          try {
            const storedInfo = localStorage.getItem("userInfo");
            if (storedInfo) {
              userInfo = JSON.parse(storedInfo);
            }
          } catch (parseError) {
            console.error(
              "Error parsing userInfo from localStorage:",
              parseError
            );
            localStorage.removeItem("userInfo");
            router.replace("/login");
            toast.error("Session data corrupted. Please login again.");
            return;
          }
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
              toast.error("User does not exist", { id: "login" });
              setTimeout(() => {
                toast.info("Please register or login", { id: "login" });
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
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
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

    try {
      // Call API to login user with bcrypt verification
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.code === 404 || response.status === 401) {
        toast.error("User does not exist", { id: "login" });
        setSubmitting(false);
        setTimeout(() => {
          toast.info("Please register an account", { id: "login" });
        }, 3000);
        return;
      }

      if (result.success && result.user) {
        const data = result.user;
        const userToStore = { ...data };
        delete userToStore.gallery;
        localStorage.setItem("userInfo", JSON.stringify(userToStore));
        if (data.verified) {
          router.replace("/home");
          toast.success("Welcome back !", { id: "welcome-back" });
        } else if (data && !data.name) {
          router.replace("/register/onboarding");
          toast.info("Please complete your onboarding process !", {
            id: "login",
          });
        } else if (data && !data.verified) {
          router.replace("/register/wait");
          toast.info("Please wait till verification is complete !", {
            id: "wait-info",
          });
        }
      } else {
        toast.error("Invalid email or password", { id: "login" });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please try again.", { id: "login" });
    }
    setSubmitting(false);
  };

  return loading ? (
    <ContainerCenterCard sm className="h-32 gap-12 [&>svg]:last:size-6">
      <Loader />
    </ContainerCenterCard>
  ) : (
    <CardImageOnRight>
      <div className="flex flex-col items-center gap-1">
        <h2>Welcome Back</h2>
        <p>Provide your login credentials to continue</p>
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
          onClick={handleLogin}
          disabled={submitting}
        >
          {submitting && <Loader />}
          Enter
        </Button>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p>
          Didn’t have account ?{" "}
          <span
            className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>
        <p
          className="text-sky-500 hover:underline underline-offset-4 cursor-pointer"
          onClick={() => router.push("/forgot-password")}
        >
          Forget Password ?
        </p>
      </div>
    </CardImageOnRight>
  );
}
