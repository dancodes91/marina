import Link from "next/link";
import { Anchor, Ship } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Boat } from "@/types";

function boatLabel(boat: Boat) {
  const parts = [boat.year, boat.make, boat.model].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Boat";
}

export function BoatCard({ boat }: { boat: Boat }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Ship className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">{boatLabel(boat)}</CardTitle>
              <CardDescription>
                {boat.wallace_stock_id ? `Stock #${boat.wallace_stock_id}` : "No stock ID"}
              </CardDescription>
            </div>
          </div>
          {boat.slip_id && (
            <Badge variant="sand" className="shrink-0">
              <Anchor className="mr-1 h-3 w-3" />
              {boat.slip_id}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">LOA</dt>
            <dd className="font-medium">
              {boat.loa_ft != null ? `${boat.loa_ft}'${boat.loa_in ? ` ${boat.loa_in}"` : ""}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Engine</dt>
            <dd className="font-medium truncate">
              {boat.engine_make || boat.engine_model
                ? [boat.engine_make, boat.engine_model].filter(Boolean).join(" ")
                : "—"}
            </dd>
          </div>
        </dl>
        <Link
          href={`/boats/${boat.id}`}
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          View details & history →
        </Link>
      </CardContent>
    </Card>
  );
}
