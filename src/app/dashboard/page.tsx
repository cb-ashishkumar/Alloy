import { DashboardClient } from "@/components/DashboardClient";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");

  return (
    <main className="min-h-screen px-6 py-12">
      <DashboardClient />
    </main>
  );
}

