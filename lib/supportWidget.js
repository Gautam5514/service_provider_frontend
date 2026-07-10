// Tiny pub-sub so any page (e.g. a booking detail page) can open the global
// floating SupportWidget pre-filled for a specific booking, without prop
// drilling or a state library.
export const SUPPORT_OPEN_EVENT = "elitecrew:open-support";

export function openSupportWidget({ bookingId, bookingNumber, serviceName, category } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUPPORT_OPEN_EVENT, {
    detail: { bookingId, bookingNumber, serviceName, category },
  }));
}
