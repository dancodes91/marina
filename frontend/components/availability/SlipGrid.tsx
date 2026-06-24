import type { AvailabilitySlip } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatPrice(value: string | number | null | undefined) {
  if (value == null) return "Contact for pricing";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "Contact for pricing";
  return `$${n.toLocaleString()}/mo`;
}

export function SlipGrid({ slips }: { slips: AvailabilitySlip[] }) {
  if (slips.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No slip availability published yet. Contact the marina for current openings.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slips.map((slip) => (
        <Card key={slip.size} className={slip.available <= 0 ? "opacity-60" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">{slip.size}</CardTitle>
              <Badge variant={slip.available > 0 ? "accent" : "secondary"}>
                {slip.available > 0 ? `${slip.available} open` : "Full"}
              </Badge>
            </div>
            <CardDescription>
              {slip.length_ft && slip.beam_ft
                ? `${slip.length_ft}' LOA × ${slip.beam_ft}' beam`
                : "Slip details on request"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xl font-semibold text-primary">{formatPrice(slip.price_monthly)}</p>
            {slip.amenities.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {slip.amenities.map((a) => (
                  <Badge key={a} variant="outline" className="font-normal">
                    {a}
                  </Badge>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
