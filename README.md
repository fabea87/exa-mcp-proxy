# Exa MCP Load-Balancing Proxy & Agent Skill

A zero-dependency **Cloudflare Worker + SQLite Durable Object** load-balancing proxy for the official [Exa MCP Server](https://mcp.exa.ai/mcp), paired with a minimalist **Agent Skill (`skills/exa-search/SKILL.md`)** optimized for [Pi](https://github.com/earendil-works/pi-coding-agent) and MCP-compatible coding agents.

---

## Why This Exists

1. **Multi-Key Quota Pooling & Load Balancing**: Pool multiple Exa API keys behind a single MCP endpoint. Requests are distributed evenly across active keys (`least_used` or `round_robin`) with synchronous pre-claiming so even concurrent `Promise.all` bursts balance cleanly.
2. **SSE-Aware Automatic Failover**: Exa's MCP server wraps upstream key errors (`401` invalid key, `402` out of credits/quota, `429` rate limit) inside HTTP `200 OK` Server-Sent Event (`text/event-stream`) frames (`"isError": true`). The proxy inspects both HTTP status codes and SSE JSON-RPC payloads:
   - `401 / 403` → Marks key `INVALID` (`enabled = 0`) and immediately retries with the next healthy key.
   - `402` (Quota/Credits Exhausted) → Marks key `EXHAUSTED` (`enabled = 0`) and immediately retries with the next healthy key.
   - `429` (Rate Limit) → Places key into a 60-second `COOLDOWN` (auto-recovers) and immediately retries with the next healthy key.
3. **100% Lossless MCP Pass-Through & SSE Streaming**: Preserves all MCP Streamable HTTP methods (`initialize`, `notifications/initialized`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and persistent `GET /mcp` SSE streams) and URL query parameters (`?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,agent_run`, `?debug=true`, `?agentCallWindowMs=...`). Non-tool handshake RPCs and streaming SSE sessions pass through losslessly without hanging or inflating key usage counters.
4. **Real-Time Cost & Quota Telemetry**: Automatically parses `_meta["ai.exa/usage"].costDollars` and `costDollars` JSON structures from Exa API responses with intelligent heuristic fallback ($0.007 per `auto` search with contents included, $0.001 per fetched page, $0.012–$0.015 per deep search, and $0.012–$0.05+ per `agent_run`) to track per-call cost, cumulative per-key spend, and remaining balance against each key's quota ($10 monthly reset or $20 bonus).
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
│       └── SKILL.md              # Recommended minimalist Exa Skill (web_search_exa, web_fetch_exa, agent_run, web_search_advanced_exa)
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

See [`examples/mcp.json`](examples/mcp.json). Setting `"exposure": "codemode"` at the server level with `"toolExposure": { "web_search_exa": "direct", "web_fetch_exa": "direct" }` gives you:
- **Instant 1-step retrieval** via `mcp__exa__web_search_exa` and `mcp__exa__web_fetch_exa` (`direct`) with minimal per-turn token overhead.
- **Zero schema bloat** from multi-step research tools (`agent_run` and `web_search_advanced_exa`), which remain callable on demand inside `codemode`.

```json
{
  "mcpServers": {
    "exa": {
      "url": "https://<your-worker-name>.<your-subdomain>.workers.dev/mcp?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,agent_run",
      "headers": {
        "x-api-key": "${EXA_PROXY_API_KEY}"
      },
      "exposure": "codemode",
      "toolExposure": {
        "web_search_exa": "direct",
        "web_fetch_exa": "direct"
      },
      "description": "Real-time web search, content extraction, advanced search, and autonomous multi-step research via Exa LB Proxy"
    }
  }
}
```

### B. Minimalist Agent Skill (`skills/exa-search/SKILL.md`)

Copy [`skills/exa-search/SKILL.md`](skills/exa-search/SKILL.md) to `~/.pi/agent/skills/exa-search/SKILL.md`. It keeps instructions under 45 lines and guides the agent on tool selection and best practices:

1. **Target-Page Embedding Queries (`web_search_exa`)**: Formulate queries as descriptions of the ideal target page with inline category prefixes (`category:publication`, `category:news`, `category:people`, `category:company`, `category:personal site`) rather than keyword questions.
2. **Autonomous Multi-Step Investigations (`agent_run`)**:
   - Use `agent_run` for multi-step research, list building, and structured output.
   - Set `effort`: `minimal` ($0.012), `low` (default, $0.02), `medium` ($0.05), or `high` ($0.10).
   - Supply `outputSchema` and `systemPrompt` for structured answers. If returned status is `running`, resume with `runId`.
3. **Advanced Search & Domain Filters (`web_search_advanced_exa`)**:
   - Use when exact domain filtering (`includeDomains`), publication dates, or `type: "deep"` (~$0.012) / `"deep-reasoning"` (~$0.015) are needed.

---

## License

MIT
