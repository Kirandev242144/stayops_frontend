import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../../config/api';
import { toast } from 'react-toastify';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Custom hook to manage Razorpay Gateway connection status and secure payment processing.
 */
export function useRazorpayPayment() {
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState(false);

  useEffect(() => {
    const checkPaymentConfig = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/settings/payment`, {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        if (res.ok) {
          const data = await res.json();
          setIsRazorpayConfigured(data.connectionStatus === "connected" && Boolean(data.keyId));
        }
      } catch (e) {
        setIsRazorpayConfigured(false);
      }
    };
    checkPaymentConfig();
  }, []);

  const handleCollectRazorpay = async ({
    reservationForm,
    pricing,
    selectedProperty,
    updateReservationForm
  }) => {
    if (!reservationForm.guestName.trim() || !reservationForm.guestPhone.trim()) {
      toast.error("Please enter Guest Name and Phone Number first.");
      return;
    }
    const amtToCollect = reservationForm.paymentStatus === 'paid' ? pricing.effectiveTotalAmount : pricing.calculatedPaidAmount;
    if (amtToCollect <= 0) {
      toast.warning("Please enter a valid amount to collect.");
      return;
    }

    let hostKeyId = null;
    try {
      const token = localStorage.getItem("token");
      const checkRes = await fetch(`${API_BASE_URL}/settings/payment`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.connectionStatus === "connected" && data.keyId) {
          hostKeyId = data.keyId;
        } else {
          toast.warning("Razorpay Gateway Not Connected! Go to Settings ➔ Payments to configure your Key ID.");
          return;
        }
      }
    } catch (e) {
      toast.error("Unable to verify Razorpay status. Please check your connection.");
      return;
    }

    if (!hostKeyId) {
      toast.warning("Razorpay Gateway Not Connected! Go to Settings ➔ Payments to configure your Key ID.");
      return;
    }

    const loaded = await loadRazorpayScript();

    if (!loaded || !window.Razorpay) {
      toast.error("Could not load Razorpay SDK. Please check your internet connection.");
      return;
    }

    let orderId = null;
    try {
      const token = localStorage.getItem("token");
      const orderRes = await fetch(`${API_BASE_URL}/payments/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          amount: amtToCollect,
          reservationId: reservationForm.id || null
        })
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData.orderId) {
          orderId = orderData.orderId;
        }
      }
    } catch (err) {
      console.warn("Could not create Razorpay order pre-checkout, falling back to direct SDK mode:", err);
    }

    const options = {
      key: hostKeyId,
      amount: amtToCollect * 100,
      currency: "INR",
      name: "StayOps Homestay & Villa Management",
      description: `Deposit for ${selectedProperty ? selectedProperty.name : ''} (${reservationForm.guestName})`,
      payment_capture: 1,
      order_id: orderId || undefined,
      notes: {
        reservation_id: reservationForm.id ? reservationForm.id.toString() : "",
      },
      prefill: {
        name: reservationForm.guestName,
        contact: reservationForm.guestPhone,
        email: ""
      },
      theme: { color: "#0F172A" },
      handler: function (response) {
        // Enforce strict check on Razorpay payment ID returned by SDK
        const paymentId = response?.razorpay_payment_id;
        if (!paymentId) {
          toast.error("Payment ID was not received from Razorpay gateway.");
          return;
        }

        updateReservationForm("paymentStatus", amtToCollect >= pricing.effectiveTotalAmount ? "paid" : "partial");
        updateReservationForm("paidAmount", amtToCollect);
        updateReservationForm("razorpayPaymentId", paymentId);
        toast.success(`Razorpay Payment Captured (${paymentId}): ₹${amtToCollect.toLocaleString('en-IN')}`);
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay opening error:", err);
      toast.error("Failed to open Razorpay payment window. Please check key configuration.");
    }
  };

  const handleSendWhatsAppPaymentLink = async ({
    reservationForm,
    pricing,
    selectedProperty,
    updateReservationForm
  }) => {
    if (!reservationForm.guestName.trim() || !reservationForm.guestPhone.trim()) {
      toast.error("Please enter Guest Name and Phone Number first.");
      return;
    }

    const amtToCollect = reservationForm.paymentStatus === 'paid' ? pricing.effectiveTotalAmount : (reservationForm.paidAmount || pricing.calculatedPaidAmount);
    if (amtToCollect <= 0) {
      toast.warning("Please enter a valid advance or booking amount to collect.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payments/razorpay/create-payment-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          amount: amtToCollect,
          guestName: reservationForm.guestName.trim(),
          guestPhone: reservationForm.guestPhone.trim(),
          propertyName: selectedProperty ? selectedProperty.name : 'StayOps Property',
          reservationId: reservationForm.id || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        const shortUrl = data.shortUrl || `https://rzp.io/i/stayops-${Date.now()}`;
        const cleanPhone = reservationForm.guestPhone.replace(/[^\d]/g, '');

        const message = `Hello ${reservationForm.guestName.trim()}, thank you for choosing ${selectedProperty ? selectedProperty.name : 'StayOps'}! Please complete your booking advance payment of ₹${amtToCollect.toLocaleString('en-IN')} using this secure Razorpay link: ${shortUrl}`;

        // Reset form payment status to unpaid so saving booking won't create a fake manual payment log
        if (updateReservationForm) {
          updateReservationForm("paymentStatus", "unpaid");
          updateReservationForm("paidAmount", 0);
        }

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        toast.info(`WhatsApp Link sent! Form set to "Pay at Checkout". Razorpay Webhook will auto-update payment when guest pays.`);
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Could not generate Razorpay payment link.");
      }
    } catch (err) {
      console.error("Error creating payment link:", err);
      toast.error("Network error generating payment link. Please check backend.");
    }
  };

  return {
    isRazorpayConfigured,
    handleCollectRazorpay,
    handleSendWhatsAppPaymentLink
  };
}
