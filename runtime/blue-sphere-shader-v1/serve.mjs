import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
};

createServer(async (req, res) => {
  try {
    if (req.method === "PUT" && req.url.startsWith("/save/")) {
      const name = basename(decodeURIComponent(req.url.slice("/save/".length)));
      if (!/^[\w.-]+\.glb$/.test(name)) { res.writeHead(400); res.end("bad name"); return; }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const outDir = join(root, "export");
      await mkdir(outDir, { recursive: true });
      const outPath = join(outDir, name);
      await writeFile(outPath, Buffer.concat(chunks));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ saved: outPath, bytes: Buffer.concat(chunks).length }));
      return;
    }
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([\\/])+/, "");
    const file = join(root, path === "" || path === "." ? "index.html" : path);
    if (!file.startsWith(root)) throw new Error("outside root");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(8113, "127.0.0.1", () => console.log("relay blue-sphere runtime on http://127.0.0.1:8113"));
