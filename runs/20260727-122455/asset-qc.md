# Asset QC — VanguardGolfSDF_v1 (neon golf SDF)

| Check | Result |
| --- | --- |
| Live source renders in browser | PASS — `evidence/06-live-A-defaults.png`, HUD "Live SDF golf course running" |
| Animation advances | PASS — frames 213→532, uTime 27.96→69.95 between samples (`evidence/07`) |
| Pointer/touch input responds | PASS — real mouse drag: pointerMoves 0→16, orbit yaw 0.55→1.15 (`evidence/09`) |
| Shared variables respond | PASS — `setControl` drove morph/flow/heat/glass to .95/.90/1.00/.15, DOM + state + visible change (`evidence/08`) |
| Clean browser logs | PASS — 0 console messages, 0 errors, 0 warnings for the full session |
| Exact runtime hosted live | PASS — HTTP 200; live body sha256 == frozen master sha256 (`93A02BB5…`) |
| Provenance pinned + hashed | PASS — master, deploy copy, lineage (Uber + Noise), Unity pair, UE .ush + GlslCompat all SHA256-recorded in `promotion-receipt.json` |
| Unity destination compile/render | PASS — recorded ShaderUtil verification (0 errors/0 warnings, non-trivial render); evidence PNG hash re-verified this pass |
| Unreal destination compile | **PENDING** — no editor session available; honest PENDING with repro steps in `unreal-import.md`; no dialect compatibility claimed |
| Fidelity losses disclosed | PASS — Unity variant explicitly labeled a native HLSL port (NOT the exact runtime); UE variant labeled native with tonemapper/time/parameter losses listed |

## Disclosed fidelity notes

- The exact runtime is the standalone WebGL master (live URL). The Unity `Vanguard/GolfSDF_v1`
  shader is a clearly labeled native visual reconstruction; the UE `.ush` is a clearly
  labeled native variant whose destination compile is still pending.
- No console warnings on the live page (verified this pass: zero console output of any kind).
- Manifest byte-count discrepancy found and recorded (14868 claimed vs 15011 measured for
  the live HTTP body); hashes match everywhere, so content identity is unaffected.

**Result: PASS** — all promotion gates pass except the single honestly-PENDING
Unreal destination compile, which is disclosed with exact reproduction steps and does not
block the run per the portability contract (the variant is not claimed compatible until
a destination compile is observed). No file outside this run package was created or
modified; the frozen master, v2–v5 runtimes/deploys, and both Unity projects were left
untouched.
