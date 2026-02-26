// Onboarding Wait Screen

"use client";

import { ContainerCenterCard } from "@/components/site/ui/center-cards";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RegisterWaitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
              toast.error("User does not exist", { id: "wait" });
              setTimeout(() => {
                toast.info("Please register or login", { id: "wait" });
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
                toast.info("Welcome back !");
              } else if (data.name && !data.verified) {
                toast.info("Please wait till verification is complete !", {
                  id: "wait-info",
                });
                setLoading(false);
              } else if (!data.name) {
                router.replace("/register/onboarding");
                toast.warning("Please complete your onboarding process !");
              }
            } else {
              router.replace("/login");
            }
          } else {
            router.replace("/login");
          }
        }
      } catch (error) {
        console.error("Error checking user:", error);
      }
    };
    checkUser();
  }, [router]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return loading ? (
    <ContainerCenterCard sm className="h-32 gap-12 [&>svg]:last:size-6">
      <Loader />
    </ContainerCenterCard>
  ) : (
    <ContainerCenterCard sm>
      <div className="flex flex-col items-center gap-4 p-2">
        <h2 className="text-center text-green-500">Register Successfully</h2>
        <div className="grid gap-2">
          <p className="leading-5 text-center text-muted-foreground">
            We will verify your authenticity by in-person or call within 2-4
            business days.
          </p>
          <p className="leading-5 text-center">
            Stay tune ! You will get email and message. Only after that you can
            access your account.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="uppercase"
        onClick={() => handleRefresh()}
      >
        Refresh
      </Button>
    </ContainerCenterCard>
  );
}
