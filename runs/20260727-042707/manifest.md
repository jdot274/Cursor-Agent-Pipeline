# Relay Run Manifest

- Started: 2026-07-27T08:27:07.815Z
- Mode: design-to-unreal
- Objective: Convert a Spline scene into an Unreal level
- Supervisor: Cursor
- Status: RUNNING

## Run parameters

- Route: design-to-realtime-3D (`/design-to-unreal`)
- Source: Spline scene (specific scene URL/ID not supplied in the request — discovery is Stage 1 work)
- Figma source: not supplied; to be discovered or explicitly recorded as absent
- Unreal destination: `C:\UEProjects\Lyra_5.7\Lyra.uproject` (default; not SPIN-specific)
- Run folder: reused exactly as instructed, append-only

## Stage log

### Stage 1 — source context + neutral contract (launched)

- `figma-design-director` (source discovery + design brief) → `figma-brief.md`
- `realtime-export-architect` (neutral scene contract) → `scene-contract.json`
