Use the text after this command as the objective.

Run the `design-to-realtime-3d` skill and obey `AGENTS.md`.

1. If the request names an existing `runs/<timestamp>` folder, reuse that exact folder and its manifest. Otherwise create a new append-only run folder.
2. Record the source Figma file/node, intended Spline scene or export target, and Unreal destination. Default Unreal to `C:\UEProjects\Lyra_5.7\Lyra.uproject`.
3. Launch `figma-design-director` and `realtime-export-architect` together with `Task(..., run_in_background: true)`.
4. Reconcile their outputs into `scene-contract.json` and `figma-brief.md`.
5. Launch `shader-studio-agent`. Require a versioned GLSL package, explicit uniforms, aspect/color/alpha contract, and compiler evidence.
6. Launch `spline-instrument-agent`. Require `morph`, `flow`, and `heat` plus available grab/stretch/twist/scale variables to visibly change the live scene.
7. Launch `promotion-gate-agent`. It must write a new registry version and `promotion-receipt.json` without modifying the prior registry.
8. Launch `unreal-handoff-agent`. Use the promoted behavior contract for a real Material/Custom HLSL, Niagara, Blueprint, C++, or documented bake implementation. Use Blender only when conversion, baking, normals, or package repair is needed.
9. Launch `asset-qc-agent`. Require checks for scale, transforms, normals, materials, textures, animation, shader parameters, and a real Unreal editor or packaged smoke result.
10. Return source/version IDs, Spline variable evidence, promotion receipt, Unreal content paths, shader translation method, evidence, and exact blockers.

Do not report completion from Figma frames, MCP context, a Spline link, a generated registry, or a `.glb` alone.
