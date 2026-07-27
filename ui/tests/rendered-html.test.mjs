import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Relay product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Relay — Visual Behavior Pipeline<\/title>/i);
  assert.match(html, /LOCAL ORCHESTRATOR/);
  assert.match(html, /Web builders/);
  assert.match(html, /Exact shaders → Unity/);
  assert.match(html, /Run pipeline/);
  assert.match(html, /Relay keeps accepted projects intact/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the exact runtime, Unity host, and fidelity status wired", async () => {
  const [page, launcher, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../launcher-server.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Original source, live inside the game host/);
  assert.match(page, /Exact runtime is the product definition/);
  assert.match(page, /refreshPromotion/);
  assert.match(page, /\/promotion/);
  assert.match(page, /\/exact-runtime-v1\//);
  assert.match(page, /\/open-unity/);
  assert.match(launcher, /getPromotionStatus/);
  assert.match(launcher, /exact-runtime-v1/);
  assert.match(launcher, /unityWebGLBuild/);
  assert.match(launcher, /\/api\/open-unity/);
  assert.match(launcher, /request\.url === "\/api\/promotion"/);
  assert.match(layout, /Spline, Shadertoy, Unity, and optional Blender exports/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview/);
});
