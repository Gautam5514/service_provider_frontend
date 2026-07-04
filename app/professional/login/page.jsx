import LoginFlow from "@/components/auth/LoginFlow";

// EliteCrew Partner (professional) sign-in. Only provider accounts can log in
// here — the backend rejects customer/admin accounts on this portal.
export default function ProfessionalLoginPage() {
  return <LoginFlow portal="professional" />;
}
