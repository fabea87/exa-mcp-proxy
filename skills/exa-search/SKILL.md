---
name: exa-search
description: Default web search for all queries — real-time web research, current events, deep topic dives, background information, and full-page content extraction via the official Exa MCP server (https://mcp.exa.ai/mcp). Always use this as the primary web search skill unless the user explicitly requests querying academic literature databases (Crossref/OpenAlex) or their local Zotero library.
---

# Exa Neural Search & Research Skill

- **Direct tools (also callable in `codemode`)**:
  - `mcp__exa__web_search_exa({ query, numResults, objective })` — fast single-hop `auto` neural search (1–2s, ~$0.007)
  - `mcp__exa__web_fetch_exa({ urls, maxCharacters })` — primary web-to-Markdown fetcher (batch multiple URLs in `urls`)
  - `mcp__exa__agent_run({ query, effort, systemPrompt, outputSchema, runId })` — **autonomous multi-step deep research agent** for literature synthesis, competitive analysis, and grounded evidence extraction (10–40s, ~$0.02)
- **Codemode tools**:
  - `tools.mcp__exa__web_search_advanced_exa({ query, type: "auto" | "lite" | "deep" | "deep-reasoning", category, includeDomains, excludeDomains, startPublishedDate, endPublishedDate, ... })` — fine-grained Exa Search API parameter control
  - `tools.mcp__exa__deep_search_exa(...)` — legacy deep search alias (prefer `agent_run` or `web_search_advanced_exa`)

## 1. Tool Selection (`auto` vs. `agent_run` vs. `deep`)

- **Routine lookups & single facts (`web_search_exa`, ~$0.007, 1–2s)**: Use for everyday lookups, breaking news, fact verification, and targeted single-angle research.
- **Academic synthesis, literature review & deep research (`agent_run`, ~$0.012–$0.05, 10–40s)**:
  - **When to summon**: Use whenever a task requires multi-angle evidence gathering, synthesizing literature, evaluating theoretical frameworks, or building comprehensive lists with citations.
  - **Effort parameter**: Default is `low` ($0.02, 10–20s, great balance of speed and depth). Use `medium` ($0.05, 30–50s) for exhaustive academic sweeps.
  - **Input guidance**: Pass a clear natural-language `query`. Optionally pass `systemPrompt` (e.g. `"Focus on empirical studies in applied linguistics with sample size, theoretical framework, and pedagogical implications"`) and `outputSchema` if you need schema-validated JSON.
  - **Async handling**: Exa MCP holds the connection open until output is ready. If a run returns `status: "running"`, simply re-call with `{ runId: result.id }` to retrieve final output.
- **Fine-grained filtering (`web_search_advanced_exa` in codemode)**: Use when you need strict domain restrictions (`includeDomains: ["sciencedirect.com", "tandfonline.com"]`), exact publication date ranges, or instant/lite type searches.

## 2. Neural Search Principles (for `web_search_exa` / `web_search_advanced_exa`)

- **Describe the target page, not the question**: e.g. `"category:publication empirical study findings on generative AI in EFL writing classrooms 2025 2026"`.
- **Category prefixes** (prepend inline to `query`): `category:publication`, `category:news`, `category:people`, `category:company`, `category:personal site`.
- **Result sizing (`numResults`)**: `5` for specific entities/known papers; `10` default; `15` for broad sweeps (never exceed 25).

## 3. Two-Stage Workflow & Output Standards

1. **Discovery & Deep Research**:
   - For fast factual lookups: Run `web_search_exa` (`auto`).
   - For literature synthesis & multi-angle research: Run `agent_run` (`effort: "low"` or `"medium"`).
2. **Deep Extraction (`web_fetch_exa`)**: Batch the top 2–4 primary study URLs returned by `agent_run` or `web_search_exa` in a single `web_fetch_exa({ urls: [...] })` call to retrieve full Markdown text, statistics, and exact quotes.
3. **Synthesis**: Separate empirical findings (sample size $N$, design, effect sizes) from commentary; cite every claim with `[Title / Source](URL)`.
