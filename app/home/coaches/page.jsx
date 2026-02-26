"use client";

import CoachList from "@/components/site/coach-list";
import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import { useRouter } from "next/navigation";
import { usePaymentGate } from "@/hooks/use-payment-gate";
import React, { useEffect } from "react";

export default function HomeCoachesPage() {
  usePaymentGate();

  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );

  useEffect(() => {
    setActiveSidebarItem("coaches");
  }, [setActiveSidebarItem]);

  return (
    <div className="flex flex-col gap-4">
      <CoachList />
    </div>
  );
}
