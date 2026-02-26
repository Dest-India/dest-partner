"use client";

import { usePaymentStatus } from "@/lib/payment-context";

/**
 * Hook to get payment status information
 * No route protection - all routes accessible for onboarding
 */
export function usePaymentGate() {
  const { hasPaid, loading, isExpired } = usePaymentStatus();

  return { hasPaid, loading, isExpired };
}
