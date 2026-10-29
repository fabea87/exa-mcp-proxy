---
name: exa-search
description: Default web search for all queries — real-time web research, current events, deep topic dives, background information, and full-page content extraction via the official Exa MCP server (https://mcp.exa.ai/mcp). Always use this as the primary web search skill unless the user explicitly requests querying academic literature databases (Crossref/OpenAlex) or their local Zotero library.
---

# Exa Neural Search & Research Skill

- **Direct tools (also callable in `codemode`)**:
  - `mcp__exa__web_search_exa({ query, numResults })` — default `auto` neural search
  - `mcp__exa__web_fetch_exa({ urls, maxCharacters })` — primary web-to-Markdown fetcher (batch multiple URLs in `urls`)
- **Codemode tools**:
  - `tools.mcp__exa__agent_run({ query, effort: "minimal" | "low" | "medium" | "high" | "auto", outputSchema, systemPrompt, dataSources, runId, previousRunId })` — autonomous multi-step research, list building, enrichment, and structured output
  - `tools.mcp__exa__web_search_advanced_exa({ query, type: "auto" | "lite" | "deep" | "deep-reasoning", category, includeDomains, excludeDomains, startPublishedDate, endPublishedDate, ... })` — full Exa Search API control
  - `tools.mcp__exa__deep_search_exa(...)` — backwards-compatible alias (prefer `agent_run` or `web_search_advanced_exa`)

## 1. Tool Selection (`auto` vs. `agent_run` vs. `deep`)

- **Routine lookups & fast discovery (`auto`, ~$0.007, 1–2s)**: Use `web_search_exa` (or `web_search_advanced_exa`) for everyday lookups, breaking news, fact verification, and targeted single-angle research.
- **Autonomous multi-step research & lists (`agent_run`, ~$0.012–$0.05+, 10–50s)**: Use `agent_run` for multi-step investigations, competitive analysis, entity lists, or grounded synthesis.
  - Omit `effort` to use default `low` ($0.02). Use `minimal` ($0.012) for quick checks, `medium` ($0.05) or `high` ($0.10) for exhaustive sweeps.
  - Pass `outputSchema` (top-level object with bounded arrays and evidence fields) and `systemPrompt` for structured findings.
  - If returned status is `"running"`, resume by calling `agent_run` again with `runId` until `outputReady` is true.
- **Academic & deep synthesis (`web_search_advanced_exa` with `type: "deep"`, ~$0.012–$0.015)**: Use when domain filters (`includeDomains`) or date bounds are needed with query expansion and structured answers.

## 2. Neural Search Principles (for `web_search_exa` / `web_search_advanced_exa`)

- **Describe the target page, not the question**: e.g. `"category:publication empirical study findings on generative AI in EFL writing classrooms 2025 2026"`.
- **Category prefixes** (prepend inline to `query`): `category:publication`, `category:news`, `category:people`, `category:company`, `category:personal site`.
- **Result sizing (`numResults`)**: `5` for specific entities/known papers; `10` default; `15` for broad sweeps (never exceed 25).

## 3. Two-Stage Workflow & Output Standards

1. **Discovery**: Run `web_search_exa` (`auto`) for targeted queries, or `agent_run` for autonomous multi-step investigations.
2. **Extraction (`web_fetch_exa`)**: Batch the top 2–4 authoritative URLs in a single `web_fetch_exa({ urls: [...] })` call to retrieve full Markdown text, statistics, and exact quotes.
3. **Synthesis**: Separate empirical findings (sample size $N$, design, effect sizes) from commentary; cite every claim with `[Title / Source](URL)`.
