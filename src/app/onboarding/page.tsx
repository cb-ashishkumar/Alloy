import { authOptions } from "@/lib/auth";
import { getCustomer } from "@/lib/chargebee";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./ui";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");

  const existing = await getCustomer(session.customer_id);
  if (existing) redirect("/dashboard");

  return (
    <main className="min-h-screen px-6 py-12">
      <OnboardingClient initialEmail={session.user?.email ?? ""} />
    </main>
  );
}

