"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User } from "lucide-react";
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
      // Fallback: redirect to home page anyway
      window.location.href = "/";
    }
  }, []);

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        {/* Logo - shorter on mobile */}
        <Link href="/" className="font-bold text-lg md:text-xl">
          <span className="hidden sm:inline">EFT Quest Tracker</span>
          <span className="sm:hidden">EFT Tracker</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/quests" className="text-sm hover:text-primary">
            Quests
          </Link>

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
                  <Link href="/quests">My Quests</Link>
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
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/quests" className="text-sm hover:text-primary px-2">
            Quests
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
                      href="/quests"
                      className="px-2 py-2 text-sm hover:bg-muted rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Quests
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
