import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, "..");
const runsRoot = path.join(projectRoot, "runs");
const studioV4Root = "C:\\Users\\joeyw\\Desktop\\Refract_Motion_Studio_v4\\lab_site";
const refractV40Root = "C:\\Users\\joeyw\\Desktop\\Refract\\deploy_v40_promotion_gate";
const promotionReceiptPath = path.join(
  refractV40Root,
  "promotion",
  "organic-glow-instrument.v11.unreal-verified.receipt.json",
);
const unrealEditorPath = "C:\\Program Files\\Epic Games\\UE_5.8\\Engine\\Binaries\\Win64\\UnrealEditor.exe";
const unrealProjectPath = "C:\\UEProjects\\OrbitShaderEngine_UE58\\OrbitShaderEngine_UE58.uproject";
const unrealMapPath = "/Game/OrbitShaderStudio/Maps/OrganicGlowInstrument_v1";
const host = "127.0.0.1";
const port = 3210;

function json(response, status, data) {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(data));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js" || extension === ".mjs") return "text/javascript; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".glsl" || extension === ".frag" || extension === ".vert") {
    return "text/plain; charset=utf-8";
  }
  return "application/octet-stream";
}

async function serveStatic(response, root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const normalized = relativePath === "" || relativePath.endsWith("/")
    ? `${relativePath}index.html`
    : relativePath;
  const filePath = path.resolve(resolvedRoot, normalized);
  if (filePath !== resolvedRoot && !filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
    json(response, 403, { error: "Invalid local path." });
    return;
  }
  try {
    const body = await fs.readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType(filePath),
    });
    response.end(body);
  } catch (error) {
    json(response, error?.code === "ENOENT" ? 404 : 500, { error: "Local artifact unavailable." });
  }
}

async function getPromotionStatus() {
  try {
    const receipt = JSON.parse(await fs.readFile(promotionReceiptPath, "utf8"));
    return {
      available: true,
      asset: receipt.asset,
      gates: receipt.gates,
      promotedAt: receipt.promotedAt,
      registryVersion: "legacy_engines.v11.js",
      studioUrl: `http://${host}:${port}/studio-v4/`,
      promotedUrl: `http://${host}:${port}/refract-v40/app.html`,
    };
  } catch {
    return {
      available: false,
      asset: null,
      gates: {},
      promotedAt: null,
      registryVersion: null,
      studioUrl: `http://${host}:${port}/studio-v4/`,
      promotedUrl: null,
    };
  }
}

async function latestRun() {
  await fs.mkdir(runsRoot, { recursive: true });
  const entries = await fs.readdir(runsRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && /^\d{8}-\d{6}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  return directories[0] ?? null;
}

async function readRequest(runId) {
  if (!runId) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(runsRoot, runId, "request.json"), "utf8"));
  } catch {
    return null;
  }
}

async function getStatus() {
  const runId = await latestRun();
  if (!runId) {
    return {
      connected: true,
      runId: null,
      objective: null,
      mode: "web-builders",
      overall: "idle",
      stages: {
        cursor: "ready",
        preparation: "idle",
        claude: "idle",
        lovable: "idle",
        v0: "idle",
        verification: "idle",
        figma: "idle",
        shader: "idle",
        spline: "idle",
        promotion: "idle",
        unreal: "idle",
        assetQc: "idle",
      },
      events: ["Local launcher is ready.", "Waiting for your first brief."],
    };
  }

  const runPath = path.join(runsRoot, runId);
  const request = await readRequest(runId);
  const submitted = await exists(path.join(runPath, "submitted.flag"));
  const mode = request?.mode === "design-to-unreal" ? "design-to-unreal" : "web-builders";

  if (mode === "design-to-unreal") {
    const figmaBrief = await exists(path.join(runPath, "figma-brief.md"));
    const sceneContract = await exists(path.join(runPath, "scene-contract.json"));
    const shaderPackage = await exists(path.join(runPath, "shader-package.md"));
    const splineExport = await exists(path.join(runPath, "spline-export.md"));
    const promotionReceipt = await exists(path.join(runPath, "promotion-receipt.json"));
    const unrealImport = await exists(path.join(runPath, "unreal-import.md"));
    const assetQc = await exists(path.join(runPath, "asset-qc.md"));
    const figmaComplete = figmaBrief && sceneContract;

    const stages = {
      cursor: submitted ? (assetQc ? "complete" : "running") : "waiting",
      figma: figmaComplete ? "complete" : submitted ? "running" : "waiting",
      shader: shaderPackage ? "complete" : figmaComplete ? "running" : "waiting",
      spline: splineExport ? "complete" : shaderPackage ? "running" : "waiting",
      promotion: promotionReceipt ? "complete" : splineExport ? "running" : "waiting",
      unreal: unrealImport ? "complete" : promotionReceipt ? "running" : "waiting",
      assetQc: assetQc ? "complete" : unrealImport ? "running" : "waiting",
    };

    const events = ["Design-to-Unreal brief accepted by Relay."];
    if (submitted) events.push("Cursor supervisor started the asset pipeline.");
    if (figmaBrief) events.push("Figma design context is recorded.");
    if (sceneContract) events.push("Neutral scene and portability contract is ready.");
    if (shaderPackage) events.push("Versioned GLSL package passed its source checks.");
    if (splineExport) events.push("Spline or neutral 3D export package is ready.");
    if (promotionReceipt) events.push("Promotion Gate created an immutable registry version.");
    if (unrealImport) events.push("Unreal import and shader translation evidence is ready.");
    if (assetQc) events.push("Final Unreal asset QC is complete.");

    return {
      connected: true,
      runId,
      objective: request?.objective ?? null,
      mode,
      overall: assetQc ? "complete" : submitted ? "running" : "queued",
      stages,
      events,
    };
  }

  const brief = await exists(path.join(runPath, "brief.md"));
  const preflight = await exists(path.join(runPath, "preflight.md"));
  const claudeResult = await exists(path.join(runPath, "claude-result.md"));
  const lovableUrl = await exists(path.join(runPath, "lovable-url.txt"));
  const v0Url = await exists(path.join(runPath, "v0-url.txt"));
  const lovableReview = await exists(path.join(runPath, "lovable-review.md"));
  const v0Review = await exists(path.join(runPath, "v0-review.md"));
  const preparationComplete = brief && preflight;
  const verificationComplete = lovableReview && v0Review;

  const stages = {
    cursor: submitted ? (verificationComplete ? "complete" : "running") : "waiting",
    preparation: preparationComplete ? "complete" : submitted ? "running" : "waiting",
    claude: claudeResult ? "complete" : preparationComplete ? "running" : "waiting",
    lovable: lovableUrl ? "complete" : claudeResult ? "running" : "waiting",
    v0: v0Url ? "complete" : claudeResult ? "running" : "waiting",
    verification: verificationComplete ? "complete" : lovableUrl && v0Url ? "running" : "waiting",
  };

  const events = ["Brief accepted by Relay."];
  if (submitted) events.push("Cursor supervisor started the run.");
  if (brief) events.push("Shared brief and builder prompts are ready.");
  if (preflight) events.push("Chrome and builder preflight finished.");
  if (claudeResult) events.push("Claude completed the browser handoff.");
  if (lovableUrl) events.push("Lovable returned a visible workstream.");
  if (v0Url) events.push("v0 returned a visible workstream.");
  if (verificationComplete) events.push("Both independent reviews are complete.");

  return {
    connected: true,
    runId,
    objective: request?.objective ?? null,
    mode,
    overall: verificationComplete ? "complete" : submitted ? "running" : "queued",
    stages,
    events,
  };
}

function timestamp() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}${value.month}${value.day}-${value.hour}${value.minute}${value.second}`;
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) throw new Error("Request is too large.");
  }
  return JSON.parse(body || "{}");
}

async function openCursorPrompt(objective, runPath, mode) {
  const cursorCommand = mode === "design-to-unreal" ? "/design-to-unreal" : "/cross-ai-build";
  const prompt = `${cursorCommand}\n\nObjective: ${objective}\n\nUse this exact run folder: ${runPath}`;
  const url = new URL("cursor://anysphere.cursor-deeplink/prompt");
  url.searchParams.set("text", prompt);
  const shellCommand = "$u=$env:RELAY_CURSOR_URL; Start-Process -FilePath $u";
  await execFileAsync("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", shellCommand], {
    env: { ...process.env, RELAY_CURSOR_URL: url.toString() },
    windowsHide: true,
  });
}

async function submitCursorPrompt() {
  const script = [
    "$p=Get-Process Cursor -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like '*Cursor-Agent-Pipeline*'} | Select-Object -First 1;",
    "if(-not $p){exit 2};",
    "$w=New-Object -ComObject WScript.Shell;",
    "if(-not $w.AppActivate($p.Id)){exit 3};",
    "Start-Sleep -Milliseconds 600;",
    "$w.SendKeys('{ENTER}');",
  ].join("");
  await execFileAsync("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", script], {
    windowsHide: true,
  });
}

async function openUnrealProject() {
  if (!(await exists(unrealEditorPath))) {
    throw new Error("Unreal Engine 5.8 is not installed at the expected location.");
  }
  if (!(await exists(unrealProjectPath))) {
    throw new Error("The Orbit Shader Engine 5.8 destination project is unavailable.");
  }

  const script = [
    "$editor=$env:RELAY_UE_EDITOR;",
    "$project=$env:RELAY_UE_PROJECT;",
    "$map=$env:RELAY_UE_MAP;",
    "$existing=Get-CimInstance Win32_Process -Filter \"Name='UnrealEditor.exe'\" -ErrorAction SilentlyContinue | ",
    "Where-Object {$_.CommandLine -like ('*'+$project+'*')} | Select-Object -First 1;",
    "if($existing){",
    "$shell=New-Object -ComObject WScript.Shell;",
    "[void]$shell.AppActivate([int]$existing.ProcessId);",
    "Write-Output 'focused';",
    "}else{",
    "Start-Process -FilePath $editor -ArgumentList @($project,$map,'-AutoDeclinePackageRecovery');",
    "Write-Output 'launched';",
    "}",
  ].join("");

  const result = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-WindowStyle", "Hidden", "-Command", script],
    {
      env: {
        ...process.env,
        RELAY_UE_EDITOR: unrealEditorPath,
        RELAY_UE_PROJECT: unrealProjectPath,
        RELAY_UE_MAP: unrealMapPath,
      },
      windowsHide: true,
    },
  );
  return result.stdout.trim() || "launched";
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (request.method === "GET" && requestUrl.pathname.startsWith("/studio-v4/")) {
      await serveStatic(response, studioV4Root, decodeURIComponent(requestUrl.pathname.slice("/studio-v4/".length)));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/refract-v40/")) {
      await serveStatic(response, refractV40Root, decodeURIComponent(requestUrl.pathname.slice("/refract-v40/".length)));
      return;
    }

    if (request.method === "GET" && request.url === "/api/status") {
      json(response, 200, await getStatus());
      return;
    }

    if (request.method === "GET" && request.url === "/api/promotion") {
      json(response, 200, await getPromotionStatus());
      return;
    }

    if (request.method === "POST" && request.url === "/api/open-unreal") {
      const action = await openUnrealProject();
      json(response, 200, { opened: true, action, project: "Orbit Shader Engine 5.8", map: unrealMapPath });
      return;
    }

    if (request.method === "POST" && request.url === "/api/run") {
      const body = await readBody(request);
      const objective = typeof body.objective === "string" ? body.objective.trim() : "";
      const mode = body.mode === "design-to-unreal" ? "design-to-unreal" : "web-builders";
      if (!objective || objective.length > 3000) {
        json(response, 400, { error: "Enter an objective between 1 and 3000 characters." });
        return;
      }

      const runId = timestamp();
      const runPath = path.join(runsRoot, runId);
      await fs.mkdir(runPath, { recursive: false });
      await fs.writeFile(
        path.join(runPath, "request.json"),
        `${JSON.stringify({ objective, mode, createdAt: new Date().toISOString(), status: "queued" }, null, 2)}\n`,
      );
      await fs.writeFile(
        path.join(runPath, "manifest.md"),
        `# Relay Run Manifest\n\n- Started: ${new Date().toISOString()}\n- Mode: ${mode}\n- Objective: ${objective}\n- Supervisor: Cursor\n- Status: QUEUED\n`,
      );
      await openCursorPrompt(objective, runPath, mode);
      json(response, 201, { runId, promptReady: true });
      return;
    }

    if (request.method === "POST" && request.url === "/api/submit") {
      const runId = await latestRun();
      if (!runId) {
        json(response, 409, { error: "Create a run first." });
        return;
      }
      await submitCursorPrompt();
      await fs.writeFile(path.join(runsRoot, runId, "submitted.flag"), `${new Date().toISOString()}\n`);
      json(response, 200, { submitted: true, runId });
      return;
    }

    json(response, 404, { error: "Not found." });
  } catch (error) {
    json(response, 500, { error: error instanceof Error ? error.message : "Local launcher error." });
  }
});

server.listen(port, host, () => {
  console.log(`Relay launcher listening at http://${host}:${port}`);
});
