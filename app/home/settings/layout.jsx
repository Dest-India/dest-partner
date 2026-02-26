"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, UserRound, Wallet } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const settingsTab = [
  {
    id: "account",
    icon: Settings2,
    label: "Account",
  },
  {
    id: "profile",
    icon: UserRound,
    label: "Profile",
  },
  {
    id: "subscription",
    icon: Wallet,
    label: "Payment",
  },
];

export default function SettingLayout({ children }) {
  const [activeTab, setActiveTab] = useState(settingsTab[0].id);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const pathSegments = pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    const matchingTab = settingsTab.find((tab) => tab.id === lastSegment);

    if (matchingTab) {
      setActiveTab(matchingTab.id);
    } else if (lastSegment === "settings") {
      // If on /home/settings, redirect to account
      router.replace(`/home/settings/${settingsTab[0].id}`);
    } else {
      setActiveTab(settingsTab[0].id);
    }
  }, [pathname, router]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.push(`/home/settings/${newTab}`);
  };

  return (
    <div className="max-w-4xl flex flex-col md:flex-row gap-8 md:gap-20">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="sticky -top-6 md:top-0 w-[calc(100%+3rem)] md:w-58 -mx-6 md:m-0 justify-center md:justify-start md:self-start z-50"
      >
        <TabsList className="w-full justify-start md:gap-1 h-auto md:flex-col bg-transparent backdrop-blur-xl rounded-none p-2 px-6 md:p-0 m-0 overflow-x-auto snap-x scroll-px-6">
          {settingsTab.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="md:w-full px-2.5 md:py-1.5 gap-2 justify-start data-[state=active]:bg-secondary data-[state=active]:text-primary dark:data-[state=active]:bg-sidebar-primary/40 dark:data-[state=active]:text-sidebar-primary-foreground dark:data-[state=active]:border-none data-[state=active]:shadow-none snap-start cursor-pointer"
            >
              <tab.icon className="hidden md:block" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex-1">{children}</div>
    </div>
  );
}
