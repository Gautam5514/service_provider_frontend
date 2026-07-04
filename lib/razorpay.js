// Razorpay web-checkout helpers.
//
// Flow (all amounts are authoritative on the server — never trusted here):
//   1. POST /payments/order { bookingId }  → { keyId, order, prefill }
//   2. open Razorpay checkout with that order
//   3. on success → POST /payments/verify  → booking marked paid
//
// The one script we load is Razorpay's official checkout.js. It's injected once
// and cached; concurrent/repeat calls reuse the same promise.

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise = null;

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => { scriptPromise = null; resolve(false); });
      if (window.Razorpay) resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { scriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

// Opens the checkout modal for an order and resolves with a status object:
//   { status: "success", payment }         — user paid (not yet verified)
//   { status: "dismissed" }                — user closed the modal
//   { status: "failed", error }            — Razorpay reported a failure
//
// The caller verifies "success" with the backend before trusting it.
export function openRazorpayCheckout({ keyId, order, prefill, name, description, theme }) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) return reject(new Error("Razorpay failed to load."));

    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };

    const rzp = new window.Razorpay({
      key: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || "INR",
      name: name || "EliteCrew",
      description: description || "Service booking",
      prefill: prefill || {},
      theme: theme || { color: "#0A0A0A" },
      // User closed the sheet without paying.
      modal: { ondismiss: () => finish({ status: "dismissed" }) },
      handler: (response) => finish({ status: "success", payment: response }),
    });

    // Razorpay fires this on a declined card / failed UPI, etc.
    rzp.on("payment.failed", (resp) => {
      finish({ status: "failed", error: resp?.error?.description || "Payment failed." });
    });

    rzp.open();
  });
}
