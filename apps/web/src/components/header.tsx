"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStats } from "@/contexts/StatsContext";

// Crosshair logo SVG component - tactical scope reticle style
function CrosshairLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Crosshair lines - with gap in center */}
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="2" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function QuestStats() {
  const { stats } = useStats();

  if (!stats) return null;

  return (
    <div className="hidden md:flex items-center gap-2 text-xs">
      <span className="flex items-center gap-1" style={{ color: "#00a700" }}>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#00a700" }}
        />
        {stats.completed}
      </span>
      <span className="opacity-50">|</span>
      <span className="flex items-center gap-1" style={{ color: "#0292c0" }}>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#0292c0" }}
        />
        {stats.available}
      </span>
      <span className="opacity-50">|</span>
      <span className="flex items-center gap-1" style={{ color: "#636363" }}>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#636363" }}
        />
        {stats.locked}
      </span>
      <span className="text-muted-foreground">/ {stats.total}</span>
    </div>
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Sign out failed", {
        description: "Please try again or refresh the page.",
      });
      window.location.href = "/";
    }
  }, []);

  return (
    <header className="border-b border-[var(--tactical-border)] bg-[var(--bg-panel)]">
      <div className="w-full px-4 h-14 md:h-16 flex items-center">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <CrosshairLogo className="w-6 h-6 md:w-7 md:h-7 text-[var(--accent-gold)] transition-transform group-hover:rotate-90" />
            <span className="font-[family-name:var(--font-rajdhani)] font-bold text-lg md:text-xl tracking-wide text-[var(--text-bright)]">
              <span className="hidden sm:inline">LEARN TO TARKOV</span>
              <span className="sm:hidden">L2T</span>
            </span>
          </Link>
          {/* Navigation - Refactoring UI: De-emphasize inactive items */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/maps"
              className="text-sm font-[family-name:var(--font-rajdhani)] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] hover:text-[var(--accent-gold)] transition-colors"
            >
              Map Select
            </Link>
            <Link
              href="/raid"
              className="text-sm font-[family-name:var(--font-rajdhani)] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] hover:text-[var(--accent-gold)] transition-colors"
            >
              Raid Prep
            </Link>
            <Link
              href="/quest-tree"
              className="text-sm font-[family-name:var(--font-rajdhani)] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] hover:text-[var(--accent-gold)] transition-colors"
            >
              Quest Tree
            </Link>
          </nav>
        </div>

        {/* Spacer to push right content to edge */}
        <div className="flex-1" />

        {/* Right: Stats + User (Desktop) */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <QuestStats />

          {status === "loading" ? (
            <div className="w-20 h-9 bg-muted animate-pulse rounded" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">
                    {session.user?.email}
                  </span>
                  <span className="lg:hidden">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">Signed in as</p>
                  <p className="text-xs text-muted-foreground break-all">
                    {session.user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/maps">Map Select</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/raid">Raid Prep</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/quest-tree">Quest Tree</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: Nav + Menu */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <Link href="/maps" className="text-sm hover:text-primary px-2">
            Map Select
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {status === "loading" ? (
                  <div className="h-10 bg-muted animate-pulse rounded" />
                ) : session ? (
                  <>
                    <div className="px-2 py-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Signed in as</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/maps"
                      className="px-2 py-2 text-sm hover:bg-muted rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Map Select
                    </Link>
                    <Link
                      href="/raid"
                      className="px-2 py-2 text-sm hover:bg-muted rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Raid Prep
                    </Link>
                    <Link
                      href="/quest-tree"
                      className="px-2 py-2 text-sm hover:bg-muted rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Quest Tree
                    </Link>
                    <Link
                      href="/settings"
                      className="px-2 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
