import { Plus, ShoppingCart } from "lucide-react";

import { AppFrame } from "@/components/app-frame";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { shoppingItems } from "@/lib/family-data";

export default function ListsPage() {
  const remaining = shoppingItems.filter((item) => !item.checked).length;

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Shared lists"
        title="Household needs without the group-text scramble."
        description="Start with shopping, then expand into packing lists, errands, school supplies, and any recurring household list."
        action="Add item"
      />
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>{remaining} items left</CardDescription>
              <CardTitle>Family shopping</CardTitle>
            </div>
            <Button size="icon" variant="outline" aria-label="Add item">
              <Plus className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {shoppingItems.map((item) => (
              <label
                key={item.name}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-3"
              >
                <Checkbox checked={item.checked} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.area} - added by {item.addedBy}
                  </span>
                </span>
                <Badge variant={item.checked ? "secondary" : "outline"}>
                  {item.checked ? "Done" : "Needed"}
                </Badge>
              </label>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShoppingCart className="size-5" />
            </div>
            <CardDescription>Next list types</CardDescription>
            <CardTitle>Ready to expand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {["Groceries", "Hardware run", "School supplies", "Trip packing"].map(
              (list) => (
                <div
                  key={list}
                  className="rounded-lg border border-border/70 bg-background/70 p-3 font-medium"
                >
                  {list}
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </AppFrame>
  );
}
