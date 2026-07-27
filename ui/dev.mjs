import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "C:\\Program Files\\nodejs\\node.exe" : "npx";
const args = process.platform === "win32"
  ? ["C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js", "vinext", "dev"]
  : ["vinext", "dev"];
const children = [
  spawn(command, args, {
    cwd: import.meta.dirname,
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
    stdio: "inherit",
  }),
  spawn(process.execPath, ["launcher-server.mjs"], {
    cwd: import.meta.dirname,
    stdio: "inherit",
  }),
];

let closing = false;
function close(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!closing && code && code !== 0) close(code);
  });
}

process.on("SIGINT", () => close(0));
process.on("SIGTERM", () => close(0));
