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
      title="El mode cuina necessita reiniciar-se"
      message="No hem pogut obrir aquesta sessió de cuina. Torna-ho a provar abans de continuar."
      reset={reset}
    />
  );
}
