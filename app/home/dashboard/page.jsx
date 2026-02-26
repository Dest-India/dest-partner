"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardIcon,
  Dumbbell,
  GraduationCap,
  LandPlot,
  UserRound,
  TicketCheck,
} from "lucide-react";

import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import { Loader } from "@/components/ui/loader";
import { getUserInfo } from "@/lib/store";
import {
  getDashboardMetrics,
  getTutors,
  getCourses,
  getEnrollments,
  getTurfs,
  getTurfBookings,
} from "@/lib/supabase";
import DashboardCharts from "@/components/dashboard-charts";

export default function HomeDashboardPage() {
  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );

  const [data, setData] = useState({});
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveSidebarItem("dashboard");
  }, [setActiveSidebarItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const partnerId = getUserInfo().id;
        const role = getUserInfo()?.role;
        const response = await getDashboardMetrics(partnerId);
        if (response) {
          setData(response);
        }

        // Fetch chart data based on role
        let chartPromises = [];
        if (role === "Academy") {
          chartPromises = [
            getTutors(partnerId).catch(() => []),
            getCourses(partnerId).catch(() => []),
            getEnrollments(partnerId).catch(() => []),
          ];
        } else if (role === "GYM") {
          chartPromises = [
            getTutors(partnerId).catch(() => []),
            getCourses(partnerId).catch(() => []),
            getEnrollments(partnerId).catch(() => []),
          ];
        } else if (role === "Turf") {
          chartPromises = [
            getTurfs(partnerId).catch(() => []),
            getTurfBookings(partnerId).catch(() => []),
          ];
        }

        const chartResults = await Promise.all(chartPromises);

        if (role === "Academy" || role === "GYM") {
          setChartData({
            tutors: chartResults[0] || [],
            courses: chartResults[1] || [],
            enrollments: chartResults[2] || [],
          });
        } else if (role === "Turf") {
          setChartData({
            turfs: chartResults[0] || [],
            turfBookings: chartResults[1] || [],
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCount = (key) => {
    const value = data?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (first && typeof first.count === "number") {
        return first.count;
      }
    }
    return 0;
  };

  const modifiedData = () => {
    const role = getUserInfo()?.role;
    if (role === "Academy") {
      return [
        {
          label: "Total Coaches",
          icon: UserRound,
          value: getCount("tutors"),
          link: "/home/coaches",
        },
        {
          label: "Total Courses",
          icon: GraduationCap,
          value: getCount("courses"),
          link: "/home/courses",
        },
        {
          label: "Total Students",
          icon: ClipboardIcon,
          value: getCount("enrollments"),
          link: "/home/students",
        },
      ];
    } else if (role === "GYM") {
      return [
        {
          label: "Total Trainers",
          icon: UserRound,
          value: getCount("tutors"),
          link: "/home/trainers",
        },
        {
          label: "Total Programs",
          icon: Dumbbell,
          value: getCount("courses"),
          link: "/home/programs",
        },
        {
          label: "Total Members",
          icon: ClipboardIcon,
          value: getCount("enrollments"),
          link: "/home/members",
        },
      ];
    } else if (role === "Turf") {
      return [
        {
          label: "Total Turfs",
          icon: LandPlot,
          value: getCount("turfs"),
          link: "/home/turfs",
        },
        {
          label: "Total Turf Bookings",
          icon: TicketCheck,
          value: getCount("turf_bookings"),
          link: "/home/turfs/bookings",
        },
      ];
    } else {
      return ["New"];
    }
  };

  const metrics = modifiedData();

  if (loading)
    return (
      <div className="w-full h-32 flex justify-center items-center [&>svg]:size-6">
        <Loader />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {metrics[0] === "New" ? (
        <div className="text-center text-lg font-medium">
          <h1>Welcome to Dest !</h1>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {metrics.map((item, index) => (
              <div
                key={index}
                className="relative flex flex-col border rounded-xl px-5 py-3 hover:shadow overflow-hidden"
                onClick={() => router.replace(item.link)}
              >
                <p className="text-muted-foreground">{item.label}</p>
                <h2>{item.value}</h2>
                <item.icon className="absolute -bottom-4 md:-bottom-6 right-4 size-14 md:size-20 text-muted-foreground/40 stroke-1" />
              </div>
            ))}
          </div>
          <DashboardCharts chartData={chartData} />
        </>
      )}
    </div>
  );
}
