"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { WorkOrderWizard } from "@/components/requests/WorkOrderWizard";
import { Skeleton } from "@/components/ui/skeleton";

function NewRequestContent() {
  const params = useSearchParams();
  const formType = params.get("form_type");
  return <WorkOrderWizard initialFormType={formType} />;
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-2xl rounded-lg" />}>
      <NewRequestContent />
    </Suspense>
  );
}
