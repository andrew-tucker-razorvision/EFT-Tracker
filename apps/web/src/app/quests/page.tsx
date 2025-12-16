import type { Metadata } from "next";
import { QuestsClient } from "./QuestsClient";
import { GuestBanner } from "@/components/guest-banner";

export const metadata: Metadata = {
  title: "Quest Tracker - EFT Quest Tracker",
  description:
    "Track your Escape from Tarkov quest progress with an interactive dependency tree visualization.",
};

export default function QuestsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <GuestBanner />
      <QuestsClient />
    </div>
  );
}
