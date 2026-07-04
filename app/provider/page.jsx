import { redirect } from "next/navigation";

// Legacy route — the polished, filterable provider directory lives at
// /providers. Professionals sign up via /professional/register and complete
// /provider/onboarding afterwards.
export default function ProviderRedirect() {
  redirect("/providers");
}
