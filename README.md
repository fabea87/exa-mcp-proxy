# Exa MCP Load-Balancing Proxy & Agent Skill

A zero-dependency **Cloudflare Worker + SQLite Durable Object** load-balancing proxy for the official [Exa MCP Server](https://mcp.exa.ai/mcp), paired with a minimalist **Agent Skill (`skills/exa-search/SKILL.md`)** optimized for [Pi](https://github.com/earendil-works/pi-coding-agent) and MCP-compatible coding agents.

---

## Why This Exists

1. **Multi-Key Quota Pooling & Load Balancing**: Pool multiple Exa API keys behind a single MCP endpoint. Requests are distributed evenly across active keys (`least_used` or `round_robin`) with synchronous pre-claiming so even concurrent `Promise.all` bursts balance cleanly.
2. **SSE-Aware Automatic Failover**: Exa's MCP server wraps upstream key errors (`401` invalid key, `402` out of credits/quota, `429` rate limit) inside HTTP `200 OK` Server-Sent Event (`text/event-stream`) frames (`"isError": true`). The proxy inspects both HTTP status codes and SSE JSON-RPC payloads:
   - `401 / 403` → Marks key `INVALID` (`enabled = 0`) and immediately retries with the next healthy key.
   - `402` (Quota/Credits Exhausted) → Marks key `EXHAUSTED` (`enabled = 0`) and immediately retries with the next healthy key.
   - `429` (Rate Limit) → Places key into a 60-second `COOLDOWN` (auto-recovers) and immediately retries with the next healthy key.
3. **100% Lossless MCP Pass-Through**: Preserves all MCP Streamable HTTP methods (`initialize`, `notifications/initialized`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`) and URL query filters (`?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,deep_search_exa`). Non-tool handshake RPCs do not inflate key usage counters.
4. **Real-Time Cost & Quota Tracking**: Automatically parses `_meta["ai.exa/usage"].costDollars` from every Exa MCP response (`$0.007` per `auto` search, `$0.001` per fetched URL, `$0.012–$0.015` per `deep` / `deep-reasoning` search) to track per-call cost, cumulative per-key spend, and estimated remaining balance against each key's configured quota (`$10` or `$20`).
5. **Built-in WebUI Dashboard (`/`)**: Add single or batch keys (`label | key | quotaUsd`), verify key health, switch load-balancing strategies, inspect per-key load share bars, and monitor live call logs.

---

## Repository Structure

```text
exa-mcp-proxy/
├── src/
│   ├── index.js                  # Cloudflare Worker + ExaProxyCoordinator SQLite Durable Object
│   └── ui.js                     # Embedded single-page WebUI dashboard
├── skills/
│   └── exa-search/
│       └── SKILL.md              # Recommended minimalist Exa Skill (auto vs. deep/deep-reasoning)
├── examples/
│   └── mcp.json                  # Recommended Pi MCP configuration (hybrid codemode + direct)
├── wrangler.toml                 # Zero-ID SQLite Durable Object configuration
└── package.json
```

---

## 1. Deploy the Cloudflare Worker

Uses Cloudflare's SQLite-backed Durable Objects (`new_sqlite_classes`), which work on the **Cloudflare Workers Free Plan** and require **no manual KV or D1 namespace IDs**.

```bash
# 1. Authenticate Wrangler (if not already logged in)
npx wrangler login

# 2. Deploy Worker + SQLite Durable Object
npx wrangler deploy

# 3. Set your Proxy API Key secret (protects both /mcp and the WebUI)
npx wrangler secret put PROXY_API_KEY
```

Open your deployed Worker URL (`https://<your-worker-name>.<your-subdomain>.workers.dev/`), enter your `PROXY_API_KEY`, and add your Exa API keys via **Single Key** or **Batch Import**.

---

## 2. Recommended Pi MCP + Skill Setup

### A. Hybrid `codemode` + `direct` Exposure (`~/.pi/agent/mcp.json`)

See [`examples/mcp.json`](examples/mcp.json). Setting `"exposure": "codemode"` at the server level with `"toolExposure": { "web_search_exa": "direct" }` gives you:
- **Instant 1-step default search** via `mcp__exa__web_search_exa` (`direct`) with minimal per-turn token overhead.
- **Zero schema bloat** from the 28-parameter `web_search_advanced_exa` and `deep_search_exa` tools, which stay callable on demand inside `codemode`.

```json
{
  "mcpServers": {
    "exa": {
      "url": "https://<your-worker-name>.<your-subdomain>.workers.dev/mcp?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,deep_search_exa",
      "headers": {
        "x-api-key": "${EXA_PROXY_API_KEY}"
      },
      "exposure": "codemode",
      "toolExposure": {
        "web_search_exa": "direct"
      },
      "description": "Real-time web search, advanced search, deep research, and content extraction via Exa LB Proxy"
    }
  }
}
```

### B. Minimalist Agent Skill (`skills/exa-search/SKILL.md`)

Copy [`skills/exa-search/SKILL.md`](skills/exa-search/SKILL.md) to `~/.pi/agent/skills/exa-search/SKILL.md`. It keeps instructions under 40 lines and teaches the agent two critical rules that tool schemas alone do not enforce:

1. **Target-Page Embedding Queries (`auto`)**: Formulate queries as descriptions of the ideal target page with inline category prefixes (`category:publication`, `category:news`, `category:people`, etc.) rather than keyword questions.
2. **Unlocking `deep` & `deep-reasoning` Synthesis (`deep_search_exa`)**:
   - Use `web_search_exa` (`auto`, ~2–4s, `$0.007`) for routine lookups and fast source discovery.
   - Use `deep_search_exa` (`type: "deep"` 4–12s or `"deep-reasoning"` 12–50s, `$0.012–$0.015`) for literature reviews, multi-angle synthesis, and resolving conflicting empirical evidence.
   - **Always pass `outputSchema` and `systemPrompt` (and omit long manual `search_queries`)** when calling `deep_search_exa`: without `outputSchema`, the upstream MCP wrapper strips the synthesized output and returns only raw snippets; with `outputSchema`, it returns structured synthesis (`output.content`), field-level citations (`output.grounding`), and full source highlights (`results`).

---

## License

MIT
