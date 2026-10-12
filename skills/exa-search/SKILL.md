---
name: exa-search
description: Default web search for all queries — real-time web research, current events, deep topic dives, background information, and full-page content extraction via the official Exa MCP server (https://mcp.exa.ai/mcp). Always use this as the primary web search skill unless the user explicitly requests querying academic literature databases (Crossref/OpenAlex) or their local Zotero library.
---

# Exa Neural Search & Research Skill

- **Direct tools (also callable in `codemode`)**:
  - `mcp__exa__web_search_exa({ query, objective, numResults })` — default `auto` neural search
  - `mcp__exa__web_fetch_exa({ urls, maxCharacters })` — primary web-to-Markdown fetcher (batch multiple URLs in `urls`)
- **Codemode tools**:
  - `tools.mcp__exa__deep_search_exa({ objective, type: "deep" | "deep-reasoning", systemPrompt, outputSchema, numResults })`
  - `tools.mcp__exa__web_search_advanced_exa({ query, type: "auto" | "fast" | "instant", category, startPublishedDate, ... })`

## 1. Search Mode Selection (`auto` vs. `deep` / `deep-reasoning`)

- **General & routine searches (`auto`, ~$0.007, 1–2s)**: Use `web_search_exa` (or `web_search_advanced_exa` with `type: "auto"`) for everyday lookups, fact-checking, news, and fast single-angle paper discovery.
- **Academic & complex synthesis (`deep` 4–12s / `deep-reasoning` 12–50s, ~$0.012–$0.015)**: Use `deep_search_exa` for literature reviews, multi-angle evidence synthesis, or conflicting findings.
  - **CRITICAL to unlock Deep Search**: Always pass `outputSchema` (e.g. `{ type: "object", properties: { theoreticalSynthesis: { type: "string" }, keyEmpiricalFindings: { type: "array", items: { type: "string" } } }, required: [...] }`) and `systemPrompt`, and **omit `search_queries`** (or keep ≤5 words each) so Exa's research agent autonomously expands sub-queries and returns grounded synthesis (`output.content`), field-level citations (`output.grounding`), and raw `results`. Without `outputSchema`, the MCP server strips the synthesis and returns only raw snippets.

## 2. Neural Search Principles (for `web_search_exa` / `web_search_advanced_exa`)

- **Describe the target page, not the question**: e.g. `"category:publication empirical study findings on generative AI in EFL writing classrooms 2025 2026"`.
- **Category prefixes** (prepend inline to `query`): `category:publication`, `category:news`, `category:people`, `category:company`, `category:personal site`.
- **Result sizing (`numResults`)**: `5` for specific entities/known papers; `10` default; `15` for broad sweeps (never exceed 25).

## 3. Two-Stage Workflow & Output Standards

1. **Discovery**: Run `web_search_exa` (`auto`) for targeted queries, or `deep_search_exa` (`deep` / `deep-reasoning` + `outputSchema`) for multi-hop academic synthesis.
2. **Extraction (`web_fetch_exa`)**: Batch the top 2–4 authoritative URLs in a single `web_fetch_exa({ urls: [...] })` call to retrieve full Markdown text, statistics, and exact quotes.
3. **Synthesis**: Separate empirical findings (sample size $N$, design, effect sizes) from commentary; cite every claim with `[Title / Source](URL)`.
