import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { createServer } from "node:http";

const host = process.env.DEPLOY_AGENT_HOST || "127.0.0.1";
const port = Number(process.env.DEPLOY_AGENT_PORT || 9900);
const secret = process.env.DEPLOY_AGENT_SECRET;
const composeDirectory = process.env.DEPLOY_COMPOSE_DIR || "/opt/fogons";
const composeFile = process.env.DEPLOY_COMPOSE_FILE || "docker-compose.yml";
const maxClockSkewMs = 120_000;
const maxBodyBytes = 1024;
const healthTimeoutMs = 180_000;
const jobs = new Map();
let activeJobId = null;

if (!secret) throw new Error("DEPLOY_AGENT_SECRET is required");

function isValidSignature(body, received) {
  if (!received || typeof received !== "string") return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function send(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

function runCommand(args, timeout) {
  return new Promise((resolve, reject) => {
    execFile(
      "/usr/bin/docker",
      ["compose", "-f", composeFile, ...args],
      {
        cwd: composeDirectory,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) reject(new Error((stderr || error.message).trim()));
        else resolve(stdout.trim());
      },
    );
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readAppReadiness(output) {
  const trimmed = output.trim();
  if (!trimmed) return "pending";

  const parsed = trimmed.startsWith("[")
    ? JSON.parse(trimmed)
    : trimmed.split("\n").map((line) => JSON.parse(line));
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const app = entries.find((entry) => entry.Service === "app") ?? entries[0];
  const health = typeof app?.Health === "string" ? app.Health : "";

  if (health === "healthy") return "healthy";
  if (health === "unhealthy") return "unhealthy";
  if (
    !health &&
    typeof app?.Status === "string" &&
    app.Status.startsWith("Up")
  ) {
    return "healthy";
  }
  return "pending";
}

async function waitUntilAppIsHealthy() {
  const deadline = Date.now() + healthTimeoutMs;
  while (Date.now() < deadline) {
    const output = await runCommand(["ps", "--format", "json", "app"], 30_000);
    const readiness = readAppReadiness(output);
    if (readiness === "healthy") return;
    if (readiness === "unhealthy") {
      throw new Error("El contenidor de l'app no passa el health check.");
    }
    await delay(2_000);
  }
  throw new Error("El contenidor de l'app no s'ha posat healthy a temps.");
}

async function runDeployment(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;
  try {
    job.status = "pulling";
    await runCommand(["pull", "app"], 600_000);
    job.status = "starting";
    await runCommand(["up", "-d", "--no-build", "app"], 120_000);
    job.status = "checking";
    await waitUntilAppIsHealthy();
    job.status = "success";
    job.finishedAt = new Date().toISOString();
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Deployment failed";
    job.finishedAt = new Date().toISOString();
  } finally {
    activeJobId = null;
  }
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      const error = new Error("Payload too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    return send(response, 200, { status: "ok" });
  }

  if (request.method === "POST" && url.pathname === "/deploy") {
    let body;
    try {
      body = await readBody(request);
    } catch (error) {
      const status = error.statusCode === 413 ? 413 : 400;
      return send(response, status, { error: "Petició no vàlida." });
    }

    if (!isValidSignature(body, request.headers["x-deploy-signature"])) {
      return send(response, 401, { error: "No autoritzat." });
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return send(response, 400, { error: "Petició no vàlida." });
    }

    const requestedAt = Date.parse(payload?.requestedAt);
    if (payload?.action !== "deploy-latest") {
      return send(response, 400, { error: "Acció no permesa." });
    }
    if (
      !Number.isFinite(requestedAt) ||
      Math.abs(Date.now() - requestedAt) > maxClockSkewMs
    ) {
      return send(response, 401, { error: "La petició de deploy ha caducat." });
    }
    if (activeJobId) {
      return send(response, 409, {
        error: "Ja hi ha un desplegament en curs.",
        jobId: activeJobId,
      });
    }

    const jobId = randomUUID();
    jobs.set(jobId, { status: "queued", startedAt: new Date().toISOString() });
    activeJobId = jobId;
    void runDeployment(jobId);
    return send(response, 202, { jobId });
  }

  const statusMatch = url.pathname.match(/^\/deploy\/([^/]+)$/);
  if (request.method === "GET" && statusMatch) {
    const jobId = statusMatch[1];
    if (!isValidSignature(jobId, request.headers["x-deploy-signature"])) {
      return send(response, 401, { error: "No autoritzat." });
    }
    const job = jobs.get(jobId);
    return job
      ? send(response, 200, job)
      : send(response, 404, { error: "Job no trobat." });
  }

  return send(response, 404, { error: "No trobat." });
});

server.listen(port, host, () => {
  process.stdout.write(`Deploy agent listening on ${host}:${port}\n`);
});
