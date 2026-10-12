"use client";

import { useState } from "react";

type DeployStatus =
  | "idle"
  | "starting"
  | "pulling"
  | "starting-app"
  | "success"
  | "failed";

const statusLabels: Record<DeployStatus, string> = {
  idle: "Desplegar última versió",
  starting: "Preparant desplegament...",
  pulling: "Descarregant la imatge...",
  "starting-app": "Reiniciant l’aplicació...",
  success: "Desplegament completat",
  failed: "El desplegament ha fallat",
};

const maxPollAttempts = 400;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function DeployButton() {
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [error, setError] = useState("");

  async function startDeploy() {
    setStatus("starting");
    setError("");
    try {
      const response = await fetch("/api/admin/deploy", { method: "POST" });
      const result = (await response.json()) as {
        jobId?: string;
        error?: string;
      };
      if (!response.ok || !result.jobId) {
        throw new Error(
          result.error || "No s’ha pogut iniciar el desplegament.",
        );
      }
      await poll(result.jobId, maxPollAttempts);
    } catch (deployError) {
      setError(
        deployError instanceof Error
          ? deployError.message
          : "No s’ha pogut iniciar el desplegament.",
      );
      setStatus("failed");
    }
  }

  async function poll(jobId: string, attemptsLeft: number): Promise<void> {
    if (attemptsLeft <= 0) {
      throw new Error(
        "El desplegament triga massa. Comprova el deploy-agent al Pi.",
      );
    }

    try {
      const response = await fetch(`/api/admin/deploy/${jobId}`, {
        cache: "no-store",
      });
      if (
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        setStatus("starting-app");
        await wait(2000);
        return poll(jobId, attemptsLeft - 1);
      }

      const result = (await response.json()) as {
        status?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "No s’ha pogut consultar l’estat.");
      }
      if (result.status === "pulling") setStatus("pulling");
      else if (result.status === "starting" || result.status === "checking") {
        setStatus("starting-app");
      } else if (result.status === "success") {
        setStatus("success");
        return;
      } else if (result.status === "failed") {
        throw new Error(result.error || "El deploy-agent ha fallat.");
      }
    } catch (pollError) {
      if (!(pollError instanceof TypeError)) throw pollError;
      setStatus("starting-app");
      await wait(2000);
      return poll(jobId, attemptsLeft - 1);
    }

    await wait(1500);
    return poll(jobId, attemptsLeft - 1);
  }

  const isBusy =
    status === "starting" || status === "pulling" || status === "starting-app";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => void startDeploy()}
        disabled={isBusy}
        className="admin-secondary-button disabled:cursor-wait disabled:opacity-60"
      >
        {statusLabels[status]}
      </button>
      {status === "success" && (
        <span className="text-xs font-semibold text-[var(--success)]">
          La Pi està actualitzada.
        </span>
      )}
      {error && (
        <span
          role="alert"
          className="max-w-xs text-right text-xs font-semibold text-[#994444]"
        >
          {error}
        </span>
      )}
    </div>
  );
}
