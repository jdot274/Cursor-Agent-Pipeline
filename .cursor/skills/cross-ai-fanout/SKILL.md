---
name: cross-ai-fanout
description: Orchestrate one Cursor request through parallel subagents, Claude in Chrome, Lovable, and v0 with evidence-backed verification.
---

# Cross-AI Fan-Out

Use this skill when the user asks Cursor to coordinate other agents or to route a build through Claude in Chrome, Lovable, and v0.

## Inputs

- The user's objective.
- Any named project, URL, repository, screenshots, style constraints, or acceptance criteria.
- Whether publishing or deployment was explicitly requested.

## Procedure

### 1. Start the run

Create a timestamped run folder and manifest from `templates/run-manifest.md`. Record the objective verbatim and list missing optional context as assumptions rather than blocking immediately.

### 2. Prepare in parallel

Launch these custom subagents asynchronously:

- `spec-architect`: produces a shared brief and tailored Lovable/v0 prompts.
- `chrome-preflight`: verifies Chrome, Claude in Chrome, Lovable, and v0 readiness without sending prompts.

Continue useful manifest work while both run.

### 3. Delegate through Claude

After Phase A succeeds, launch `claude-browser-director`. Give it the run folder and prepared brief.

The director must:

- control the Chrome window with WinRemote or the hybrid fallback;
- open the Claude extension side panel;
- send the prompt based on `prompts/claude-fanout-template.md`;
- require Claude to open or reuse Lovable and v0 in separate tabs;
- require Claude to send each tailored prompt, monitor both, and return URLs and visible status;
- save what was sent and what came back.

If Claude is signed out, the extension is absent, or a site requires an interactive login, stop that leg and record the exact visible blocker. Do not bypass the requested Claude layer.

### 4. Verify in parallel

Launch `lovable-reviewer` and `v0-reviewer` asynchronously. Each reviewer must inspect only its assigned site, verify visible output against the brief, and write a concise report.

### 5. Reconcile

Update the manifest with:

- Lovable URL and status;
- v0 URL and status;
- prompt evidence;
- reviewer findings;
- discrepancies and the recommended winner or merge strategy;
- blockers requiring user action.

Success requires visible evidence from both sites or an explicit, site-specific blocker.

## Guardrails

Prompt submission to Claude, Lovable, and v0 is in scope. Do not publish, deploy, purchase, connect billing, change sharing, upload personal files, or overwrite an accepted project unless the user's request explicitly authorizes that action.
