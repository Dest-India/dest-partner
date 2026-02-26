"use client";

import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import { useRouter } from "next/navigation";
import { usePaymentGate } from "@/hooks/use-payment-gate";
import React, { useEffect } from "react";
import TurfsList from "@/components/site/turfs/turfs-list";
import { getUserInfo } from "@/lib/store";

export default function HomeTurfsPage() {
  usePaymentGate();

  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );

  useEffect(() => {
    const user = getUserInfo();
    if (user?.role !== "Turf") {
      router.push("/home/dashboard");
      return;
    }
    setActiveSidebarItem("turfs");
  }, [setActiveSidebarItem, router]);

  return (
    <div className="flex flex-col gap-4">
      <TurfsList />
    </div>
  );
}
