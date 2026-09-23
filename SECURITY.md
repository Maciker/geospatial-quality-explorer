# Security

## Scope

Only the current main branch is maintained. This project provides workflow instructions and development tooling, not a security boundary. Markdown permissions, regex hooks and git worktrees do not isolate untrusted code from your machine, network or credentials.

## Reporting a vulnerability

Do not put tokens, private code, exploit details or personal data in a public issue or PR.
If GitHub private vulnerability reporting is enabled, use the repository's Security tab to report a vulnerability privately. Otherwise open a public issue containing only a request for a private contact channel, without vulnerability details, and wait for the maintainer to arrange one.

Include affected revision, reproduction steps and expected/actual behavior through the private channel. No response-time SLA is offered.

## Safe operation

- Never commit .env files, credentials or private QA inputs/outputs.
- Inspect diffs and generated QA prompts before sending them to a model provider. Prompts can include source code, plans and repository metadata.
- Review MCP servers before enabling them. npx downloads executable dependencies; exact top-level version pins are not a sandbox or a transitive lockfile.
- Run untrusted contributions in a disposable environment without production credentials.
- Do not run privileged pull_request_target workflows on contributor code.
- Keep CI read-only and separate from model-provider credentials.
- Rotate or revoke any exposed credential before considering history cleanup. Deleting a file or branch does not remove copies or reachable history.

The vendor checker detects only a small set of literal token patterns in selected generated files. A passing result is not proof that the repository or its history contains no secrets.
