import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "C:\\Program Files\\nodejs\\node.exe" : "npx";
const args = process.platform === "win32"
  ? ["C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js", "vinext", "build"]
  : ["vinext", "build"];
const child = spawn(command, args, {
  cwd: import.meta.dirname,
  env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
