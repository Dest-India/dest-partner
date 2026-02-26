"use server";

import {
  createPartnerPayment,
  getPartnerPayment,
  updatePartnerPayment,
} from "@/lib/supabase";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

const resolveRazorpayCredentials = () => {
  const keyId =
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error(
      "Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
    throw new Error(
      "Missing Razorpay credentials. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
    );
  }

  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
};

const buildAuthHeaders = () => ({
  Authorization: `Basic ${resolveRazorpayCredentials()}`,
});

export async function checkPartnerPaymentStatus(partnerId) {
  try {
    const payment = await getPartnerPayment(partnerId);

    if (!payment) {
      return { hasPaid: false, isExpired: false };
    }

    // Check if payment has expiry date
    if (payment.expires_at) {
      const now = new Date();
      const expiresAt = new Date(payment.expires_at);
      const isExpired = now > expiresAt;

      return {
        hasPaid: payment.status === "paid",
        isExpired,
        expiresAt: payment.expires_at,
        planName: payment.plan_name,
        planId: payment.plan_id,
        durationMonths: payment.duration_months,
      };
    }

    // Legacy payment without expiry (old ₹999 one-time payment)
    return {
      hasPaid: payment.status === "paid",
      isExpired: false,
      planName: "Legacy Plan",
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
}

export async function createPaymentOrder({
  partnerId,
  customer,
  planId,
  amount,
  duration,
  totalMonths,
}) {
  if (!partnerId) {
    throw new Error("Partner ID is required");
  }

  if (!planId || !amount || !totalMonths) {
    throw new Error("Plan details are required");
  }

  // Check if already paid and not expired
  const existingPaymentStatus = await checkPartnerPaymentStatus(partnerId);
  if (existingPaymentStatus.hasPaid && !existingPaymentStatus.isExpired) {
    throw new Error("You already have an active subscription");
  }

  // Create Razorpay order
  const timestamp = Date.now().toString().slice(-6);
  const receipt = `rcpt_${planId}_${timestamp}`;

  const orderData = {
    amount: amount * 100, // Convert to paisa
    currency: "INR",
    receipt: receipt,
    notes: {
      partner_id: partnerId,
      plan_id: planId,
      duration: duration,
      total_months: totalMonths,
      type: "subscription",
    },
  };

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Unable to create payment order (${response.status}): ${message}`
    );
  }

  const order = await response.json();

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + totalMonths);

  const planNames = {
    monthly: "Monthly Plan",
    halfyearly: "6 Month Plan",
    yearly: "Annual Plan",
  };

  // Create payment record in pending status
  await createPartnerPayment({
    partner_id: partnerId,
    razorpay_order_id: order.id,
    amount: amount * 100,
    currency: "INR",
    status: "pending",
    plan_id: planId,
    plan_name: planNames[planId] || "Unknown Plan",
    duration_months: totalMonths,
    expires_at: expiresAt.toISOString(),
  });

  return {
    order,
    key: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
}

export async function confirmPayment({
  partnerId,
  razorpayOrderId,
  razorpayPaymentId,
  paymentPayload,
  planId,
  totalMonths,
}) {
  if (!partnerId || !razorpayOrderId || !razorpayPaymentId) {
    throw new Error("Missing required parameters");
  }

  // Verify payment with Razorpay
  const verifyResponse = await fetch(
    `${RAZORPAY_API_BASE}/orders/${razorpayOrderId}/payments`,
    {
      headers: buildAuthHeaders(),
    }
  );

  if (!verifyResponse.ok) {
    throw new Error("Failed to verify payment");
  }

  const payments = await verifyResponse.json();
  const payment = payments.items.find((p) => p.id === razorpayPaymentId);

  if (!payment || payment.status !== "captured") {
    throw new Error("Payment verification failed");
  }

  // Update payment record
  const paymentRecord = await updatePartnerPayment(razorpayOrderId, {
    razorpay_payment_id: razorpayPaymentId,
    status: "paid",
  });

  return { success: true, payment: paymentRecord };
}
