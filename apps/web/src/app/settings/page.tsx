import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "Settings - EFT Tracker",
  description: "Manage your EFT Tracker settings and companion app",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <SettingsClient />;
}
