"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { checkPartnerPaymentStatus } from "@/app/home/settings/subscription/actions";
import { getUserInfo } from "./store";

const PaymentContext = createContext({
  hasPaid: false,
  loading: true,
  isExpired: false,
  paymentInfo: null,
  refetch: () => {},
});

export function PaymentProvider({ children }) {
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const fetchPaymentStatus = async () => {
    try {
      const userInfo = getUserInfo();
      if (!userInfo?.id) {
        setHasPaid(false);
        setIsExpired(false);
        setPaymentInfo(null);
        setLoading(false);
        return;
      }

      const status = await checkPartnerPaymentStatus(userInfo.id);
      setPaymentInfo(status);
      setIsExpired(status?.isExpired || false);
      setHasPaid(status?.hasPaid && !status?.isExpired);
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setHasPaid(false);
      setIsExpired(false);
      setPaymentInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();

    // Refresh payment status every 5 minutes to check for expiry
    const interval = setInterval(fetchPaymentStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        hasPaid,
        loading,
        isExpired,
        paymentInfo,
        refetch: fetchPaymentStatus,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePaymentStatus() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePaymentStatus must be used within PaymentProvider");
  }
  return context;
}
