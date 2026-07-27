import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import vm from "node:vm";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, "");
    const value = argv[index + 1];
    if (!key || !value) throw new Error(`Invalid argument near ${argv[index] ?? "end"}.`);
    values[key] = value;
  }
  return values;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function validateCandidate(candidate, fragmentSource) {
  const errors = [];
  if (candidate.schemaVersion !== "refract.visual-asset/1") errors.push("Unsupported schemaVersion.");
  for (const key of ["id", "name", "version", "type"]) {
    if (!candidate[key]) errors.push(`Missing ${key}.`);
  }
  for (const uniform of ["uTime", "uMorph", "uFlow", "uHeat"]) {
    if (!fragmentSource.includes(uniform)) errors.push(`Shader is missing ${uniform}.`);
  }
  for (const uniform of ["uPointer", "uGrab", "uStretch", "uTwist", "uScale"]) {
    if (!fragmentSource.includes(uniform)) errors.push(`Interactive shader is missing ${uniform}.`);
  }
  if (!/\bvoid\s+main\s*\(/.test(fragmentSource)) errors.push("Shader is missing main().");
  const semantic = candidate.controls?.semantic ?? [];
  for (const name of ["morph", "flow", "heat"]) {
    if (!semantic.some((control) => control.name === name)) errors.push(`Missing semantic control ${name}.`);
  }
  if (errors.length) throw new Error(errors.join(" "));
}

function evaluateRegistry(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context, { timeout: 2000 });
  if (!Array.isArray(context.window.REFRACT_LEGACY)) throw new Error("Registry did not expose window.REFRACT_LEGACY.");
  return context.window.REFRACT_LEGACY;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const required of ["candidate", "base", "out", "receipt", "adapter"]) {
    if (!args[required]) throw new Error(`Missing --${required}.`);
  }

  for (const target of [args.out, args.receipt, args.adapter]) {
    try {
      await fs.access(target);
      throw new Error(`Refusing to overwrite existing output: ${target}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const candidate = await readJson(args.candidate);
  const fragmentSource = await fs.readFile(candidate.fragmentSource, "utf8");
  const baseSource = await fs.readFile(args.base, "utf8");
  validateCandidate(candidate, fragmentSource);

  const baseAssets = evaluateRegistry(baseSource);
  if (baseAssets.some((asset) => asset.name === candidate.name)) {
    throw new Error(`Registry already contains ${candidate.name}.`);
  }

  const registryAsset = {
    name: candidate.name,
    type: candidate.type,
    src: `${candidate.id}@${candidate.version} · Promotion Gate`,
    def: candidate.defaults,
    contract: {
      schemaVersion: candidate.schemaVersion,
      id: candidate.id,
      version: candidate.version,
      controls: candidate.controls,
      timeline: candidate.timeline,
      targets: candidate.targets
    },
    vert: candidate.vertexSource,
    frag: fragmentSource
  };

  const closeIndex = baseSource.lastIndexOf("\n];");
  if (closeIndex < 0) throw new Error("Could not locate the registry closing bracket.");
  const nextVersion = Number(path.basename(args.out).match(/\.v(\d+)\.js$/)?.[1]);
  if (!Number.isFinite(nextVersion)) throw new Error("Output filename must end in .v<number>.js.");
  const firstLineEnd = baseSource.indexOf("\n");
  const header = `window.REFRACT_LEGACY = [ // v${nextVersion} = promoted ${candidate.name} (${baseAssets.length + 1} assets)`;
  const body = baseSource.slice(firstLineEnd + 1, closeIndex);
  const output = `${header}\n${body},\n${JSON.stringify(registryAsset, null, 1)}\n];\n`;
  const promotedAssets = evaluateRegistry(output);
  if (promotedAssets.length !== baseAssets.length + 1) throw new Error("Promoted registry count is incorrect.");
  if (promotedAssets.at(-1)?.name !== candidate.name) throw new Error("Promoted asset is not the registry tail.");

  const adapter = {
    schemaVersion: "refract.unreal-adapter/1",
    assetId: candidate.id,
    assetVersion: candidate.version,
    targetProject: candidate.targets.unreal.defaultProject,
    sourceShaderSha256: sha256(fragmentSource),
    sourceCoordinates: { units: "metres", handedness: "right", up: "Y" },
    unrealCoordinates: { units: "centimetres", handedness: "left", up: "Z" },
    parameterMap: {
      uMorph: "Morph",
      uFlow: "Flow",
      uHeat: "Heat",
      uPointer: "Pointer",
      uGrab: "Grab",
      uStretch: "Stretch",
      uTwist: "Twist",
      uScale: "Scale"
    },
    translation: {
      status: "requires-live-compile",
      preferred: ["Material graph", "Custom HLSL"],
      fallbacks: ["deterministic texture or flipbook bake"]
    },
    completionGate: ["material compiles in the Unreal editor", "parameters change the visible result", "smoke map has no relevant errors"]
  };

  const receipt = {
    schemaVersion: "refract.promotion-receipt/1",
    promotedAt: new Date().toISOString(),
    candidate: { id: candidate.id, version: candidate.version, name: candidate.name },
    baseRegistry: path.resolve(args.base),
    outputRegistry: path.resolve(args.out),
    baseAssetCount: baseAssets.length,
    promotedAssetCount: promotedAssets.length,
    checks: {
      schema: "PASS",
      shaderContract: "PASS",
      appendOnly: "PASS",
      registryEvaluation: "PASS",
      webRuntime: "PENDING_LIVE_BROWSER",
      splineRuntime: "PENDING_SCENE_VARIABLE_CHECK",
      unrealMaterialCompile: "PENDING"
    },
    hashes: {
      candidate: sha256(JSON.stringify(candidate)),
      fragmentSource: sha256(fragmentSource),
      outputRegistry: sha256(output)
    }
  };

  await Promise.all([
    fs.mkdir(path.dirname(args.out), { recursive: true }),
    fs.mkdir(path.dirname(args.receipt), { recursive: true }),
    fs.mkdir(path.dirname(args.adapter), { recursive: true })
  ]);
  await fs.writeFile(args.out, output);
  await fs.writeFile(args.receipt, `${JSON.stringify(receipt, null, 2)}\n`);
  await fs.writeFile(args.adapter, `${JSON.stringify(adapter, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Promotion failed: ${error.message}\n`);
  process.exitCode = 1;
});
