Use the text after this command as the objective.

Run the `cross-ai-fanout` skill and obey `AGENTS.md`.

1. If the request names an existing `runs/<timestamp>` folder, reuse that exact folder and its manifest. Otherwise create `runs/<timestamp>/manifest.md` from `templates/run-manifest.md`.
2. Launch `spec-architect` and `chrome-preflight` at the same time with `Task(..., run_in_background: true)`.
3. Wait for both Phase A results and record them in the manifest.
4. Launch `claude-browser-director`. It must prompt the existing Claude in Chrome extension using the prepared fan-out prompt. Claude must create separate Lovable and v0 workstreams.
5. When Claude returns the two handoffs, launch `lovable-reviewer` and `v0-reviewer` at the same time.
6. Reconcile all outputs. Return the Lovable URL, the v0 URL, what each produced, verification evidence, and any exact blocker.

Do not claim success from a sent prompt alone. Require visible response or visible generation state from both sites.
