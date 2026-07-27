// Minimal CDP driver for isolated playtesting of vanguard-golf-game-v1.
// Talks to a private Chrome started with --remote-debugging-port=9333.
// Usage:
//   node drive.mjs nav <url>
//   node drive.mjs eval <js-expression>
//   node drive.mjs shot <file.png>
//   node drive.mjs key <code> [holdMs]        (full press; holdMs>0 = hold then release)
//   node drive.mjs click <x> <y>
//   node drive.mjs drag <x1> <y1> <x2> <y2> [steps]
//   node drive.mjs holdbtn <x> <y> <ms>       (pointer down, wait, up — swing meter)
import { writeFile } from "node:fs/promises";

const PORT = 9333;
const [, , cmd, ...args] = process.argv;

const VKEYS = { Space: 32, Escape: 27, Enter: 13, ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68 };
const KEYTXT = { Space: " ", Enter: "\r" };

async function target() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === "page" && t.url.includes("8119"))
    ?? list.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");
  return page.webSocketDebuggerUrl;
}

let ws, msgId = 0;
const pending = new Map();
async function connect() {
  ws = new WebSocket(await target());
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
}
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res) => pending.set(id, res));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function keyEvent(type, code) {
  await send("Input.dispatchKeyEvent", {
    type, code, key: KEYTXT[code] ?? code,
    windowsVirtualKeyCode: VKEYS[code] ?? 0, nativeVirtualKeyCode: VKEYS[code] ?? 0,
  });
}
async function mouse(type, x, y, opts = {}) {
  await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1, ...opts });
}

await connect();
switch (cmd) {
  case "nav": {
    await send("Page.enable");
    await send("Page.navigate", { url: args[0] });
    await sleep(1800);
    console.log("navigated", args[0]);
    break;
  }
  case "eval": {
    const r = await send("Runtime.evaluate", { expression: args[0], returnByValue: true, awaitPromise: true });
    console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
    break;
  }
  case "shot": {
    const r = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(args[0], Buffer.from(r.result.data, "base64"));
    console.log("saved", args[0]);
    break;
  }
  case "key": {
    const hold = Number(args[1] ?? 0);
    await keyEvent("keyDown", args[0]);
    if (hold > 0) await sleep(hold);
    await keyEvent("keyUp", args[0]);
    console.log("key", args[0], hold || "");
    break;
  }
  case "click": {
    const [x, y] = args.map(Number);
    await mouse("mousePressed", x, y);
    await sleep(40);
    await mouse("mouseReleased", x, y);
    console.log("clicked", x, y);
    break;
  }
  case "drag": {
    const [x1, y1, x2, y2] = args.map(Number);
    const steps = Number(args[4] ?? 14);
    await mouse("mousePressed", x1, y1);
    for (let i = 1; i <= steps; i++) {
      await mouse("mouseMoved", x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps);
      await sleep(16);
    }
    await mouse("mouseReleased", x2, y2);
    console.log("dragged");
    break;
  }
  case "clicksel": {
    const r = await send("Runtime.evaluate", {
      expression: `(()=>{const el=document.querySelector(${JSON.stringify(args[0])});if(!el)return null;const b=el.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()`,
      returnByValue: true,
    });
    const pt = r.result?.result?.value;
    if (!pt) { console.error("selector not found:", args[0]); process.exit(1); }
    await mouse("mousePressed", pt.x, pt.y);
    await sleep(40);
    await mouse("mouseReleased", pt.x, pt.y);
    console.log("clicked", args[0], Math.round(pt.x), Math.round(pt.y));
    break;
  }
  case "holdbtn": {
    const [x, y, ms] = args.map(Number);
    await mouse("mousePressed", x, y);
    await sleep(ms);
    await mouse("mouseReleased", x, y);
    console.log("held", ms, "ms at", x, y);
    break;
  }
  case "consolecheck": {
    const logs = [];
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === "Runtime.consoleAPICalled")
        logs.push(`${m.params.type}: ${(m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ")}`);
      if (m.method === "Runtime.exceptionThrown")
        logs.push(`EXCEPTION: ${m.params.exceptionDetails?.text} ${m.params.exceptionDetails?.exception?.description ?? ""}`);
      if (m.method === "Log.entryAdded")
        logs.push(`${m.params.entry.level}: ${m.params.entry.text}`);
    });
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Page.enable");
    await send("Page.navigate", { url: args[0] });
    await sleep(8000);
    console.log(logs.length ? logs.join("\n") : "CONSOLE CLEAN (0 messages)");
    break;
  }
  case "playhole": {
    // Plays the current hole to completion using real CDP key input.
    const getState = async () => {
      const r = await send("Runtime.evaluate", {
        expression: "JSON.stringify(window.RelayVanguardGolf.getState())", returnByValue: true,
      });
      return JSON.parse(r.result.result.value);
    };
    let fullFactor = 0.93, puttFactor = 1.05, dPrev = null;
    for (let shot = 0; shot < 14; shot++) {
      let st = await getState();
      for (let i = 0; i < 120 && st.scene === "play" && st.mode !== "aim" && st.mode !== "holed"; i++) {
        await sleep(300); st = await getState();
      }
      if (st.scene !== "play" || st.mode === "holed") { console.log("finished:", st.scene, "strokes", st.strokes); break; }
      const d = Math.hypot(st.hole.cup[0] - st.ball.x, st.hole.cup[1] - st.ball.z);
      // adapt like a human: OOB reset (distance identical) => club down; short => club up
      if (dPrev != null && Math.abs(d - dPrev) < 0.01) {
        fullFactor = Math.max(0.55, fullFactor - 0.14);
        puttFactor = Math.max(0.7, puttFactor - 0.15);
      } else if (dPrev != null && d > dPrev - Math.max(0.8, dPrev * 0.12)) {
        fullFactor = Math.min(1.3, fullFactor + 0.09);
        puttFactor = Math.min(1.6, puttFactor + 0.15);
      }
      dPrev = d;
      let p;
      if (d < 5.5) {
        const sp = Math.min(9, Math.max(1.4, d * 1.45 * puttFactor));
        p = (sp - 1.2) / 7.8;
      } else {
        const sp = Math.sqrt(fullFactor * d * 9.8 / Math.sin(2 * 34 * Math.PI / 180));
        p = (sp - 3.4) / 12.1;
      }
      p = Math.min(0.98, Math.max(0.05, p));
      const hold = Math.round((p / 1.15) * 1000);
      console.log(`shot ${shot + 1}: d=${d.toFixed(2)} p=${p.toFixed(2)} hold=${hold}ms mode=${d < 5.5 ? "putt" : "full"} strokesBefore=${st.strokes} ball=${st.ball.x.toFixed(1)},${st.ball.z.toFixed(1)}`);
      await keyEvent("keyDown", "Space");
      await sleep(hold);
      await keyEvent("keyUp", "Space");
      await sleep(1500);
    }
    const fin = await send("Runtime.evaluate", {
      expression: "JSON.stringify({scene:window.RelayVanguardGolf.getScene(),score:window.RelayVanguardGolf.getScore()})", returnByValue: true,
    });
    console.log(fin.result.result.value);
    break;
  }
  default:
    console.error("unknown command", cmd);
    process.exit(1);
}
ws.close();
process.exit(0);
