import type { AvailabilityStorage } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatPrice(value: string | number | null | undefined) {
  if (value == null) return "Contact for pricing";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "Contact for pricing";
  return `$${n.toLocaleString()}/mo`;
}

export function StorageList({ items }: { items: AvailabilityStorage[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No storage availability published yet. Contact the marina for current openings.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={`${item.type}-${item.name}`} className={item.available <= 0 ? "opacity-60" : ""}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription className="capitalize">{item.type.replace(/_/g, " ").toLowerCase()}</CardDescription>
            </div>
            <Badge variant={item.available > 0 ? "accent" : "secondary"}>
              {item.available > 0 ? `${item.available} open` : "Full"}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Max{" "}
              {item.max_loa_ft ?? item.max_length_ft
                ? `${item.max_loa_ft ?? item.max_length_ft}'`
                : "size on request"}
            </p>
            <p className="text-lg font-semibold text-primary">{formatPrice(item.price_monthly)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
