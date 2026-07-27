import fs from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import YAML from "yaml";

const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("Pass a manifest path.");

const schemaRoot = new URL(
  "./node_modules/@bluefly/openstandardagents/spec/v0.5/",
  import.meta.url,
);
const schema = JSON.parse(
  fs.readFileSync(new URL("agent.schema.json", schemaRoot), "utf8"),
);
const emotion = JSON.parse(
  fs.readFileSync(new URL("extensions/emotion.schema.json", schemaRoot), "utf8"),
);
const manifest = YAML.parse(fs.readFileSync(manifestPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(emotion);
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log(`OSSA schema validation PASS: ${manifest.metadata.name} ${manifest.metadata.version}`);
