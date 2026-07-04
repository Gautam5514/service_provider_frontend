import BrandLoader from "@/components/BrandLoader";

// Route-level loading UI — Next.js shows this automatically while any page in
// the app is being loaded, so every navigation gets the branded spinner.
export default function Loading() {
  return <BrandLoader fullScreen />;
}
