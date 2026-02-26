"use client";

import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import { useRouter } from "next/navigation";
import { usePaymentGate } from "@/hooks/use-payment-gate";
import React, { useEffect, useState } from "react";
import CoursesTable from "@/components/site/courses/courses-table";
import { Loader } from "@/components/ui/loader";
import { getCourses } from "@/lib/supabase";
import { getUserInfo } from "@/lib/store";

export default function HomeCoursesPage() {
  usePaymentGate();

  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState([]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const partnerId = getUserInfo()?.id;
        if (!partnerId) {
          router.push("/login");
          toast.error("Something went wrong.");
          return;
        }
        const response = await getCourses(partnerId);
        setCourseData(response);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    setActiveSidebarItem("courses");
  }, [setActiveSidebarItem]);

  return loading ? (
    <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6">
      <Loader />
    </div>
  ) : (
    <div className="flex flex-col gap-20">
      <CoursesTable courseData={courseData} />
    </div>
  );
}
