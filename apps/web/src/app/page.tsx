import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GitBranch, CheckCircle2, Users, Map, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Quest Dependencies",
    description:
      "Visual tree showing quest prerequisites and unlock paths across all traders.",
  },
  {
    icon: CheckCircle2,
    title: "Progress Tracking",
    description:
      "Track your quest status with automatic unlocking when prerequisites are completed.",
  },
  {
    icon: Users,
    title: "All Traders",
    description:
      "Complete quest data for Prapor, Therapist, Skier, Peacekeeper, Mechanic, Ragman, Jaeger, and Fence.",
  },
  {
    icon: Map,
    title: "Map Filtering",
    description: "Filter quests by map location to plan efficient raid routes.",
  },
  {
    icon: Zap,
    title: "Kappa Tracking",
    description:
      "Highlight quests required for the Kappa container to optimize your progression.",
  },
  {
    icon: Shield,
    title: "Guest Mode",
    description:
      "Browse all quests without an account. Sign up to save your progress.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
            Track Your Tarkov Quest Progress
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Interactive quest tree visualization with dependency tracking,
            progress saving, and Kappa container optimization for Escape from
            Tarkov.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="text-base">
              <Link href="/quests">Browse Quests</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No account required to browse quests
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-lg p-6 border shadow-sm"
              >
                <feature.icon className="h-8 w-8 mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Track Your Progress?
          </h2>
          <p className="text-muted-foreground mb-6">
            Create a free account to save your quest progress across sessions
            and devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Sign Up Free</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/login">Already have an account?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Quest data sourced from the Tarkov community. Not affiliated with
            Battlestate Games.
          </p>
        </div>
      </footer>
    </div>
  );
}
