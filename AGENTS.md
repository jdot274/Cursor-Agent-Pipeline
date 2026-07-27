# Relay Pipeline Operating Rules

This workspace turns one Cursor prompt into a supervised multi-agent workflow. It supports a web-builder route and a fidelity-first design-to-realtime route.

## Web-builder topology

1. Cursor is the supervisor and owns the run manifest.
2. Cursor launches independent preparation agents in parallel.
3. The Claude Browser Director controls the existing Claude in Chrome extension and gives Claude the prepared fan-out prompt.
4. Claude opens or reuses separate Lovable and v0 tabs, prompts both, monitors both, and returns their links and visible status.
5. Independent reviewer agents verify Lovable and v0 in parallel.
6. Cursor reconciles the evidence and gives one final result.

Do not flatten the topology by prompting Lovable or v0 directly from Cursor when the request invokes this pipeline. If Claude in Chrome is unavailable or signed out, stop that leg and report the exact handoff needed.

## Exact design-to-realtime topology

1. Cursor is the supervisor and owns one append-only run package plus the validated `ossa/relay-exact-runtime.ossa.yaml` team manifest.
2. Launch `figma-design-director`, `exact-source-curator`, and `realtime-export-architect` in parallel.
3. Use both Figma MCP connections deliberately:
   - `figma` is the preferred remote server for file or node links, design context, variables, components, Make resources, and supported write-to-canvas actions.
   - `figma-dev-mode-mcp-server` is the local desktop server for selection-based context while Figma Desktop is open.
4. Launch `shader-studio-agent` after the Figma contract exists. Actual live GLSL/WebGL authoring uses GL Shader Studio in Figma Desktop or a versioned standalone shader package. MCP design context is not a shader runtime.
5. Launch `spline-instrument-agent`. Spline is a live authoring/runtime surface: retain the original `.splinecode`, runtime version, materials, camera, animation, events and variables. Never substitute reconstructed geometry when an executable source exists.
6. For Shadertoy, retain the original ID or complete exported pass graph including Common, Image, Buffer A-D, channels, textures and cubemaps. A screenshot or single-pass rewrite is not an exact source.
7. Launch `promotion-gate-agent`. It validates both provenance and the visual-behavior contract before creating a signed promotion receipt.
8. Launch `unity-exact-runtime-agent`. Unity 6 WebGL is the default fidelity destination because it can compose the original Spline or Shadertoy web runtime and bridge shared controls without translating the source.
9. Launch `blender-bake-bridge-agent` only for an optional native mesh, texture, flipbook or bake variant. Blender never replaces the accepted live source.
10. Launch `asset-qc-agent` after delivery. Completion requires visible source/destination comparison plus animation and pointer/touch interaction evidence.

The default exact-runtime destination is `unity\RelayExactRuntime_v1`. Unreal remains an explicit native-adapter destination, not the default fidelity path. When Unreal is requested, use `C:\UEProjects\Lyra_5.7\Lyra.uproject`; use `C:\UEProjects\Lyra_5.7\Plugins\SPIN` only for SPIN-specific work.

## Execution rules

- Use Cursor's `Task` tool with `run_in_background: true` for independent work.
- For `/cross-ai-build`, launch `spec-architect` and `chrome-preflight` together, then `claude-browser-director`, then `lovable-reviewer` and `v0-reviewer` together.
- For `/design-to-runtime`, launch the source, runtime, Unity and verification work described above.
- `/design-to-unreal` remains a compatibility command for an explicitly requested native Unreal port.
- Use the installed `winremote` MCP for Chrome side-panel control. Use `hybrid_automation_v2` as the fallback. Use `browser-use` or `chrome-devtools-mcp` only for page-level inspection and verification.
- Reuse signed-in Chrome tabs. Never inspect cookies, passwords, tokens, or browser storage.
- Prompting Claude, Lovable, and v0 is authorized by the pipeline request. Publishing, deploying, purchasing, changing access, or overwriting an existing project requires a separate explicit instruction.
- Preserve existing projects. Create a new iteration or branch unless the user explicitly identifies an existing target to edit.
- Save evidence to `runs/<timestamp>/`: manifest, prompts sent, URLs, screenshots when available, status, and blockers.
- Web-builder runs are complete only when both target sites have a visible response or the manifest records a precise blocker for that leg.
- Exact-runtime runs are complete only when the original source loads, animation runs, direct interaction responds, Unity WebGL hosts the source, and the fidelity receipt passes. Native-engine translations are separate variants and must disclose every loss.
- Never claim raw GLSL is automatically portable to Unreal. Preserve GLSL as source, export a neutral manifest, then either rebuild the effect in Unreal Material/HLSL or bake unsupported procedural inputs.

## User-facing entry point

The user can use:

`/cross-ai-build <goal>`

`/design-to-runtime <goal>`

`/design-to-unreal <goal>` (native Unreal variant)

Natural-language requests should route to the matching workflow.
