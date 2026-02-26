"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserInfo } from "@/lib/store";
import { cn } from "@/lib/utils";

const chartConfig = {
  tutors: {
    label: "Coaches",
    color: "var(--chart-1)",
  },
  courses: {
    label: "Courses",
    color: "var(--chart-2)",
  },
  enrollments: {
    label: "Students",
    color: "var(--chart-3)",
  },
  turfs: {
    label: "Turfs",
    color: "var(--chart-1)",
  },
  turfBookings: {
    label: "Turf Bookings",
    color: "var(--chart-2)",
  },
  trainers: {
    label: "Trainers",
    color: "var(--chart-1)",
  },
  programs: {
    label: "Programs",
    color: "var(--chart-2)",
  },
  members: {
    label: "Members",
    color: "var(--chart-3)",
  },
};

const timeRangeOptions = [
  { value: "365d", label: "Last 1 Year" },
  { value: "180d", label: "Last 6 Months" },
  { value: "90d", label: "Last 3 Months" },
  { value: "60d", label: "Last 2 Months" },
  { value: "30d", label: "Last Month" },
  { value: "7d", label: "Last 7 Days" },
];

export default function DashboardCharts({ chartData }) {
  const role = getUserInfo()?.role?.toLowerCase();

  // Determine which data to show based on role
  const dataKeys = React.useMemo(() => {
    switch (role) {
      case 'academy':
        return ['tutors', 'courses', 'enrollments'];
      case 'turf':
        return ['turfs', 'turfBookings'];
      case 'gym':
        return ['trainers', 'programs', 'members'];
      default:
        return ['tutors', 'courses', 'enrollments'];
    }
  }, [role]);

  const [timeRange, setTimeRange] = React.useState("90d");
  const [activeTab, setActiveTab] = React.useState(dataKeys[0] || "tutors");

  // Update activeTab when dataKeys changes
  React.useEffect(() => {
    if (dataKeys.length > 0 && !dataKeys.includes(activeTab)) {
      setActiveTab(dataKeys[0]);
    }
  }, [dataKeys, activeTab]);

  // Helper function to aggregate data by day
  const aggregateByDay = (data, dateField = "created_at") => {
    const aggregated = {};

    data.forEach((item) => {
      if (!item[dateField]) return;

      const date = new Date(item[dateField]);
      if (isNaN(date.getTime())) return;

      const dayKey = date.toISOString().split("T")[0];

      if (!aggregated[dayKey]) {
        aggregated[dayKey] = 0;
      }
      aggregated[dayKey]++;
    });

    return Object.entries(aggregated)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Aggregate data based on role
  const getAggregatedData = () => {
    const result = {};
    dataKeys.forEach(key => {
      let data = [];
      if (role === 'gym') {
        if (key === 'trainers') data = chartData.tutors || [];
        else if (key === 'programs') data = chartData.courses || [];
        else if (key === 'members') data = chartData.enrollments || [];
      } else {
        data = chartData[key] || [];
      }
      result[key] = aggregateByDay(data);
    });
    return result;
  };

  const aggregatedData = getAggregatedData();

  // Process data based on time range
  const getProcessedData = (data, timeRange) => {
    const now = new Date();
    const startDate = new Date(now);

    switch (timeRange) {
      case "365d":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "180d":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "90d":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "60d":
        startDate.setMonth(startDate.getMonth() - 2);
        break;
      case "30d":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 3);
    }

    return data.filter((item) => new Date(item.date) >= startDate);
  };

  const processedData = getProcessedData(aggregatedData[activeTab] || [], timeRange);

  // Calculate total
  const total = processedData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const getTimeRangeLabel = (timeRange) => {
    switch (timeRange) {
      case "365d":
        return "Last 1 Year";
      case "180d":
        return "Last 6 Months";
      case "90d":
        return "Last 3 Months";
      case "60d":
        return "Last 2 Months";
      case "30d":
        return "Last Month";
      case "7d":
        return "Last 7 Days";
      default:
        return "Last 3 Months";
    }
  };

  if (dataKeys.length === 0) return null;

  return (
    <div className="mt-6">
      <Card>
        <CardHeader className="flex flex-col gap-1 border-b">
          <CardTitle className="text-lg font-semibold">
            Growth Trends
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Showing growth over time
          </CardDescription>
          <div className="w-full flex flex-col md:flex-row gap-3 mt-2 [&>button,div]:w-full md:[&>button,div]:w-fit">
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger aria-label="Select time range">
                <SelectValue placeholder={getTimeRangeLabel(timeRange)} />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dataKeys.length > 1 && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={cn("grid w-full grid-cols-3", dataKeys.length === 2 && "grid-cols-2", dataKeys.length === 4 && "grid-cols-4")}>
                  {dataKeys.map((key) => (
                    <TabsTrigger key={key} value={key} className="flex items-center justify-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {chartConfig[key]?.label}
                      </span>
                      <span className="text-sm font-bold leading-none">
                        {aggregatedData[key]?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            id="dashboard-chart"
            config={chartConfig}
            className="aspect-auto h-64 w-full"
          >
            <BarChart
              accessibilityLayer
              data={processedData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
              />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }} />}
                cursor={false}
                defaultIndex={1}
              />
              <Bar dataKey="count" radius={8} fill={`var(--color-${activeTab})`} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}