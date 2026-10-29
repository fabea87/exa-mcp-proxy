import { DurableObject } from "cloudflare:workers";
import { renderDashboardHtml } from "./ui.js";

const DEFAULT_UPSTREAM = "https://mcp.exa.ai/mcp";
const COOLDOWN_MS = 60_000;
const MAX_LOGS = 200;
const APP_VERSION = "1.4.0";

function maskKey(key) {
  const clean = String(key || "").trim();
  if (clean.length <= 8) return "****";
  return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Accept, Content-Type, Authorization, x-api-key, x-exa-source, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID, X-Request-ID",
    "Access-Control-Expose-Headers":
      "Mcp-Session-Id, MCP-Protocol-Version, X-Request-ID, X-Exa-Proxy-Key-Id, X-Exa-Proxy-Key-Label, X-Exa-Proxy-Cost-Usd",
  };
}

function buildMcpResponseHeaders(upstreamHeaders, extra = {}) {
  const headers = new Headers();
  const safeForwardHeaders = [
    "content-type",
    "mcp-session-id",
    "mcp-protocol-version",
    "cache-control",
    "vary",
  ];
  for (const name of safeForwardHeaders) {
    const val = upstreamHeaders?.get?.(name);
    if (val) headers.set(name, val);
  }
  for (const [k, v] of Object.entries(corsHeaders())) {
    headers.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) headers.set(k, String(v));
  }
  return headers;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function extractClientProxyKey(request, url) {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();

  const auth = request.headers.get("Authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const queryKey =
    url.searchParams.get("api_key") ||
    url.searchParams.get("key") ||
    url.searchParams.get("exaApiKey") ||
    url.searchParams.get("exa_api_key");
  if (queryKey) return queryKey.trim();

  return "";
}

async function timingSafeCompare(a, b) {
  const enc = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a || ""))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b || ""))),
  ]);
  return crypto.subtle.timingSafeEqual(digestA, digestB);
}

async function checkAuth(request, url, env) {
  const expected = String(env.PROXY_API_KEY || "").trim();
  if (!expected) {
    return { ok: false, status: 500, error: "Server misconfigured: PROXY_API_KEY secret is not set." };
  }
  const provided = extractClientProxyKey(request, url);
  if (!provided) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Missing Proxy API Key (use x-api-key or Authorization: Bearer <key>).",
    };
  }
  const match = await timingSafeCompare(provided, expected);
  if (!match) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Invalid Proxy API Key.",
    };
  }
  return { ok: true };
}

function parseRpcPayload(bodyText) {
  if (!bodyText) return { method: "unknown", toolName: null, args: {}, queryPreview: null, isToolCall: false };
  try {
    const parsed = JSON.parse(bodyText);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const toolCallItem = items.find((i) => i && i.method === "tools/call");
    const primary = toolCallItem || items[0] || {};
    const method = primary.method || "unknown";
    if (method === "tools/call") {
      const toolName = primary.params?.name || "tools/call";
      const args = primary.params?.arguments || {};
      let queryPreview = "";

      if (toolName === "agent_run") {
        const effortTag = args.effort ? `[effort:${args.effort}] ` : "";
        if (typeof args.query === "string" && args.query) {
          queryPreview = `${effortTag}${args.query}`;
        } else if (typeof args.runId === "string" && args.runId) {
          queryPreview = `[resume] ${args.runId}`;
        } else if (typeof args.systemPrompt === "string" && args.systemPrompt) {
          queryPreview = `${effortTag}System: ${args.systemPrompt}`;
        } else {
          queryPreview = `${effortTag}${JSON.stringify(args)}`;
        }
      } else if (toolName === "web_search_advanced_exa") {
        const typeTag = args.type ? `[${args.type}] ` : "";
        queryPreview = `${typeTag}${args.query || JSON.stringify(args)}`;
      } else if (toolName === "web_search_exa") {
        queryPreview = typeof args.query === "string" ? args.query : JSON.stringify(args);
      } else if (toolName === "web_fetch_exa" || toolName === "crawling_exa") {
        if (Array.isArray(args.urls)) {
          queryPreview = args.urls.join(", ");
        } else if (typeof args.url === "string") {
          queryPreview = args.url;
        } else {
          queryPreview = JSON.stringify(args);
        }
      } else if (typeof args.query === "string") {
        queryPreview = args.query;
      } else if (typeof args.objective === "string") {
        queryPreview = args.type ? `[${args.type}] ${args.objective}` : args.objective;
      } else if (Array.isArray(args.urls)) {
        queryPreview = args.urls.join(", ");
      } else {
        queryPreview = JSON.stringify(args);
      }

      return {
        method,
        toolName,
        args,
        queryPreview: queryPreview.slice(0, 1000),
        isToolCall: true,
      };
    }
    return {
      method,
      toolName: null,
      args: primary.params || {},
      queryPreview: primary.params ? JSON.stringify(primary.params).slice(0, 300) : null,
      isToolCall: false,
    };
  } catch {
    return { method: "raw", toolName: null, args: {}, queryPreview: null, isToolCall: false };
  }
}

function estimateToolCostUsd(rpcInfo) {
  const name = rpcInfo?.toolName || "";
  const args = rpcInfo?.args || {};

  if (name === "web_search_exa") {
    const num = Number(args.numResults) || 10;
    return num > 10 ? Math.round((0.007 + (num - 10) * 0.001) * 10000) / 10000 : 0.007;
  }
  if (name === "web_fetch_exa" || name === "crawling_exa") {
    const count = Array.isArray(args.urls) ? args.urls.length : (args.url ? 1 : 1);
    return Math.max(1, count) * 0.001;
  }
  if (name === "web_search_advanced_exa") {
    const t = String(args.type || "auto").toLowerCase();
    if (t === "deep-reasoning") return 0.015;
    if (t === "deep" || t === "deep-lite") return 0.012;
    if (t === "lite" || t === "instant") return 0.004;
    const num = Number(args.numResults) || 10;
    return num > 10 ? Math.round((0.007 + (num - 10) * 0.001) * 10000) / 10000 : 0.007;
  }
  if (name === "agent_run") {
    const effort = String(args.effort || "low").toLowerCase();
    if (effort === "minimal") return 0.012;
    if (effort === "medium") return 0.05;
    if (effort === "high" || effort === "xhigh") return 0.10;
    return 0.02;
  }
  if (name === "deep_search_exa") {
    return 0.012;
  }
  return 0.007;
}

function extractExaCostUsd(bodyText) {
  if (!bodyText) return 0;
  const text = String(bodyText);

  // 1. Check _meta["ai.exa/usage"].costDollars
  const metaMatch = text.match(/"ai\.exa\/usage"\s*:\s*\{\s*"costDollars"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  if (metaMatch) return Number(metaMatch[1]) || 0;

  // 2. Check costDollars: { total: 0.007 } (including escaped JSON in SSE)
  const totalMatch = text.match(/\\?"costDollars\\?"\s*:\s*\{[^}]*\\?"total\\?"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  if (totalMatch) return Number(totalMatch[1]) || 0;

  // 3. Check costDollars: 0.007 (number or numeric string)
  const directNumMatch = text.match(/\\?"costDollars\\?"\s*:\s*\\?"?([0-9]+(?:\.[0-9]+)?)\\?"?/);
  if (directNumMatch) return Number(directNumMatch[1]) || 0;

  // 4. Try parsing JSON if valid
  try {
    const parsed = JSON.parse(text);
    const target = parsed.result?.output || parsed.result || parsed;
    if (target && target.costDollars) {
      if (typeof target.costDollars === "number") return target.costDollars;
      if (typeof target.costDollars.total === "number") return target.costDollars.total;
      if (typeof target.costDollars === "object") {
        let sum = 0;
        for (const val of Object.values(target.costDollars)) {
          if (typeof val === "number") sum += val;
          else if (typeof val === "object" && val !== null) {
            for (const sub of Object.values(val)) {
              if (typeof sub === "number") sum += sub;
            }
          }
        }
        if (sum > 0) return Math.round(sum * 10000) / 10000;
      }
    }
  } catch {}

  return 0;
}

function inspectExaResponse(httpStatus, bodyText) {
  const text = String(bodyText || "");

  if (httpStatus === 401 || httpStatus === 403) {
    return { keyFailure: "invalid", reason: `HTTP ${httpStatus}: Invalid or unauthorized Exa API key` };
  }
  if (httpStatus === 402) {
    return { keyFailure: "exhausted", reason: `HTTP 402: Exa API key quota/credits exhausted` };
  }
  if (httpStatus === 429) {
    return { keyFailure: "cooldown", reason: `HTTP 429: Exa API key rate limited` };
  }

  const isErrorPayload =
    text.includes('"isError":true') ||
    text.includes('"isError": true') ||
    text.includes('"error":{') ||
    text.includes('"error": {');

  if (isErrorPayload) {
    if (/error \((401|403)\)|invalid (?:api )?key|unauthorized|authenticate with an exa api key|api key is not valid/i.test(text)) {
      const m = text.match(/([^\n"\\]*(?:error \((?:401|403)\)|invalid (?:api )?key|unauthorized|authenticate)[^\n"\\]*)/i);
      return { keyFailure: "invalid", reason: m ? m[1].trim() : "Exa error (401): Invalid API key" };
    }
    if (/error \(402\)|payment required|insufficient credits|out of credits|quota exceeded|exceeded your .* limit|credits depleted|daily request quota/i.test(text)) {
      const m = text.match(/([^\n"\\]*(?:error \(402\)|quota|credits|limit|payment required)[^\n"\\]*)/i);
      return { keyFailure: "exhausted", reason: m ? m[1].trim() : "Exa error (402): Quota or credits exhausted" };
    }
    if (/error \(429\)|rate limit|too many requests|rate or concurrency limit reached|concurrency limit|free tier rate limit/i.test(text)) {
      const m = text.match(/([^\n"\\]*(?:error \(429\)|rate limit|too many requests|concurrency limit)[^\n"\\]*)/i);
      return { keyFailure: "cooldown", reason: m ? m[1].trim() : "Exa error (429): Rate limit reached" };
    }
  }

  return { keyFailure: null, reason: null };
}

/**
 * Stateless Worker MCP handler: performs all network I/O outside the Durable Object
 * while calling <1ms synchronous SQLite RPC methods on ExaProxyCoordinator.
 */
async function proxyMcpRequest(request, url, env, stub) {
  const upstreamBase = env.UPSTREAM_MCP_URL || DEFAULT_UPSTREAM;
  const upstreamUrl = new URL(upstreamBase);
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "api_key" || k === "key" || k === "exaApiKey" || k === "exa_api_key") continue;
    upstreamUrl.searchParams.set(k, v);
  }

  const method = request.method.toUpperCase();
  const bodyText = method === "POST" || method === "PUT" ? await request.text() : "";
  const rpcInfo = parseRpcPayload(bodyText);

  const baseHeaders = new Headers();
  const copyHeaderNames = [
    "content-type",
    "accept",
    "mcp-session-id",
    "mcp-protocol-version",
    "last-event-id",
    "x-exa-source",
    "x-request-id",
  ];
  for (const h of copyHeaderNames) {
    const val = request.headers.get(h);
    if (val) baseHeaders.set(h, val);
  }
  if (!baseHeaders.has("accept")) {
    baseHeaders.set("Accept", "application/json, text/event-stream");
  }
  if (!baseHeaders.has("x-exa-source")) {
    baseHeaders.set("x-exa-source", "exa-mcp-proxy/1.4.0");
  }
  baseHeaders.set("User-Agent", "exa-mcp-client/1.0");

  // Non-tool-call MCP requests (initialize, notifications/initialized, tools/list, resources/list, resources/read, prompts/list, GET /mcp SSE)
  if (!rpcInfo.isToolCall) {
    const peeked = await stub.rpcPeekKey();
    if (peeked?.api_key) {
      baseHeaders.set("x-api-key", peeked.api_key);
      upstreamUrl.searchParams.set("exaApiKey", peeked.api_key);
    }
    const resp = await fetch(upstreamUrl.toString(), {
      method,
      headers: baseHeaders,
      body: method === "POST" || method === "PUT" ? bodyText : undefined,
    });

    const isSse = resp.headers.get("content-type")?.includes("text/event-stream") || method === "GET";
    if (isSse) {
      return new Response(resp.body, {
        status: resp.status,
        headers: buildMcpResponseHeaders(resp.headers),
      });
    }

    const respText = await resp.text();
    return new Response(respText, {
      status: resp.status,
      headers: buildMcpResponseHeaders(resp.headers),
    });
  }

  // Tool call (`tools/call`) — load balance across healthy keys with automatic failover
  const excludeIds = [];
  const maxAttempts = 3;
  let lastRespText = "";
  let lastRespStatus = 502;
  let lastUpstreamHeaders = new Headers();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const selectedKey = await stub.rpcClaimKey(excludeIds, attempt === 1, rpcInfo);
    if (!selectedKey) {
      if (attempt === 1) {
        return jsonResponse(
          {
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32000,
              message:
                "Exa MCP Proxy Error: No active Exa API keys available in pool (or all keys reached quota). Add or enable keys in the WebUI.",
            },
          },
          503
        );
      }
      break;
    }

    const attemptUrl = new URL(upstreamUrl.toString());
    attemptUrl.searchParams.set("exaApiKey", selectedKey.api_key);

    const attemptHeaders = new Headers(baseHeaders);
    attemptHeaders.set("x-api-key", selectedKey.api_key);
    if (attempt > 1) {
      attemptHeaders.delete("mcp-session-id");
    }

    const startMs = Date.now();
    try {
      const upstreamResp = await fetch(attemptUrl.toString(), {
        method,
        headers: attemptHeaders,
        body: bodyText,
      });
      const latencyMs = Date.now() - startMs;
      const respText = await upstreamResp.text();
      lastRespText = respText;
      lastRespStatus = upstreamResp.status;
      lastUpstreamHeaders = upstreamResp.headers;

      const check = inspectExaResponse(upstreamResp.status, respText);
      if (check.keyFailure) {
        await stub.rpcRecordOutcome({
          ok: false,
          keyId: selectedKey.id,
          keyLabel: selectedKey.label,
          maskedKey: selectedKey.masked_key,
          failureType: check.keyFailure,
          reason: check.reason,
          isFailover: true,
          method: rpcInfo.method,
          toolName: rpcInfo.toolName,
          queryPreview: rpcInfo.queryPreview,
          httpStatus: upstreamResp.status,
          latencyMs,
        });
        excludeIds.push(Number(selectedKey.id));
        continue;
      }

      const costUsd = extractExaCostUsd(respText) || estimateToolCostUsd(rpcInfo);
      await stub.rpcRecordOutcome({
        ok: true,
        keyId: selectedKey.id,
        keyLabel: selectedKey.label,
        maskedKey: selectedKey.masked_key,
        costUsd,
        method: rpcInfo.method,
        toolName: rpcInfo.toolName,
        queryPreview: rpcInfo.queryPreview,
        httpStatus: upstreamResp.status,
        latencyMs,
        attempt,
      });

      return new Response(respText, {
        status: upstreamResp.status,
        headers: buildMcpResponseHeaders(upstreamResp.headers, {
          "X-Exa-Proxy-Key-Id": selectedKey.id,
          "X-Exa-Proxy-Key-Label": selectedKey.label,
          "X-Exa-Proxy-Cost-Usd": costUsd,
        }),
      });
    } catch (err) {
      const latencyMs = Date.now() - startMs;
      await stub.rpcRecordOutcome({
        ok: false,
        keyId: selectedKey.id,
        keyLabel: selectedKey.label,
        maskedKey: selectedKey.masked_key,
        failureType: "network",
        reason: err.message,
        isFailover: false,
        method: rpcInfo.method,
        toolName: rpcInfo.toolName,
        queryPreview: rpcInfo.queryPreview,
        httpStatus: 502,
        latencyMs,
      });
      excludeIds.push(Number(selectedKey.id));
    }
  }

  return new Response(
    lastRespText ||
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32000, message: "All Exa API key attempts failed." },
      }),
    {
      status: lastRespStatus,
      headers: buildMcpResponseHeaders(lastUpstreamHeaders),
    }
  );
}

export class ExaProxyCoordinator extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.initDb();
  }

  initDb() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        masked_key TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        total_calls INTEGER NOT NULL DEFAULT 0,
        success_calls INTEGER NOT NULL DEFAULT 0,
        error_calls INTEGER NOT NULL DEFAULT 0,
        total_cost_usd REAL NOT NULL DEFAULT 0,
        quota_usd REAL NOT NULL DEFAULT 10.0,
        last_used_at TEXT,
        last_error TEXT,
        cooldown_until INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        method TEXT NOT NULL,
        tool_name TEXT,
        query_preview TEXT,
        key_id INTEGER,
        key_label TEXT,
        masked_key TEXT,
        status TEXT NOT NULL,
        http_status INTEGER,
        latency_ms INTEGER,
        cost_usd REAL NOT NULL DEFAULT 0,
        error_message TEXT
      );
    `);

    try {
      this.sql.exec("ALTER TABLE api_keys ADD COLUMN total_cost_usd REAL NOT NULL DEFAULT 0");
    } catch {}
    try {
      this.sql.exec("ALTER TABLE api_keys ADD COLUMN quota_usd REAL NOT NULL DEFAULT 10.0");
    } catch {}
    try {
      this.sql.exec("ALTER TABLE call_logs ADD COLUMN cost_usd REAL NOT NULL DEFAULT 0");
    } catch {}

    this.sql.exec(
      "UPDATE api_keys SET total_cost_usd = ROUND(success_calls * 0.007, 4) WHERE total_cost_usd = 0 AND success_calls > 0"
    );

    this.ensureSetting("strategy", "least_used");
    this.ensureSetting("rr_index", "0");
    this.ensureSetting("total_requests", "0");
    this.ensureSetting("total_tool_calls", "0");
    this.ensureSetting("total_failovers", "0");
  }

  ensureSetting(key, defaultValue) {
    this.sql.exec("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", key, String(defaultValue));
  }

  getSetting(key, fallback = "") {
    const rows = this.sql.exec("SELECT value FROM settings WHERE key = ?", key).toArray();
    return rows.length ? rows[0].value : fallback;
  }

  setSetting(key, value) {
    this.sql.exec("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, String(value));
  }

  incrementCounter(key, delta = 1) {
    const cur = Number(this.getSetting(key, "0")) || 0;
    const next = cur + delta;
    this.setSetting(key, String(next));
    return next;
  }

  /**
   * Synchronous RPC: Peek an active key for non-tool-call MCP handshakes.
   */
  rpcPeekKey() {
    this.incrementCounter("total_requests", 1);
    return this.peekHealthyKey();
  }

  /**
   * Synchronous RPC: Claim the next healthy key for a tool call (<1ms SQLite).
   */
  rpcClaimKey(excludeIds = [], isFirstAttempt = true, rpcInfo = {}) {
    if (isFirstAttempt) {
      this.incrementCounter("total_requests", 1);
      this.incrementCounter("total_tool_calls", 1);
    }
    const chosen = this.selectHealthyKey(excludeIds);
    if (!chosen && isFirstAttempt) {
      this.appendCallLog({
        method: rpcInfo.method || "tools/call",
        toolName: rpcInfo.toolName || null,
        queryPreview: rpcInfo.queryPreview || null,
        status: "error",
        httpStatus: 503,
        latencyMs: 0,
        costUsd: 0,
        errorMessage: "No active Exa API keys available in proxy pool",
      });
    }
    return chosen;
  }

  /**
   * Synchronous RPC: Record outcome of a tool call (<1ms SQLite).
   */
  rpcRecordOutcome(outcome) {
    if (outcome.ok) {
      this.recordKeySuccess(outcome.keyId, outcome.costUsd);
      this.appendCallLog({
        method: outcome.method,
        toolName: outcome.toolName,
        queryPreview: outcome.queryPreview,
        keyId: outcome.keyId,
        keyLabel: outcome.keyLabel,
        maskedKey: outcome.maskedKey,
        status: "ok",
        httpStatus: outcome.httpStatus,
        latencyMs: outcome.latencyMs,
        costUsd: outcome.costUsd,
        errorMessage: outcome.attempt > 1 ? `Recovered on attempt #${outcome.attempt}` : null,
      });
    } else {
      this.recordKeyFailure(outcome.keyId, outcome.failureType, outcome.reason, true);
      if (outcome.isFailover) {
        this.incrementCounter("total_failovers", 1);
      }
      this.appendCallLog({
        method: outcome.method,
        toolName: outcome.toolName,
        queryPreview: outcome.queryPreview,
        keyId: outcome.keyId,
        keyLabel: outcome.keyLabel,
        maskedKey: outcome.maskedKey,
        status: outcome.isFailover ? "retried" : "error",
        httpStatus: outcome.httpStatus,
        latencyMs: outcome.latencyMs,
        costUsd: 0,
        errorMessage: outcome.isFailover
          ? `Failover (${outcome.failureType}): ${outcome.reason}`
          : outcome.reason,
      });
    }
  }

  importRawKeys(rawText, defaultQuotaUsd = 10.0) {
    const lines = String(rawText || "")
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const items = [];
    for (const line of lines) {
      if (line.includes("|")) {
        const [label, apiKey, quotaStr] = line.split("|").map((s) => s.trim());
        if (apiKey) items.push({ label, apiKey, quotaUsd: Number(quotaStr) || defaultQuotaUsd });
      } else if (line.includes(":")) {
        const idx = line.indexOf(":");
        const label = line.slice(0, idx).trim();
        const apiKey = line.slice(idx + 1).trim();
        if (apiKey) items.push({ label, apiKey, quotaUsd: defaultQuotaUsd });
      } else {
        items.push({ label: "", apiKey: line, quotaUsd: defaultQuotaUsd });
      }
    }
    return this.addKeys(items);
  }

  addKeys(items) {
    let added = 0;
    const now = new Date().toISOString();
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const apiKey = String(item.apiKey || "").trim();
      if (!apiKey) continue;
      const quotaUsd = Number(item.quotaUsd) > 0 ? Number(item.quotaUsd) : 10.0;
      const existing = this.sql.exec("SELECT id FROM api_keys WHERE api_key = ?", apiKey).toArray();
      if (existing.length > 0) {
        this.sql.exec(
          "UPDATE api_keys SET enabled = 1, status = 'active', cooldown_until = 0, last_error = NULL, quota_usd = ? WHERE id = ?",
          quotaUsd,
          existing[0].id
        );
        added++;
        continue;
      }
      const countRow = this.sql.exec("SELECT COUNT(*) AS cnt FROM api_keys").one();
      const seq = (Number(countRow?.cnt) || 0) + 1;
      const label = String(item.label || "").trim() || `Key-${seq}`;
      this.sql.exec(
        `INSERT INTO api_keys (label, api_key, masked_key, enabled, status, quota_usd, created_at)
         VALUES (?, ?, ?, 1, 'active', ?, ?)`,
        label,
        apiKey,
        maskKey(apiKey),
        quotaUsd,
        now
      );
      added++;
    }
    return added;
  }

  refreshKeyStates() {
    const now = Date.now();
    // 1. Recover expired cooldowns
    this.sql.exec(
      "UPDATE api_keys SET status = 'active', cooldown_until = 0 WHERE status = 'cooldown' AND cooldown_until <= ?",
      now
    );
    // 2. Proactive quota cutoff: mark keys whose tracked spend reached their configured quota_usd
    this.sql.exec(
      `UPDATE api_keys
       SET status = 'exhausted',
           enabled = 0,
           last_error = 'Configured quota reached (' || ROUND(total_cost_usd, 3) || ' / $' || ROUND(quota_usd, 2) || ')'
       WHERE enabled = 1 AND quota_usd > 0 AND total_cost_usd >= quota_usd`
    );
  }

  peekHealthyKey() {
    this.refreshKeyStates();
    const rows = this.sql
      .exec("SELECT * FROM api_keys WHERE enabled = 1 AND status = 'active' ORDER BY id ASC LIMIT 1")
      .toArray();
    return rows.length ? rows[0] : null;
  }

  selectHealthyKey(excludeIds = []) {
    this.refreshKeyStates();

    const strategy = this.getSetting("strategy", "least_used");
    const allEligible = this.sql
      .exec(
        `SELECT * FROM api_keys
         WHERE enabled = 1 AND status = 'active'
         ORDER BY id ASC`
      )
      .toArray()
      .filter((k) => !excludeIds.includes(Number(k.id)));

    if (!allEligible.length) return null;

    let chosen;
    if (strategy === "round_robin") {
      const rrIndex = Number(this.getSetting("rr_index", "0")) || 0;
      chosen = allEligible[rrIndex % allEligible.length];
      this.setSetting("rr_index", String((rrIndex + 1) % Math.max(1, allEligible.length)));
    } else {
      allEligible.sort((a, b) => {
        const ca = Number(a.total_calls) || 0;
        const cb = Number(b.total_calls) || 0;
        if (ca !== cb) return ca - cb;
        const ta = a.last_used_at || "";
        const tb = b.last_used_at || "";
        if (ta !== tb) return ta.localeCompare(tb);
        return Number(a.id) - Number(b.id);
      });
      chosen = allEligible[0];
    }

    const nowIso = new Date().toISOString();
    this.sql.exec(
      "UPDATE api_keys SET total_calls = total_calls + 1, last_used_at = ? WHERE id = ?",
      nowIso,
      chosen.id
    );
    return { ...chosen, total_calls: (Number(chosen.total_calls) || 0) + 1 };
  }

  recordKeySuccess(keyId, costUsd = 0) {
    const now = new Date().toISOString();
    this.sql.exec(
      `UPDATE api_keys
       SET success_calls = success_calls + 1,
           total_cost_usd = ROUND(total_cost_usd + ?, 6),
           status = 'active',
           cooldown_until = 0,
           last_used_at = ?
       WHERE id = ?`,
      Number(costUsd) || 0,
      now,
      keyId
    );
    this.refreshKeyStates();
  }

  recordKeyFailure(keyId, failureType, reason, preClaimed = true) {
    const now = new Date().toISOString();
    const callDelta = preClaimed ? 0 : 1;
    if (failureType === "invalid" || failureType === "exhausted") {
      this.sql.exec(
        `UPDATE api_keys
         SET total_calls = total_calls + ?,
             error_calls = error_calls + 1,
             enabled = 0,
             status = ?,
             last_used_at = ?,
             last_error = ?
         WHERE id = ?`,
        callDelta,
        failureType,
        now,
        String(reason || failureType).slice(0, 300),
        keyId
      );
    } else if (failureType === "cooldown") {
      const until = Date.now() + COOLDOWN_MS;
      this.sql.exec(
        `UPDATE api_keys
         SET total_calls = total_calls + ?,
             error_calls = error_calls + 1,
             status = 'cooldown',
             cooldown_until = ?,
             last_used_at = ?,
             last_error = ?
         WHERE id = ?`,
        callDelta,
        until,
        now,
        String(reason || "Rate limited (429)").slice(0, 300),
        keyId
      );
    } else {
      this.sql.exec(
        `UPDATE api_keys
         SET total_calls = total_calls + ?,
             error_calls = error_calls + 1,
             last_used_at = ?,
             last_error = ?
         WHERE id = ?`,
        callDelta,
        now,
        String(reason || "Upstream error").slice(0, 300),
        keyId
      );
    }
  }

  appendCallLog(entry) {
    const now = new Date().toISOString();
    this.sql.exec(
      `INSERT INTO call_logs
       (timestamp, method, tool_name, query_preview, key_id, key_label, masked_key, status, http_status, latency_ms, cost_usd, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      now,
      entry.method || "unknown",
      entry.toolName || null,
      entry.queryPreview || null,
      entry.keyId ?? null,
      entry.keyLabel ?? null,
      entry.maskedKey ?? null,
      entry.status || "ok",
      entry.httpStatus ?? 200,
      entry.latencyMs ?? 0,
      Number(entry.costUsd) || 0,
      entry.errorMessage ? String(entry.errorMessage).slice(0, 500) : null
    );

    this.sql.exec(
      `DELETE FROM call_logs
       WHERE id NOT IN (SELECT id FROM call_logs ORDER BY id DESC LIMIT ?)`,
      MAX_LOGS
    );
  }

  async verifySingleKey(keyRow) {
    const upstreamUrl = this.env.UPSTREAM_MCP_URL || DEFAULT_UPSTREAM;
    const start = Date.now();
    try {
      const resp = await fetch(`${upstreamUrl}?tools=web_search_exa&exaApiKey=${encodeURIComponent(keyRow.api_key)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "User-Agent": "exa-mcp-client/1.0",
          "x-api-key": keyRow.api_key,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "web_search_exa",
            arguments: {
              query: "Exa AI search",
              numResults: 1,
            },
          },
        }),
      });
      const latencyMs = Date.now() - start;
      const bodyText = await resp.text();
      const check = inspectExaResponse(resp.status, bodyText);
      if (check.keyFailure) {
        this.recordKeyFailure(keyRow.id, check.keyFailure, check.reason, false);
        return { id: keyRow.id, label: keyRow.label, ok: false, latencyMs, error: check.reason };
      }
      const costUsd = extractExaCostUsd(bodyText);
      this.sql.exec(
        `UPDATE api_keys
         SET status = 'active',
             enabled = 1,
             cooldown_until = 0,
             last_error = NULL,
             total_cost_usd = ROUND(total_cost_usd + ?, 6),
             last_used_at = ?
         WHERE id = ?`,
        costUsd,
        new Date().toISOString(),
        keyRow.id
      );
      this.refreshKeyStates();
      return { id: keyRow.id, label: keyRow.label, ok: true, latencyMs, costUsd };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { id: keyRow.id, label: keyRow.label, ok: false, latencyMs, error: err.message };
    }
  }

  async handleApi(request, url) {
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (path === "/api/overview" && method === "GET") {
      this.refreshKeyStates();

      const keys = this.sql
        .exec(
          `SELECT id, label, masked_key, enabled, status, total_calls, success_calls, error_calls,
                  total_cost_usd, quota_usd, last_used_at, last_error, cooldown_until, created_at
           FROM api_keys ORDER BY id ASC`
        )
        .toArray();

      const logs = this.sql
        .exec("SELECT * FROM call_logs ORDER BY id DESC LIMIT 80")
        .toArray();

      const totalKeys = keys.length;
      const activeKeys = keys.filter((k) => k.enabled === 1 && k.status === "active").length;
      const totalRequests = Number(this.getSetting("total_requests", "0")) || 0;
      const totalToolCalls = Number(this.getSetting("total_tool_calls", "0")) || 0;
      const totalFailovers = Number(this.getSetting("total_failovers", "0")) || 0;
      const strategy = this.getSetting("strategy", "least_used");

      const okLogs = logs.filter((l) => l.status === "ok");
      const avgLatencyMs = okLogs.length
        ? Math.round(okLogs.reduce((acc, l) => acc + (Number(l.latency_ms) || 0), 0) / okLogs.length)
        : null;

      const totalSucc = keys.reduce((a, k) => a + (Number(k.success_calls) || 0), 0);
      const totalErr = keys.reduce((a, k) => a + (Number(k.error_calls) || 0), 0);
      const totalCostUsd =
        Math.round(keys.reduce((a, k) => a + (Number(k.total_cost_usd) || 0), 0) * 10000) / 10000;
      const totalQuotaUsd =
        Math.round(keys.reduce((a, k) => a + (Number(k.quota_usd) || 10), 0) * 100) / 100;
      const successRate =
        totalSucc + totalErr > 0 ? Math.round((totalSucc / (totalSucc + totalErr)) * 1000) / 10 : 100;

      return jsonResponse({
        version: APP_VERSION,
        stats: {
          strategy,
          totalKeys,
          activeKeys,
          totalRequests,
          totalToolCalls,
          totalFailovers,
          totalCostUsd,
          totalQuotaUsd,
          successRate,
          avgLatencyMs,
        },
        keys,
        logs,
      });
    }

    if (path === "/api/keys/export" && method === "GET") {
      const rows = this.sql
        .exec("SELECT label, api_key, quota_usd FROM api_keys ORDER BY id ASC")
        .toArray();
      const text = rows.map((r) => `${r.label} | ${r.api_key} | ${r.quota_usd ?? 10}`).join("\n");
      return jsonResponse({ ok: true, count: rows.length, text });
    }

    if (path === "/api/keys" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      let added = 0;
      if (body.rawText) {
        added = this.importRawKeys(body.rawText, Number(body.quotaUsd) || 10.0);
      } else if (Array.isArray(body.keys)) {
        added = this.addKeys(body.keys);
      }
      return jsonResponse({ ok: true, added });
    }

    if (path === "/api/keys/reset-stats" && method === "POST") {
      this.sql.exec("UPDATE api_keys SET total_calls = 0, success_calls = 0, error_calls = 0, total_cost_usd = 0");
      this.setSetting("total_tool_calls", "0");
      this.setSetting("total_failovers", "0");
      this.setSetting("rr_index", "0");
      return jsonResponse({ ok: true });
    }

    if (path === "/api/keys/test-all" && method === "POST") {
      const rows = this.sql.exec("SELECT * FROM api_keys WHERE enabled = 1 ORDER BY id ASC").toArray();
      const results = await Promise.all(rows.map((r) => this.verifySingleKey(r)));
      return jsonResponse({
        ok: true,
        tested: results.length,
        healthy: results.filter((r) => r.ok).length,
        results,
      });
    }

    const keyMatch = path.match(/^\/api\/keys\/(\d+)(?:\/(test))?$/);
    if (keyMatch) {
      const id = Number(keyMatch[1]);
      const action = keyMatch[2];

      if (action === "test" && method === "POST") {
        const rows = this.sql.exec("SELECT * FROM api_keys WHERE id = ?", id).toArray();
        if (!rows.length) return jsonResponse({ error: "Key not found" }, 404);
        const res = await this.verifySingleKey(rows[0]);
        return jsonResponse(res);
      }

      if (method === "PATCH") {
        const body = await request.json().catch(() => ({}));
        if (typeof body.enabled === "boolean") {
          this.sql.exec("UPDATE api_keys SET enabled = ? WHERE id = ?", body.enabled ? 1 : 0, id);
        }
        if (typeof body.label === "string" && body.label.trim()) {
          this.sql.exec("UPDATE api_keys SET label = ? WHERE id = ?", body.label.trim(), id);
        }
        if (typeof body.quotaUsd === "number" && body.quotaUsd > 0) {
          this.sql.exec("UPDATE api_keys SET quota_usd = ? WHERE id = ?", body.quotaUsd, id);
          this.refreshKeyStates();
        }
        if (typeof body.status === "string") {
          this.sql.exec("UPDATE api_keys SET status = ?, cooldown_until = 0 WHERE id = ?", body.status, id);
        }
        if (body.resetError) {
          this.sql.exec("UPDATE api_keys SET last_error = NULL, cooldown_until = 0 WHERE id = ?", id);
        }
        return jsonResponse({ ok: true });
      }

      if (method === "DELETE") {
        this.sql.exec("DELETE FROM api_keys WHERE id = ?", id);
        return jsonResponse({ ok: true });
      }
    }

    if (path === "/api/settings" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (body.strategy === "least_used" || body.strategy === "round_robin") {
        this.setSetting("strategy", body.strategy);
      }
      return jsonResponse({ ok: true, strategy: this.getSetting("strategy", "least_used") });
    }

    if (path === "/api/logs" && method === "DELETE") {
      this.sql.exec("DELETE FROM call_logs");
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Not found" }, 404);
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return this.handleApi(request, url);
    }
    return jsonResponse({ error: "Not found" }, 404);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // Serve WebUI Dashboard on GET / or GET /ui
    if ((url.pathname === "/" || url.pathname === "/ui") && request.method === "GET") {
      return new Response(renderDashboardHtml(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "exa-mcp-proxy", version: APP_VERSION });
    }

    // All /mcp and /api/* routes require constant-time PROXY_API_KEY verification
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/") || url.pathname.startsWith("/api/")) {
      const auth = await checkAuth(request, url, env);
      if (!auth.ok) {
        return jsonResponse({ error: auth.error }, auth.status);
      }
      const id = env.COORDINATOR.idFromName("global");
      const stub = env.COORDINATOR.get(id);

      // Perform network-bound MCP proxying in the stateless Worker using <1ms DO RPCs
      if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
        return proxyMcpRequest(request, url, env, stub);
      }
      return stub.fetch(request);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
