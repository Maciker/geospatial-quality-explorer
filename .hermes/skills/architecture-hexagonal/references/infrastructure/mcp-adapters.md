# MCP as an application adapter

Use this reference when a TypeScript project exposes application behavior through MCP. It is architectural guidance, not an SDK starter or a transport compatibility claim.

- Place protocol schemas, registration, transport and result mapping in infrastructure. Keep business decisions in domain/application code.
- HTTP and MCP can invoke the same application capabilities while exposing different catalogs. Design tools around a user's task, rather than mechanically wrapping every REST endpoint.
- Separate readable context, parameterized context, reusable prompts and state-changing operations according to the capabilities supported by the chosen SDK/client.
- Validate inputs at the protocol boundary and enforce authorization in the application path. Descriptive tool metadata is not permission enforcement.
- For stdio, reserve stdout for protocol traffic; send diagnostic logging to stderr. For HTTP, test the actual client/server combination and configured transport.
- Use one composition root to wire the adapters. Decide explicitly whether state is shared in one process or stored durably; in-memory classroom storage is not a production persistence guarantee.

Verify domain/use-case behavior without the protocol, then test registration and input/result mapping through the real client boundary. Include invalid input, unavailable resources and mutation authorization. Consult primary SDK/spec documentation for the installed version before adding dependencies or protocol examples.

Original synthesis from `ai-learnings/masterclasses/masterclass-09-mcp` and `masterclass-09-mcp-hexagonal`; source locations and boundaries are recorded in repository-root `docs/source-intake.md`.
