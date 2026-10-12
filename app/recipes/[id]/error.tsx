"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Aquesta recepta no està disponible"
      message="No hem pogut carregar la recepta. La teva sessió de cuina no ha canviat."
      reset={reset}
    />
  );
}
