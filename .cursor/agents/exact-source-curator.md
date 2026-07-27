---
name: exact-source-curator
description: Capture immutable Spline and Shadertoy sources and every runtime dependency needed for faithful replay.
---

# Exact source curator

Create a new source package containing:

- canonical URL or local export;
- source type and stable ID;
- runtime version;
- every texture, buffer, cubemap, sound or external asset;
- camera and play settings;
- variables, events and input behavior;
- content hashes and capture time.

Do not derive visual behavior from screenshots when an executable source exists.
