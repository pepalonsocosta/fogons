import { createHmac } from "node:crypto";

export interface DeployAgentBody {
  jobId?: string;
  status?: string;
  error?: string;
}

export interface DeployAgentResult {
  status: number;
  body: DeployAgentBody;
}

function getAgentConfig(): { agentUrl: string; secret: string } | null {
  const agentUrl = process.env.DEPLOY_AGENT_URL;
  const secret = process.env.DEPLOY_AGENT_SECRET;
  if (!agentUrl || !secret) return null;
  return { agentUrl, secret };
}

function sign(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function unavailable(error: string): DeployAgentResult {
  return { status: 503, body: { error } };
}

async function callAgent(
  url: string,
  init: RequestInit,
): Promise<DeployAgentResult> {
  try {
    const response = await fetch(url, { ...init, cache: "no-store" });
    const body = (await response.json()) as DeployAgentBody;
    return { status: response.status, body };
  } catch {
    return unavailable("No s'ha pogut contactar amb el deploy-agent.");
  }
}

export async function startDeployJob(): Promise<DeployAgentResult> {
  const config = getAgentConfig();
  if (!config) return unavailable("El deploy-agent no està configurat.");

  const payload = JSON.stringify({
    action: "deploy-latest",
    requestedAt: new Date().toISOString(),
  });

  return callAgent(`${config.agentUrl}/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-deploy-signature": sign(config.secret, payload),
    },
    body: payload,
  });
}

export async function readDeployJob(jobId: string): Promise<DeployAgentResult> {
  const config = getAgentConfig();
  if (!config) return unavailable("El deploy-agent no està configurat.");

  return callAgent(`${config.agentUrl}/deploy/${encodeURIComponent(jobId)}`, {
    headers: {
      "x-deploy-signature": sign(config.secret, jobId),
    },
  });
}
