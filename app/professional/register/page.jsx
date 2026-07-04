import RegisterFlow from "@/components/auth/RegisterFlow";

// EliteCrew Partner (professional) registration — creates a provider account
// and sends them into the 7-step onboarding.
export default function ProfessionalRegisterPage() {
  return <RegisterFlow role="provider" />;
}
