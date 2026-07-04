import RegisterFlow from "@/components/auth/RegisterFlow";

// Customer registration. Professionals use /professional/register.
export default function RegisterPage() {
  return <RegisterFlow role="customer" />;
}
