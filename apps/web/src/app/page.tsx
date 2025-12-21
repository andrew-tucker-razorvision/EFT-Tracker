"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Feature data
const features = [
  {
    number: "01",
    label: "Efficiency",
    icon: "⚡",
    title: "Smart Map Selection",
    description:
      "See exactly which map has the most available quests for you. No more guessing.",
  },
  {
    number: "02",
    label: "Planning",
    icon: "📋",
    title: "Raid Checklists",
    description:
      "Build a task list before each raid. Know exactly what you need to accomplish.",
  },
  {
    number: "03",
    label: "Progress",
    icon: "📊",
    title: "Track Everything",
    description:
      "Your progress syncs automatically. Pick up where you left off anytime.",
  },
  {
    number: "04",
    label: "Visibility",
    icon: "🌳",
    title: "Visual Quest Chains",
    description:
      "See quest dependencies at a glance. Never get blocked by prerequisites.",
  },
  {
    number: "05",
    label: "Goals",
    icon: "🏆",
    title: "Kappa Tracking",
    description:
      "Know exactly which quests you need for Kappa container. Stay on track.",
  },
  {
    number: "06",
    label: "Speed",
    icon: "🎯",
    title: "No Alt-Tabbing",
    description:
      "Everything in one place. Second monitor friendly. Fast and focused.",
  },
];

// Stats data
const stats = [
  { value: "200+", label: "Quests Tracked" },
  { value: "9", label: "Traders" },
  { value: "13", label: "Maps" },
  { value: "2.4K+", label: "Users" },
];

type ToolTab = "map-picker" | "raid-planner" | "quest-tree";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ToolTab>("map-picker");

  const toolTitles: Record<ToolTab, string> = {
    "map-picker": "Map Picker",
    "raid-planner": "Raid Planner",
    "quest-tree": "Quest Tree",
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Tactical Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Hero Section */}
      <section className="relative z-10 min-h-[calc(100vh-64px)] flex items-center py-16 px-8">
        {/* Radial gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(196, 170, 106, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(139, 69, 19, 0.03) 0%, transparent 40%)
            `,
          }}
        />

        <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center relative z-10">
          {/* Hero Text */}
          <div className="max-w-[560px]">
            {/* Patch Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-panel)] border border-[var(--tactical-border)] mb-6">
              <div className="w-2 h-2 bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
              <span className="font-[family-name:var(--font-rajdhani)] text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Updated for Patch 1.0
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-rajdhani)] text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6 uppercase tracking-tight">
              Stop Wasting Raids
              <span className="block text-[var(--accent-gold)]">
                Know Your Objectives
              </span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
              Pick the right map, plan your tasks, track your progress. Know
              exactly what to do before you load in.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="tactical" size="lg" asChild>
                <Link href="/quests">Start Planning</Link>
              </Button>
              <Button variant="tactical-ghost" size="lg" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>

            <p className="mt-4 font-[family-name:var(--font-rajdhani)] text-sm text-[var(--text-dim)] tracking-wide">
              Join 2,400+ players already tracking progress
            </p>
          </div>

          {/* Quick Win Card */}
          <div className="relative bg-[var(--bg-panel)] border border-[var(--tactical-border)]">
            {/* Outer glow border */}
            <div className="absolute -inset-1 border border-[var(--accent-gold-glow)] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--tactical-border)]">
              <span className="font-[family-name:var(--font-rajdhani)] text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Your Next Raid
              </span>
              <span className="font-[family-name:var(--font-rajdhani)] text-xs font-bold px-2 py-1 bg-[var(--accent-gold-dim)] text-[var(--accent-gold)] uppercase tracking-wide">
                Preview
              </span>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Map Recommendation */}
              <div className="flex items-center gap-4 p-4 bg-[var(--bg-elevated)] border border-[var(--available)] mb-6">
                <span className="text-2xl">📍</span>
                <div>
                  <h4 className="font-[family-name:var(--font-rajdhani)] text-base font-bold text-[var(--text-bright)] uppercase">
                    Customs
                  </h4>
                  <p className="text-sm text-[var(--available)]">
                    5 quests available
                  </p>
                </div>
                <span className="ml-auto font-[family-name:var(--font-rajdhani)] text-xs font-bold px-2 py-1 bg-[var(--available)] text-[var(--bg-dark)] uppercase">
                  Best Choice
                </span>
              </div>

              {/* Task List */}
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { task: "Kill 5 Scavs", trader: "Prapor", kappa: false },
                  { task: "Mark the fuel tank", trader: "Prapor", kappa: false },
                  { task: "Find 2x Salewa", trader: "Therapist", kappa: true },
                  { task: "Extract via ZB-1011", trader: "Any", kappa: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border-l-[3px] ${
                      item.kappa
                        ? "border-l-[var(--kappa)]"
                        : "border-l-[var(--available)]"
                    }`}
                  >
                    <span className="w-4 h-4 border-2 border-[var(--tactical-border)] rounded-sm flex-shrink-0" />
                    <span className="text-sm text-[var(--text-bright)] flex-1">
                      {item.task}
                    </span>
                    <span className="font-[family-name:var(--font-rajdhani)] text-xs text-[var(--text-dim)] uppercase">
                      {item.trader}
                    </span>
                    {item.kappa && (
                      <span className="text-xs text-[var(--kappa)]">κ</span>
                    )}
                  </div>
                ))}
              </div>

              <Button variant="tactical" className="w-full justify-center" asChild>
                <Link href="/quests">Plan This Raid →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Showcase Section */}
      <section id="tools" className="relative z-10 py-16 px-8">
        <div className="max-w-[1100px] mx-auto">
          {/* Tab Buttons */}
          <div className="flex justify-center gap-2 mb-6">
            {(["map-picker", "raid-planner", "quest-tree"] as ToolTab[]).map(
              (tab, i) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-6 py-4 font-[family-name:var(--font-rajdhani)] text-sm font-bold uppercase tracking-wide transition-all border ${
                    activeTab === tab
                      ? "bg-[var(--accent-gold-dim)] border-[var(--accent-gold)] text-[var(--accent-gold)]"
                      : "bg-[var(--bg-panel)] border-[var(--tactical-border)] text-[var(--text-secondary)] hover:border-[var(--tactical-border-hover)] hover:text-[var(--text-bright)]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      activeTab === tab
                        ? "bg-[var(--accent-gold)] text-[var(--bg-dark)]"
                        : "bg-[var(--bg-card)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {toolTitles[tab]}
                </button>
              )
            )}
          </div>

          {/* Tool Preview Frame */}
          <div className="bg-[var(--bg-panel)] border border-[var(--tactical-border)] rounded-lg overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--tactical-border)]">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-[family-name:var(--font-rajdhani)] text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {toolTitles[activeTab]}
              </span>
              <span className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--tactical-border)] rounded text-xs text-[var(--text-dim)]">
                learntotarkov.com/quests
              </span>
            </div>

            {/* Tool Content */}
            <div className="p-6 min-h-[350px]">
              {activeTab === "map-picker" && <MapPickerPreview />}
              {activeTab === "raid-planner" && <RaidPlannerPreview />}
              {activeTab === "quest-tree" && <QuestTreePreview />}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 bg-[var(--bg-panel)] border-y border-[var(--tactical-border)] py-8 px-8">
        <div className="max-w-[1200px] mx-auto flex justify-around items-center flex-wrap gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-[family-name:var(--font-rajdhani)] text-4xl font-bold text-[var(--accent-gold)] leading-none">
                {stat.value}
              </div>
              <div className="font-[family-name:var(--font-rajdhani)] text-sm font-semibold text-[var(--text-dim)] uppercase tracking-wider mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-8">
        <div className="text-center mb-16">
          <div className="font-[family-name:var(--font-rajdhani)] text-sm font-bold text-[var(--accent-gold)] uppercase tracking-[0.15em] mb-4">
            Why Use This?
          </div>
          <h2 className="font-[family-name:var(--font-rajdhani)] text-3xl md:text-4xl font-bold uppercase mb-4">
            Every Raid Counts
          </h2>
          <p className="text-[var(--text-secondary)] max-w-[560px] mx-auto">
            Stop wasting time alt-tabbing to wikis. Get the info you need in one
            place.
          </p>
        </div>

        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-[var(--bg-panel)] border border-[var(--tactical-border)] p-8 transition-all hover:border-[var(--tactical-border-hover)] hover:-translate-y-0.5"
            >
              <div className="font-[family-name:var(--font-rajdhani)] text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">
                {feature.number} {"// "}{feature.label}
              </div>
              <div className="text-2xl mb-4 opacity-80">{feature.icon}</div>
              <h3 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-[700px] mx-auto text-center p-16 bg-[var(--bg-panel)] border border-[var(--tactical-border)] relative">
          {/* Outer glow */}
          <div className="absolute -inset-1.5 border border-[var(--accent-gold-glow)] pointer-events-none" />

          <h2 className="font-[family-name:var(--font-rajdhani)] text-2xl md:text-3xl font-bold uppercase mb-4">
            Ready to Stop Wasting Raids?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-[480px] mx-auto">
            Join thousands of players who plan smarter and progress faster.
          </p>
          <Button variant="tactical" size="lg" asChild>
            <Link href="/quests">Start Planning Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--tactical-border)] py-8 px-8 mt-auto">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center flex-wrap gap-4">
          <span className="font-[family-name:var(--font-rajdhani)] text-sm text-[var(--text-dim)] tracking-wide">
            © 2025 Learn to Tarkov. Not affiliated with Battlestate Games.
          </span>
          <div className="flex gap-6">
            <a
              href="#"
              className="font-[family-name:var(--font-rajdhani)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors tracking-wide"
            >
              Discord
            </a>
            <a
              href="#"
              className="font-[family-name:var(--font-rajdhani)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors tracking-wide"
            >
              GitHub
            </a>
            <a
              href="#"
              className="font-[family-name:var(--font-rajdhani)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors tracking-wide"
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Map Picker Preview Component
function MapPickerPreview() {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-6">
      {/* Next Up Panel */}
      <div className="bg-[var(--bg-card)] border border-[var(--tactical-border)] p-4">
        <div className="font-[family-name:var(--font-rajdhani)] text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
          💡 Next Up
        </div>
        {[
          { name: "Debut", trader: "Prapor • Customs", kappa: true },
          { name: "Checking", trader: "Prapor • Customs", kappa: true },
          { name: "Shortage", trader: "Therapist • Any", kappa: false },
        ].map((quest, i) => (
          <div
            key={i}
            className={`p-2 bg-[var(--bg-elevated)] border-l-[3px] mb-2 ${
              quest.kappa
                ? "border-l-[var(--kappa)]"
                : "border-l-[var(--available)]"
            }`}
          >
            <h5 className="font-[family-name:var(--font-rajdhani)] font-bold text-sm">
              {quest.name}
            </h5>
            <p className="text-xs text-[var(--text-dim)]">{quest.trader}</p>
            {quest.kappa && (
              <span className="text-xs text-[var(--kappa)]">⭐ Kappa</span>
            )}
          </div>
        ))}
      </div>

      {/* Map Columns */}
      <div className="flex gap-4">
        {[
          {
            map: "Customs",
            completed: 0,
            available: 5,
            quests: ["Debut", "Checking", "Delivery from the Past"],
          },
          {
            map: "Any Location",
            completed: 0,
            available: 2,
            quests: ["Shortage", "Sanitary Standards"],
          },
        ].map((col) => (
          <div
            key={col.map}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--tactical-border)]"
          >
            <div className="p-4 border-b border-[var(--tactical-border)]">
              <h4 className="font-[family-name:var(--font-rajdhani)] font-bold uppercase">
                {col.map}
              </h4>
              <p className="text-xs text-[var(--text-dim)]">
                {col.completed}/{col.available} completed (
                <span className="text-[var(--available)]">
                  {col.available} available
                </span>
                )
              </p>
            </div>
            {col.quests.map((quest) => (
              <div
                key={quest}
                className="px-4 py-2 border-b border-[var(--tactical-border)] last:border-b-0"
              >
                <h5 className="font-[family-name:var(--font-rajdhani)] font-semibold text-sm text-[var(--text-bright)]">
                  {quest}
                </h5>
                <p className="text-xs text-[var(--text-dim)]">Prapor Lv.1</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Raid Planner Preview Component
function RaidPlannerPreview() {
  return (
    <div className="grid grid-cols-[1fr_220px] gap-6">
      {/* Main Panel */}
      <div className="bg-[var(--bg-card)] border border-[var(--tactical-border)] p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--tactical-border)]">
          <span className="text-xl">📋</span>
          <h3 className="font-[family-name:var(--font-rajdhani)] font-bold uppercase">
            Raid Planner
          </h3>
          <select
            aria-label="Select map"
            className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--tactical-border)] text-[var(--text-bright)] font-[family-name:var(--font-rajdhani)] text-sm"
          >
            <option>Customs</option>
          </select>
          <span className="ml-auto text-sm text-[var(--text-dim)]">
            3 quests, 7 objectives
          </span>
        </div>

        <div className="bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-[var(--available)]" />
            <h4 className="font-[family-name:var(--font-rajdhani)] font-bold">
              Debut
            </h4>
            <span className="ml-auto text-xs text-[var(--text-dim)]">
              Prapor
            </span>
          </div>
          {["Kill 5 Scavs on Customs", "Pick up 2 MP-133 shotguns"].map(
            (obj, i) => (
              <div
                key={i}
                className="py-2 pl-6 text-sm text-[var(--text-secondary)] border-l-2 border-[var(--tactical-border)] ml-1.5 mb-2"
              >
                {obj}
              </div>
            )
          )}
        </div>
      </div>

      {/* Suggested Maps */}
      <div className="bg-[var(--bg-card)] border border-[var(--tactical-border)] p-4">
        <div className="font-[family-name:var(--font-rajdhani)] text-sm font-bold text-[var(--text-secondary)] uppercase mb-4">
          💡 Suggested Maps
        </div>
        {[
          { map: "Customs", quests: 5, objectives: 12, best: true },
          { map: "Woods", quests: 3, objectives: 8, best: false },
          { map: "Factory", quests: 2, objectives: 4, best: false },
        ].map((item) => (
          <div
            key={item.map}
            className={`flex items-center justify-between p-2 bg-[var(--bg-elevated)] mb-2 ${
              item.best ? "border border-[var(--available)]" : ""
            }`}
          >
            <div>
              <h5 className="font-[family-name:var(--font-rajdhani)] font-bold text-sm">
                {item.map}
              </h5>
              <p className="text-xs text-[var(--text-dim)]">
                {item.quests} quests, {item.objectives} objectives
              </p>
            </div>
            {item.best && (
              <span className="font-[family-name:var(--font-rajdhani)] text-xs font-bold px-1.5 py-0.5 bg-[var(--available)] text-[var(--bg-dark)] uppercase">
                Best
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Quest Tree Preview Component
function QuestTreePreview() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--tactical-border)]">
        <h3 className="font-[family-name:var(--font-rajdhani)] font-bold uppercase">
          Quest Dependencies
        </h3>
        <div className="flex gap-2">
          {["All", "Kappa", "Available"].map((filter, i) => (
            <button
              key={filter}
              type="button"
              className={`px-2 py-1 font-[family-name:var(--font-rajdhani)] text-xs border ${
                i === 0
                  ? "bg-[var(--accent-gold-dim)] border-[var(--accent-gold)] text-[var(--accent-gold)]"
                  : "bg-[var(--bg-panel)] border-[var(--tactical-border)] text-[var(--text-secondary)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Chains */}
      <div className="flex gap-6 p-4 bg-[var(--bg-card)] border border-[var(--tactical-border)] overflow-x-auto">
        {[
          {
            quests: [
              { name: "Debut", trader: "Prapor", status: "completed" },
              { name: "Checking", trader: "Prapor", status: "available" },
              { name: "Shootout Picnic", trader: "Prapor", status: "locked" },
            ],
          },
          {
            quests: [
              { name: "Shortage", trader: "Therapist", status: "completed" },
              {
                name: "Sanitary Standards",
                trader: "Therapist",
                status: "available",
              },
              {
                name: "Painkiller",
                trader: "Therapist",
                status: "kappa",
              },
            ],
          },
          {
            quests: [
              { name: "The Extortionist", trader: "Skier", status: "available" },
              { name: "Stirrup", trader: "Skier", status: "locked" },
              { name: "What's on the Flash?", trader: "Skier", status: "locked" },
            ],
          },
        ].map((chain, chainIndex) => (
          <div key={chainIndex} className="flex flex-col gap-2 min-w-[180px]">
            {chain.quests.map((quest, questIndex) => (
              <div key={quest.name} className="relative">
                <div
                  className={`p-2 bg-[var(--bg-elevated)] border-l-[3px] ${
                    quest.status === "completed"
                      ? "border-l-[var(--success)] opacity-60"
                      : quest.status === "available"
                        ? "border-l-[var(--available)]"
                        : quest.status === "kappa"
                          ? "border-l-[var(--kappa)]"
                          : "border-l-[var(--tactical-border)] opacity-40"
                  }`}
                >
                  <h5
                    className={`font-[family-name:var(--font-rajdhani)] font-bold text-sm ${
                      quest.status === "available"
                        ? "text-[var(--text-bright)]"
                        : ""
                    }`}
                  >
                    {quest.name}
                  </h5>
                  <p className="text-xs text-[var(--text-dim)]">
                    {quest.trader}
                    {quest.status === "kappa" && (
                      <span className="text-[var(--kappa)]"> • Kappa</span>
                    )}
                  </p>
                </div>
                {questIndex < chain.quests.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[var(--text-dim)] text-xs">
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
