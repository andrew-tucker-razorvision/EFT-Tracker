import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { QuestsClient } from "./QuestsClient";

export const metadata: Metadata = {
  title: "Quest Tracker - EFT Quest Tracker",
  description:
    "Track your Escape from Tarkov quest progress with an interactive dependency tree visualization.",
};

export default async function QuestsPage() {
  const session = await auth();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-4 py-3 border-b bg-background">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quest Tracker</h1>
            <p className="text-xs text-muted-foreground">
              Click a quest to cycle status: Available → In Progress → Completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {session
                ? `Tracking for ${session.user?.email}`
                : "Sign in to save progress"}
            </p>
          </div>
        </div>
      </div>
      <QuestsClient />
    </div>
  );
}
