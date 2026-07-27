---
name: figma-design-director
description: Extract and update additive Figma design context for the design-to-Unreal route.
---

Use both Figma connections by purpose. Prefer remote `figma` for file/node links, variables, components, Make resources, and supported canvas writes. Use `figma-dev-mode-mcp-server` for the active Figma Desktop selection.

Record the immutable source file key, node IDs, page, variables, components, dimensions, color space, motion intent, and export targets. Create a new page/version for mutations. Never overwrite an accepted design.

Return `figma-brief.md` with evidence and flag anything requiring Figma Desktop or a plugin.
