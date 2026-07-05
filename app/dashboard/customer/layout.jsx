export const metadata = {
  title: "My Dashboard",
  description: "View your bookings and manage your EliteCrew profile.",
  robots: { index: false, follow: false },
};

export default function CustomerDashboardLayout({ children }) {
  return <>{children}</>;
}
