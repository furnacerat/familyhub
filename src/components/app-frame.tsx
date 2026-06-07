"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/family-data";

type AppFrameProps = {
  children: React.ReactNode;
};

export function AppFrame({ children }: AppFrameProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28rem),linear-gradient(180deg,_#fbfaf7_0%,_#f3f7f4_52%,_#eef4f8_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <AppHeader />
        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
          <SideNav />
          <div className="min-w-0 space-y-4 lg:space-y-6">{children}</div>
        </div>
      </div>
      <MobileNav />
    </main>
  );
}

function AppHeader() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="mb-4 flex items-center justify-between rounded-lg border border-white/80 bg-white/82 px-3 py-3 shadow-sm backdrop-blur md:px-4">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Private Household
          </p>
          <h1 className="text-lg font-semibold leading-tight sm:text-xl">
            Family Hub
          </h1>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Notifications">
              <Bell className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Sign out"
              onClick={handleSignOut}
            >
              <LogOut className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sign out</TooltipContent>
        </Tooltip>
        <Avatar className="size-9 border border-border">
          <AvatarFallback>AF</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-4 rounded-lg border border-white/80 bg-white/78 p-2 shadow-sm backdrop-blur">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Button
              key={item.label}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className="mb-1 h-11 w-full justify-start gap-3 rounded-md"
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
        <Separator className="my-3" />
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-950">
          <p className="font-medium">Adult view</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            Budget and child money tools are visible to Owner and Adult roles.
          </p>
        </div>
      </nav>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/94 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Button
              key={item.label}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "h-14 min-w-16 flex-col gap-1 rounded-md px-1 text-[0.72rem]",
                isActive && "font-semibold",
              )}
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <item.icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
