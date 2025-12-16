"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MousePointerClick,
  Filter,
  Trophy,
  Sparkles,
  Keyboard,
  Focus,
  FastForward,
} from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetStarted: () => void;
  onCatchUp?: () => void;
}

const tips = [
  {
    icon: MousePointerClick,
    title: "Click to Complete",
    description:
      "Click any quest to mark it as completed. Long-press on mobile for details.",
  },
  {
    icon: Focus,
    title: "Focus Mode",
    description:
      "Double-click a quest to highlight its entire chain of prerequisites and dependents.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Navigation",
    description:
      "Use arrow keys to navigate, Enter to complete, Space for details, F for focus.",
  },
  {
    icon: Filter,
    title: "Smart Filters",
    description:
      "Filter by trader, status, or search. Set your PMC level to highlight available quests.",
  },
  {
    icon: Trophy,
    title: "Kappa Container",
    description:
      "Toggle Kappa-only mode to focus on quests required for the Kappa container.",
  },
];

export function WelcomeModal({
  open,
  onOpenChange,
  onGetStarted,
  onCatchUp,
}: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Welcome to EFT Quest Tracker
          </DialogTitle>
          <DialogDescription>
            Track your Escape from Tarkov quest progress across all traders.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <tip.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onGetStarted} className="w-full">
            Start Fresh
          </Button>
          {onCatchUp && (
            <Button variant="outline" onClick={onCatchUp} className="w-full">
              <FastForward className="h-4 w-4 mr-2" />
              Already mid-wipe? Catch up
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
