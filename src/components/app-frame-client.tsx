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
import type { NavItem } from "@/lib/family-data";
import { createClient } from "@/lib/supabase/client";
import type { HouseholdProfile } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type AppFrameClientProps = {
  children: React.ReactNode;
  profile: HouseholdProfile;
  navigation: NavItem[];
  unreadCount: number;
};

export function AppFrameClient({
  children,
  profile,
  navigation,
  unreadCount,
}: AppFrameClientProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28rem),linear-gradient(180deg,_#fbfaf7_0%,_#f3f7f4_52%,_#eef4f8_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <AppHeader profile={profile} unreadCount={unreadCount} />
        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
          <SideNav navigation={navigation} profile={profile} />
          <div className="min-w-0 space-y-4 lg:space-y-6">{children}</div>
        </div>
      </div>
      <MobileNav navigation={navigation} />
    </main>
  );
}

function AppHeader({
  profile,
  unreadCount,
}: {
  profile: HouseholdProfile;
  unreadCount: number;
}) {
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
            <Button asChild size="icon" variant="ghost" aria-label="Notifications">
              <Link href="/notifications" className="relative">
                <Bell className="size-5" />
                {unreadCount ? (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[0.6rem] font-semibold text-white">
                    {Math.min(unreadCount, 9)}
                  </span>
                ) : null}
              </Link>
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
          <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function SideNav({
  navigation,
  profile,
}: {
  navigation: NavItem[];
  profile: HouseholdProfile;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-4 rounded-lg border border-white/80 bg-white/78 p-2 shadow-sm backdrop-blur">
        {navigation.map((item) => {
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
          <p className="font-medium">{profile.display_name}</p>
          <p className="mt-1 text-xs capitalize leading-5 text-emerald-800">
            {profile.role} view
            {profile.budget_access ? " with budget access" : ""}
          </p>
        </div>
      </nav>
    </aside>
  );
}

function MobileNav({ navigation }: { navigation: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/94 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg gap-1 overflow-x-auto">
        {navigation.map((item) => {
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
