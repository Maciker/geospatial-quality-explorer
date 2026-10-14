# Model integration, self-correction loop and sandbox

This document covers the three architectural improvements that make the harness
model-agnostic, self-correcting and reproducible.

## 1. AI client abstraction (ports and adapters)

`tools/ai/llm-client.mjs` defines a single port. Every provider is an adapter that
implements `async complete(request) -> result`:

```text
request: { system?, prompt?, messages?, tools?, responseSchema?, jsonObjectMode?,
           temperature?, maxTokens?, model?, toolChoice?, extraBody? }
result:  { text, json?, toolCalls, usage?, raw }
```

Adapters:

- `adapters/openai-compat.mjs`: OpenAI and any OpenAI-compatible endpoint (Azure, vLLM,
  Ollama, Groq, OpenRouter). Maps `responseSchema` to `response_format: json_schema`.
- `adapters/anthropic.mjs`: Anthropic Messages API (system/messages/tools dialect).
- `adapters/qwen.mjs`: Qwen via the DashScope OpenAI-compatible endpoint. Hardens the two
  weak spots the audit flagged: it forces JSON-only output (json_object mode plus an explicit
  instruction unless `structuredOutputs` is enabled) and disables parallel tool calls.
- `adapters/mock.mjs`: offline adapter for tests and `--dry-run`.

Swapping a model is a configuration change, never a code change. Configure per role with
environment variables (see `.env.example`): `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`,
`AI_API_KEY`, and role overrides such as `AI_QA_PROVIDER` / `AI_QA_MODEL`.

### Automated cross-model QA

`tools/qa/run-cross-model-qa.mjs` (`pnpm qa:run`) replaces the manual copy-paste QA step:

1. Generates the QA input from the diff if missing (`prepare-qa-input.mjs`).
2. Sends it to the QA model with the `qa-review` JSON schema enforced.
3. Extracts and writes `qa-review.json`, validates it, and optionally runs the gate (`--gate`).

It refuses to run when the QA model equals the implementer model, enforcing the cross-model policy.

```bash
pnpm qa:run -- --base origin/main --head HEAD --gate
AI_QA_PROVIDER=mock pnpm qa:run -- --dry-run   # offline smoke test
```

## 2. Self-correction loop

`tools/loop/verify-and-iterate.mjs` (`pnpm loop`) closes the verify -> findings -> fix loop
that `quality.yml` only described as policy (`max_iterations`). Each run:

1. Executes the verify command (`pnpm quality:<level>` by default).
2. Aggregates deterministic findings and the QA gate report.
3. Decides `pass`, `iterate` or `stop` against `max_iterations` (2 by default, matching the two fix rounds allowed by `.ai/commands/pre-pr.md`).
4. On failure, writes a `correction-NN.md` artifact (prioritised findings + instructions) for
   the executor, and persists iteration state under `workspace/loop/state.json`.

Exit codes: `0` pass, `2` iterate (apply the correction and run again), `1` stop (escalate).

```bash
pnpm loop -- --level full --max-iterations 2
pnpm loop:status
pnpm loop:reset
```

## 3. Reproducible sandbox

`tools/sandbox/run-in-sandbox.mjs` (`pnpm sandbox`) runs the quality gates against a clean,
detached git worktree so agent-generated code is verified without contaminating the working tree.
It installs the locked dependencies (`pnpm install --frozen-lockfile`). The worktree separates
the checkout only: commands still run with your user's network and file-system access.

```bash
pnpm sandbox -- --ref HEAD --cmd "pnpm quality:full"
pnpm sandbox -- --keep --no-install   # debug the worktree
```

For container-based isolation, `.devcontainer/devcontainer.json` provides a Node 22 + pnpm
environment with the same gates.
