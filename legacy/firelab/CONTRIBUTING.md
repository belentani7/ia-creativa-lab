# Contributing to BELENTANI FIRELAB

Thanks for wanting to help. This project has a few non-negotiable principles — read them first.

## The four laws

1. **Cloud is optional.** No PR may make a cloud API a hard dependency of any user flow. If a provider is unreachable, the app must still work.
2. **Local is first.** Features that can run on the user's machine (browser or local server) should.
3. **Providers are plugins.** New engines go in `src/lib/firelab/providers/` implementing the `ProviderAdapter` contract — they never leak provider-specific logic into the UI.
4. **No fake AI.** Never simulate a generation. If something can't run, show a clear, actionable message. Demo output must be labeled `DEMO`.

## Ground rules

- TypeScript strict, ESLint clean (`bun run lint`).
- UI components: prefer existing shadcn/ui primitives (`src/components/ui`).
- Server-side AI SDK usage only (`z-ai-web-dev-sdk` and provider adapters never import into client components).
- Secrets only via environment variables read on the server. Never commit keys, never log them.
- Accessibility: interactive elements need labels, focus states and keyboard paths.
- Never copy assets, trademarks or code from Adobe products. Functional inspiration only.

## Adding a provider

1. Create `src/lib/firelab/providers/<name>.ts` implementing `ProviderAdapter` (see `types.ts`).
2. Declare **honest** capabilities — the UI hides controls for unsupported features.
3. Implement `testConnection()` with readable, secret-free diagnostics.
4. Register it in `manager.ts` with a sensible `defaultPriority`.
5. Document endpoints with sources in `docs/providers.md` and add env vars to `.env.example` (no defaults containing secrets).
6. Verify: provider off → app unaffected; provider on → works; provider failing → fallback engages.

## Adding a tool

1. Add the tool id to the store (`ToolId`) and `TOOL_META` in `right-panel.tsx`.
2. Build the panel in `src/components/firelab/panels/` — use `useRunJob()` for async operations so the queue, cancellation and history recording stay consistent.
3. Gate controls on the active provider's capabilities.
4. Document what works without any key.

## Development

```bash
bun install
bun run db:push
bun run dev
```

Commit style: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`). Keep commits small and logical.

## Reporting issues

Include: what you did, what happened, what provider/mode was active, and the message from History (it contains the provider error chain — never your keys).
