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
      title="La cuina necessita un moment"
      message="No hem pogut carregar la col·lecció de receptes. Torna-ho a provar d’aquí una estona."
      reset={reset}
    />
  );
}
