"use client";

import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import StudentMemberList from "@/components/site/student-member-list";
import { useRouter } from "next/navigation";
import { usePaymentGate } from "@/hooks/use-payment-gate";
import React, { useEffect } from "react";

export default function HomeStudentsPage() {
  usePaymentGate();

  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );

  useEffect(() => {
    setActiveSidebarItem("students");
  }, [setActiveSidebarItem]);

  return (
    <div className="flex flex-col gap-8">
      <StudentMemberList />
    </div>
  );
}
