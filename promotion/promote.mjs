import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

function fail(message) {
  throw new Error(`Promotion blocked: ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertFiniteControl(name, control) {
  if (!control || typeof control !== "object") fail(`missing control ${name}`);
  if (typeof control.uniform !== "string" || !control.uniform) fail(`${name} has no uniform`);
  if (typeof control.type !== "string" || !control.type) fail(`${name} has no type`);
  if (control.default === undefined) fail(`${name} has no default`);
  if (typeof control.default === "number" && !Number.isFinite(control.default)) {
    fail(`${name} default is not finite`);
  }
}

function validateCandidate(candidate, fragment) {
  if (candidate.schemaVersion !== "refract.visual-behavior/1") fail("unsupported schemaVersion");
  if (!/^[a-z0-9][a-z0-9-]+$/.test(candidate.id ?? "")) fail("invalid asset id");
  if (!candidate.name || !candidate.type) fail("name and type are required");
  if (!fragment.includes("void main(") && !fragment.includes("void main (")) {
    fail("fragment shader has no main() entry point");
  }

  for (const controlName of ["morph", "flow", "heat", "grab", "stretch", "twist", "scale"]) {
    const control = candidate.controls?.[controlName];
    assertFiniteControl(controlName, control);
    if (!fragment.includes(control.uniform)) {
      fail(`fragment shader does not declare ${control.uniform} for ${controlName}`);
    }
  }

  if (!fragment.includes("uPointer")) fail("direct manipulation is missing uPointer");
  if (!candidate.interactions?.release) fail("release behavior is not defined");
  if (!candidate.destinations?.web || !candidate.destinations?.spline || !candidate.destinations?.unreal) {
    fail("web, spline, and Unreal destinations are required");
  }
}

function registryAsset(candidate, fragment) {
  return {
    name: candidate.name,
    type: candidate.type,
    src: `promotion-gate:${candidate.id}@${candidate.schemaVersion}`,
    def: {
      m: candidate.controls.morph.default,
      f: candidate.controls.flow.default,
      h: candidate.controls.heat.default,
    },
    behavior: {
      schema: candidate.schemaVersion,
      id: candidate.id,
      controls: Object.fromEntries(
        Object.entries(candidate.controls).map(([name, control]) => [
          name,
          {
            uniform: control.uniform,
            type: control.type,
            default: control.default,
            min: control.min,
            max: control.max,
            keyframeable: control.keyframeable ?? false,
          },
        ]),
      ),
      interactions: candidate.interactions,
    },
    vert: candidate.shader.vertex,
    frag: fragment,
  };
}

async function ensureAbsent(filePath) {
  try {
    await fs.access(filePath);
    fail(`refusing to overwrite ${filePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const candidatePath = path.resolve(argument("candidate") ?? "");
const baseRegistryPath = path.resolve(argument("base-registry") ?? "");
const outputRegistryPath = path.resolve(argument("output-registry") ?? "");
const receiptPath = path.resolve(argument("receipt") ?? "");
const unrealHandoffPath = path.resolve(argument("unreal-handoff") ?? "");

if ([candidatePath, baseRegistryPath, outputRegistryPath, receiptPath, unrealHandoffPath].some((value) => !value)) {
  fail("candidate, base-registry, output-registry, receipt, and unreal-handoff arguments are required");
}

await Promise.all([
  ensureAbsent(outputRegistryPath),
  ensureAbsent(receiptPath),
  ensureAbsent(unrealHandoffPath),
]);

const candidate = JSON.parse(await fs.readFile(candidatePath, "utf8"));
const fragmentPath = path.resolve(candidate.source.fragmentPath);
const [fragment, baseRegistry] = await Promise.all([
  fs.readFile(fragmentPath, "utf8"),
  fs.readFile(baseRegistryPath, "utf8"),
]);

validateCandidate(candidate, fragment);

if (baseRegistry.includes(`"name": "${candidate.name}"`)) {
  fail(`registry already contains ${candidate.name}`);
}

const asset = registryAsset(candidate, fragment);
const baseVersion = path.basename(baseRegistryPath).match(/legacy_engines\.v(\d+)\.js$/)?.[1] ?? "?";
const outputVersion = path.basename(outputRegistryPath).match(/legacy_engines\.v(\d+)\.js$/)?.[1];
if (!outputVersion) fail("output registry must be named legacy_engines.vN.js");
const baseCount = (baseRegistry.match(/\n\s*"name":/g) ?? []).length;
const nextHeader = `window.REFRACT_LEGACY = [ // v${outputVersion} = v${baseVersion} (${baseCount}) + ${candidate.name} (Promotion Gate visual-behavior v1)`;
const withHeader = baseRegistry.replace(/^window\.REFRACT_LEGACY = \[.*$/m, nextHeader);
const closing = withHeader.lastIndexOf("\n];");
if (closing < 0) fail("base registry closing marker was not found");
const nextRegistry = `${withHeader.slice(0, closing)},\n${JSON.stringify(asset, null, 1)}${withHeader.slice(closing)}`;

const receipt = {
  receiptVersion: "refract.promotion-receipt/1",
  promotedAt: new Date().toISOString(),
  asset: {
    id: candidate.id,
    name: candidate.name,
    schemaVersion: candidate.schemaVersion,
  },
  inputs: {
    candidatePath,
    candidateSha256: sha256(JSON.stringify(candidate)),
    fragmentPath,
    fragmentSha256: sha256(fragment),
    baseRegistryPath,
    baseRegistrySha256: sha256(baseRegistry),
  },
  outputs: {
    registryPath: outputRegistryPath,
    registrySha256: sha256(nextRegistry),
    unrealHandoffPath,
  },
  gates: {
    schema: "PASS",
    shaderContract: "PASS",
    semanticControls: "PASS",
    directManipulation: "PASS",
    appendOnly: "PASS",
    webRuntime: "PENDING_LIVE_CHECK",
    splineRuntime: "PENDING_LIVE_CHECK",
    unrealMaterialCompile: "PENDING",
  },
};

const unrealHandoff = {
  handoffVersion: "refract.unreal-material-handoff/1",
  assetId: candidate.id,
  targetProject: candidate.destinations.unreal.project,
  sourceFragment: fragmentPath,
  semanticParameters: {
    uMorph: "ScalarParameter Morph",
    uFlow: "ScalarParameter Flow",
    uHeat: "ScalarParameter Heat",
    uPointer: "VectorParameter Pointer",
    uGrab: "ScalarParameter Grab",
    uStretch: "VectorParameter Stretch",
    uTwist: "ScalarParameter Twist",
    uScale: "ScalarParameter Scale",
  },
  strategy: [
    "Port fragment-domain math into an Unreal Material Custom node or equivalent material graph.",
    "Adapt vUv to Unreal screen/mesh UVs and replace GLSL-only syntax with Unreal-compatible HLSL.",
    "Expose the semantic and direct-manipulation parameters on a Material Instance.",
    "Do not mark complete until the material compiles in the live editor and the asset passes visual smoke testing.",
  ],
  status: "TRANSLATION_REQUIRED",
};

await Promise.all([
  fs.mkdir(path.dirname(outputRegistryPath), { recursive: true }),
  fs.mkdir(path.dirname(receiptPath), { recursive: true }),
  fs.mkdir(path.dirname(unrealHandoffPath), { recursive: true }),
]);
await Promise.all([
  fs.writeFile(outputRegistryPath, nextRegistry),
  fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`),
  fs.writeFile(unrealHandoffPath, `${JSON.stringify(unrealHandoff, null, 2)}\n`),
]);

console.log(JSON.stringify(receipt, null, 2));
