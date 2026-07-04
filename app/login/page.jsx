import LoginFlow from "@/components/auth/LoginFlow";

// Customer sign-in. Providers use /professional/login (the backend blocks a
// provider from authenticating through this customer portal).
export default function LoginPage() {
  return <LoginFlow portal="customer" />;
}
