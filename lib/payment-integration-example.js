// Example: How to call the edge function after successful payment

// From your partner dashboard or payment page
async function handlePaymentSuccess(paymentResponse) {
  try {
    // Call your edge function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/record-partner-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          partnerId: "partner-uuid-here",
          plan: "yearly", // or "halfyearly"
          amount: 5666,
          transactionId: paymentResponse.razorpay_payment_id, // or stripe payment id
          paymentGateway: "razorpay", // or "stripe"
        }),
      },
    );

    const result = await response.json();

    if (result.success) {
      console.log("Payment recorded:", result.data);
      // Show success message to partner
      // Redirect to dashboard
      alert("Payment successful! Your account is now active.");
      router.push("/partner/dashboard");
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Error recording payment:", error);
    alert(
      "Payment was successful but failed to activate account. Please contact support.",
    );
  }
}

// Example: Razorpay integration
const razorpayOptions = {
  key: "your_razorpay_key",
  amount: 566600, // amount in paise
  currency: "INR",
  name: "Dest Sports",
  description: "Yearly Subscription",
  handler: function (response) {
    // Payment successful
    handlePaymentSuccess({
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    });
  },
};

// Example: Stripe integration
async function handleStripePayment(paymentIntent) {
  if (paymentIntent.status === "succeeded") {
    await handlePaymentSuccess({
      stripe_payment_id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // convert from cents
    });
  }
}
