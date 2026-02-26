"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/site/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Loader } from "@/components/ui/loader";
import { PaymentProvider } from "@/lib/payment-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function HomeLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const safeSetLoading = (value) => {
      if (isMounted) {
        setLoading(value);
      }
    };

    const enforceAccess = async () => {
      try {
        if (typeof window === "undefined") {
          safeSetLoading(false);
          return;
        }

        safeSetLoading(true);

        try {
          const storedInfo = localStorage.getItem("userInfo");
          if (!storedInfo) {
            router.replace("/login");
            toast.error("Please login to continue");
            return;
          }

          const userInfo = JSON.parse(storedInfo);
          const hasCoreDetails = Boolean(
            userInfo && userInfo.email && userInfo.id
          );

          if (!hasCoreDetails) {
            localStorage.removeItem("userInfo");
            router.replace("/login");
            toast.error("Session expired. Please login again");
            return;
          }

          if (userInfo.name && !userInfo.verified) {
            router.replace("/register/wait");
            return;
          }

          if (!userInfo.name) {
            router.replace("/register/onboarding");
            return;
          }

          // Allow access - payment check is handled by individual pages
          safeSetLoading(false);
        } catch (error) {
          console.error("Error checking user:", error);
          router.replace("/login");
          toast.error("Something went wrong");
          return;
        }
      } catch (error) {
        console.error("Unexpected error during access check:", error);
        safeSetLoading(false);
      }
    };

    enforceAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center [&>svg]:size-5">
        <Loader />
      </div>
    );
  }

  return (
    <PaymentProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <section
            suppressHydrationWarning
            className="w-full h-[calc(100vh-var(--header-height)-24px)] p-6 md:px-24 overflow-y-auto"
          >
            {children}
          </section>
        </SidebarInset>
      </SidebarProvider>
    </PaymentProvider>
  );
}
