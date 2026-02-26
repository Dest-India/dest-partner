"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";
import {
  CreditCard,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
  UserRound,
  GraduationCap,
  Dumbbell,
  LandPlot,
} from "lucide-react";
import { toast } from "sonner";

import {
  checkPartnerPaymentStatus,
  createPaymentOrder,
  confirmPayment,
} from "./actions";
import { getUserInfo } from "@/lib/store";
import { getTutors, getCourses, getTurfs } from "@/lib/supabase";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 99,
    duration: "1 month",
    totalMonths: 3,
    bonusMonths: 2,
    description: "Best for new businesses and first-time users",
    features: [
      "Full platform access",
      "Manage coaches/trainers",
      "Course & program management",
      "Student & member tracking",
      "Turf booking system",
      "Dashboard analytics",
    ],
    popular: false,
  },
  {
    id: "halfyearly",
    name: "6 Month Plan",
    price: 499,
    duration: "6 months",
    totalMonths: 10,
    bonusMonths: 4,
    description: "Best for growing gyms & academies",
    features: [
      "Everything in Monthly",
      "Extended validity (10 months)",
      "Priority support",
      "Better value per month",
    ],
    popular: true,
  },
  {
    id: "yearly",
    name: "Annual Plan",
    price: 999,
    duration: "1 year",
    totalMonths: 18,
    bonusMonths: 6,
    description: "Best for established, serious partners",
    features: [
      "Everything in 6 Month",
      "Extended validity (18 months)",
      "Highest value per month",
      "Premium support",
    ],
    popular: false,
  },
];

export default function HomeSettingsPaymentPage() {
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem,
  );
  const addBreadcrumbItem = useSidebarStore((state) => state.addBreadcrumbItem);

  const router = useRouter();
  const user = getUserInfo();

  const partnerId = user?.id;

  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [setupComplete, setSetupComplete] = useState(true);
  const [setupCounts, setSetupCounts] = useState({});

  useEffect(() => {
    setActiveSidebarItem("settings");
    addBreadcrumbItem(<Badge variant="secondary">Payment</Badge>);
  }, [setActiveSidebarItem, addBreadcrumbItem]);

  useEffect(() => {
    const checkPayment = async () => {
      if (!partnerId) return;

      try {
        // Run payment status check and setup validation in parallel
        const role = user?.role;
        const promises = [checkPartnerPaymentStatus(partnerId)];

        // Add data fetching promises based on role
        if (role === "Academy") {
          promises.push(
            getTutors(partnerId).catch(() => []),
            getCourses(partnerId).catch(() => []),
          );
        } else if (role === "GYM") {
          promises.push(
            getTutors(partnerId).catch(() => []),
            getCourses(partnerId).catch(() => []),
          );
        } else if (role === "Turf") {
          promises.push(getTurfs(partnerId).catch(() => []));
        }

        // Execute all queries in parallel
        const results = await Promise.all(promises);
        const status = results[0];
        setPaymentInfo(status);

        // Process setup counts
        let counts = {};
        let isComplete = true;

        if (role === "Academy") {
          const coaches = results[1] || [];
          const courses = results[2] || [];
          counts = { coaches: coaches.length, courses: courses.length };
          isComplete = coaches.length > 0 && courses.length > 0;
        } else if (role === "GYM") {
          const trainers = results[1] || [];
          const programs = results[2] || [];
          counts = { trainers: trainers.length, programs: programs.length };
          isComplete = trainers.length > 0 && programs.length > 0;
        } else if (role === "Turf") {
          const turfs = results[1] || [];
          counts = { turfs: turfs.length };
          isComplete = turfs.length > 0;
        }

        setSetupCounts(counts);
        setSetupComplete(isComplete);
      } catch (error) {
        console.error("Error checking payment status:", error);
        toast.error("Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    };

    checkPayment();
  }, [partnerId, user?.role]);

  const handlePayment = useCallback(
    async (plan) => {
      if (!partnerId) {
        toast.error("Something went wrong.");
        router.push("/login");
        return;
      }

      // Check if setup is complete before allowing payment
      if (!setupComplete) {
        let missingItems = [];

        if (user?.role === "Academy") {
          if (setupCounts.coaches === 0) missingItems.push("coaches");
          if (setupCounts.courses === 0) missingItems.push("courses");
          toast.error(
            `Please add at least one ${missingItems.join(
              " and one ",
            )} before subscribing.`,
            { duration: 5000 },
          );
        } else if (user?.role === "GYM") {
          if (setupCounts.trainers === 0) missingItems.push("trainers");
          if (setupCounts.programs === 0) missingItems.push("programs");
          toast.error(
            `Please add at least one ${missingItems.join(
              " and one ",
            )} before subscribing.`,
            { duration: 5000 },
          );
        } else if (user?.role === "Turf") {
          toast.error(
            "Please add at least one turf listing before subscribing.",
            {
              duration: 5000,
            },
          );
        }
        return;
      }

      setCheckoutError("");
      setIsProcessing(true);
      setSelectedPlan(plan.id);

      try {
        const customerDetails = {
          name: user?.name || "Dest Partner",
          email: user?.email || "",
          contact: user?.whatsapp || "",
        };

        const { order, key } = await createPaymentOrder({
          partnerId,
          customer: customerDetails,
          planId: plan.id,
          amount: plan.price,
          duration: plan.duration,
          totalMonths: plan.totalMonths,
        });

        // Load Razorpay script if not loaded
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        const options = {
          key,
          amount: order.amount,
          currency: order.currency,
          name: "Dest Partners",
          description: `${plan.name} - ${plan.totalMonths} months access`,
          order_id: order.id,
          prefill: {
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.contact,
          },
          notes: {
            partner_id: partnerId,
            plan_id: plan.id,
            total_months: plan.totalMonths,
          },
          handler: async (response) => {
            try {
              await confirmPayment({
                partnerId,
                razorpayOrderId: order.id,
                razorpayPaymentId: response.razorpay_payment_id,
                paymentPayload: response,
                planId: plan.id,
                totalMonths: plan.totalMonths,
              });

              setPaymentInfo({
                hasPaid: true,
                planName: plan.name,
                expiresAt: null,
              });
              toast.success(
                `Payment successful! You now have ${plan.totalMonths} months of access.`,
              );
              router.push("/home/dashboard");
            } catch (error) {
              console.error("Payment confirmation failed:", error);
              toast.error("Something went wrong.");
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setSelectedPlan(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Payment initiation failed:", error);
        setCheckoutError(error.message || "Failed to initiate payment");
        setIsProcessing(false);
        setSelectedPlan(null);
      }
    },
    [partnerId, user, router, setupComplete, setupCounts],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-6 w-32 bg-muted rounded"></div>
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-4 w-96 bg-muted rounded"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-border bg-card p-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-32 bg-muted rounded"></div>
                  <div className="h-4 w-48 bg-muted rounded"></div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-3/4 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="sm:w-48 space-y-3">
                  <div className="h-10 w-24 bg-muted rounded"></div>
                  <div className="h-10 w-full bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isExpired = paymentInfo?.isExpired || false;
  const hasPaid = paymentInfo?.hasPaid && !isExpired;

  if (hasPaid && !isExpired) {
    const expiryDate = paymentInfo?.expiresAt
      ? new Date(paymentInfo.expiresAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Status</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full">
              <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Active Subscription
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                You have full access to the platform with your{" "}
                {paymentInfo?.planName || "subscription"}.
              </p>
              {expiryDate && (
                <p className="text-sm text-muted-foreground mt-2">
                  Valid until: <span className="font-medium">{expiryDate}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          New Year 2026 Special Offer
        </div>
        <h1 className="text-2xl font-bold">
          {isExpired ? "Renew Your Subscription" : "Choose Your Plan"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isExpired
            ? "Your subscription has expired. Renew now to continue accessing all features."
            : "Get listed for FREE. Upgrade to manage your business efficiently."}
        </p>
      </div>

      {/* Setup Warning Card */}
      {!setupComplete && !isExpired && (
        <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Complete Your Setup First
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                {user?.role === "Academy" &&
                  "Before subscribing, please add at least one coach and one course to get the most value from your subscription."}
                {user?.role === "GYM" &&
                  "Before subscribing, please add at least one trainer and one program to get the most value from your subscription."}
                {user?.role === "Turf" &&
                  "Before subscribing, please add at least one turf listing to get the most value from your subscription."}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {user?.role === "Academy" && (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-amber-950 text-xs">
                      <UserRound className="w-3.5 h-3.5" />
                      <span className="font-medium">Coaches:</span>
                      <span
                        className={
                          setupCounts.coaches > 0
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {setupCounts.coaches || 0}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-amber-950 text-xs">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="font-medium">Courses:</span>
                      <span
                        className={
                          setupCounts.courses > 0
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {setupCounts.courses || 0}
                      </span>
                    </div>
                  </>
                )}
                {user?.role === "GYM" && (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-amber-950 text-xs">
                      <UserRound className="w-3.5 h-3.5" />
                      <span className="font-medium">Trainers:</span>
                      <span
                        className={
                          setupCounts.trainers > 0
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {setupCounts.trainers || 0}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-amber-950 text-xs">
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span className="font-medium">Programs:</span>
                      <span
                        className={
                          setupCounts.programs > 0
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {setupCounts.programs || 0}
                      </span>
                    </div>
                  </>
                )}
                {user?.role === "Turf" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-amber-950 text-xs">
                    <LandPlot className="w-3.5 h-3.5" />
                    <span className="font-medium">Turfs:</span>
                    <span
                      className={
                        setupCounts.turfs > 0
                          ? "text-green-600 dark:text-green-400 font-semibold"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {setupCounts.turfs || 0}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {user?.role === "Academy" && (
                  <>
                    <Button
                      onClick={() => router.push("/home/coaches")}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-white dark:bg-amber-950"
                    >
                      Add Coaches
                    </Button>
                    <Button
                      onClick={() => router.push("/home/courses")}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-white dark:bg-amber-950"
                    >
                      Add Courses
                    </Button>
                  </>
                )}
                {user?.role === "GYM" && (
                  <>
                    <Button
                      onClick={() => router.push("/home/trainers")}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-white dark:bg-amber-950"
                    >
                      Add Trainers
                    </Button>
                    <Button
                      onClick={() => router.push("/home/programs")}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-white dark:bg-amber-950"
                    >
                      Add Programs
                    </Button>
                  </>
                )}
                {user?.role === "Turf" && (
                  <Button
                    onClick={() => router.push("/home/turfs")}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 bg-white dark:bg-amber-950"
                  >
                    Add Turfs
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Listing Banner */}
      {!isExpired && (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-4">
          <h3 className="text-base font-semibold mb-1.5">
            Free Listing Available!
          </h3>
          <p className="text-xs text-muted-foreground">
            Every gym, turf, and sports academy can get listed for free with
            basic details visible. Upgrade to a paid plan to unlock management
            features and grow your business.
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg ${
              plan.popular
                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md"
                : "border-border bg-card"
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-sm uppercase tracking-wide">
                Most Popular
              </div>
            )}

            {/* Card Content - Horizontal Layout */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Left: Plan Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Pricing & CTA */}
              <div className="sm:w-48 flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-xs text-muted-foreground">
                      / {plan.duration}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold">
                    <Sparkles className="w-3 h-3" />+{plan.bonusMonths} months
                    FREE
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total validity:{" "}
                    <span className="font-semibold text-foreground">
                      {plan.totalMonths} months
                    </span>
                  </p>
                </div>

                {/* Error Message */}
                {checkoutError && selectedPlan === plan.id && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-xs">
                      {checkoutError}
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => handlePayment(plan)}
                  disabled={isProcessing && selectedPlan === plan.id}
                  className={`w-full h-10 text-xs font-semibold ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90 shadow-md"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <Loader />
                  ) : (
                    `Pay ₹${plan.price} - ${plan.totalMonths} Months`
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Why Choose Section */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base font-bold">Why Choose Dest Partners?</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-xs mb-0.5">Secure Payments</p>
              <p className="text-xs text-muted-foreground">
                All transactions processed securely through Razorpay
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-xs mb-0.5">No Hidden Charges</p>
              <p className="text-xs text-muted-foreground">
                Pay once and enjoy your subscription period
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-xs mb-0.5">24/7 Support</p>
              <p className="text-xs text-muted-foreground">
                Dedicated support team ready to help you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
