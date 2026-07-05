import ProviderLayoutClient from "./ProviderLayoutClient";

export const metadata = {
  title: "Provider Dashboard",
  description: "Manage your EliteCrew profile, bookings, and earnings.",
  robots: { index: false, follow: false },
};

export default function ProviderLayout({ children }) {
  return <ProviderLayoutClient>{children}</ProviderLayoutClient>;
}
