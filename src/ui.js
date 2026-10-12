export function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exa MCP Proxy — Key Pool & Monitor</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --panel-alt: #0f172a;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --green: #22c55e;
      --amber: #f59e0b;
      --red: #ef4444;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      font-size: 14px;
      line-height: 1.5;
    }
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px 60px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-active { background: rgba(34,197,94,0.16); color: #4ade80; border: 1px solid rgba(34,197,94,0.35); }
    .badge-cooldown { background: rgba(245,158,11,0.16); color: #fbbf24; border: 1px solid rgba(245,158,11,0.35); }
    .badge-exhausted, .badge-invalid { background: rgba(239,68,68,0.16); color: #f87171; border: 1px solid rgba(239,68,68,0.35); }
    .badge-disabled { background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
    .badge-tool { background: rgba(59,130,246,0.16); color: #60a5fa; border: 1px solid rgba(59,130,246,0.35); font-family: var(--mono); text-transform: none; }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    button, select, input, textarea {
      font-family: inherit;
      font-size: 13px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      padding: 7px 12px;
      outline: none;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--accent);
    }
    button {
      cursor: pointer;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
    }
    button:hover { background: #334155; }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-sm { padding: 4px 8px; font-size: 12px; }
    .btn-danger { color: #f87171; border-color: rgba(239,68,68,0.4); }
    .btn-danger:hover { background: rgba(239,68,68,0.15); }
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
    }
    .kpi-label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 700;
      font-family: var(--mono);
    }
    .kpi-sub {
      color: var(--muted);
      font-size: 11px;
      margin-top: 4px;
    }
    .section {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .section-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
    }
    .section-body { padding: 16px; }
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(51,65,85,0.65);
      vertical-align: middle;
    }
    th {
      color: var(--muted);
      font-weight: 600;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(15,23,42,0.5);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .mono { font-family: var(--mono); font-size: 12.5px; }
    .muted { color: var(--muted); }
    .bar-wrap {
      width: 90px;
      background: #0f172a;
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
      border: 1px solid var(--border);
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #22c55e);
    }
    .add-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 820px) {
      .add-grid { grid-template-columns: 1fr; }
    }
    pre {
      margin: 0;
      padding: 12px;
      background: #0b1120;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: var(--mono);
      font-size: 12px;
      overflow-x: auto;
      color: #e2e8f0;
    }
    .auth-banner {
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.35);
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .query-cell {
      max-width: 360px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .err-text {
      color: #f87171;
      font-size: 11.5px;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      border: 1px solid var(--accent);
      color: var(--text);
      padding: 10px 16px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      display: none;
      z-index: 999;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>⚡ Exa MCP Load-Balancing Proxy</h1>
        <span id="connBadge" class="badge badge-disabled">Connecting...</span>
      </div>
      <div class="controls">
        <label class="muted" for="strategySelect">Strategy:</label>
        <select id="strategySelect" onchange="updateStrategy(this.value)">
          <option value="least_used">Least Used (Balanced Quota)</option>
          <option value="round_robin">Round Robin (Sequential)</option>
        </select>
        <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer" class="muted">
          <input type="checkbox" id="autoRefreshToggle" checked onchange="toggleAutoRefresh(this.checked)" />
          Auto-refresh (5s)
        </label>
        <button onclick="loadOverview()">↻ Refresh</button>
      </div>
    </header>

    <div class="auth-banner">
      <div>
        <strong>🔑 Proxy API Key Auth:</strong>
        <span class="muted">Required for both <code>/mcp</code> clients and this WebUI.</span>
      </div>
      <div class="controls">
        <input type="password" id="proxyKeyInput" placeholder="Enter PROXY_API_KEY..." style="width:240px" />
        <button class="btn-primary" onclick="saveProxyKey()">Connect / Save</button>
      </div>
    </div>

    <div class="grid-kpi">
      <div class="card">
        <div class="kpi-label">Active / Total Exa Keys</div>
        <div class="kpi-value" id="kpiKeys">- / -</div>
        <div class="kpi-sub" id="kpiKeysSub">Healthy keys in rotation</div>
      </div>
      <div class="card">
        <div class="kpi-label">Total Tool Searches</div>
        <div class="kpi-value" id="kpiToolCalls">-</div>
        <div class="kpi-sub" id="kpiTotalReq">Total MCP RPCs: -</div>
      </div>
      <div class="card">
        <div class="kpi-label">Tracked Cost / Pool Quota</div>
        <div class="kpi-value" id="kpiCost">$- / $-</div>
        <div class="kpi-sub" id="kpiRemaining">Est. Remaining: $-</div>
      </div>
      <div class="card">
        <div class="kpi-label">Success Rate</div>
        <div class="kpi-value" id="kpiSuccessRate">-</div>
        <div class="kpi-sub" id="kpiFailovers">Auto-failovers: 0</div>
      </div>
      <div class="card">
        <div class="kpi-label">Avg Search Latency</div>
        <div class="kpi-value" id="kpiLatency">-</div>
        <div class="kpi-sub">Upstream mcp.exa.ai</div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">➕ Add Exa API Keys to Pool</h2>
        <div class="controls">
          <button onclick="resetAllStats()">🔄 Reset Counters</button>
          <button onclick="testAllKeys()" id="btnTestAll">🩺 Verify All Active Keys</button>
        </div>
      </div>
      <div class="section-body">
        <div class="add-grid">
          <div>
            <div style="margin-bottom:8px;font-weight:600">Single Key</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <input type="text" id="singleLabel" placeholder="Label (e.g. Account-1)" style="flex:1;min-width:110px" />
              <input type="text" id="singleKey" placeholder="Exa API Key (UUID)" style="flex:2;min-width:190px" class="mono" />
              <input type="number" id="singleQuota" value="10" step="1" min="1" title="Initial/Monthly Quota ($ USD)" style="width:80px" />
              <button class="btn-primary" onclick="addSingleKey()">Add Key</button>
            </div>
            <div class="muted" style="font-size:12px;margin-top:8px">
              Exa bills ~$0.007 per search (returned in MCP <code>_meta.costDollars</code>). Set each key's budget ($10 monthly free tier or $20 initial signup) to track remaining balance.
            </div>
          </div>
          <div>
            <div style="margin-bottom:8px;font-weight:600">Batch Import (<code>label | key | quotaUsd</code> or raw <code>key</code> per line)</div>
            <div style="display:flex;gap:8px">
              <textarea id="batchKeysInput" rows="2" placeholder="acct-1 | a1b2c3d4-... | 10\nacct-2 | e5f6g7h8-... | 20" style="flex:1" class="mono"></textarea>
              <button class="btn-primary" onclick="addBatchKeys()">Import Batch</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">🗂️ Exa API Key Pool & Load Balance Distribution</h2>
        <span class="muted" id="poolSummaryText">0 keys configured</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Masked Key</th>
              <th>Status</th>
              <th>Load Share</th>
              <th>Calls (OK / Err)</th>
              <th>Spend / Quota (Est. Left)</th>
              <th>Last Used</th>
              <th>Last Error</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="keysTableBody">
            <tr><td colspan="10" class="muted" style="text-align:center;padding:24px">Enter PROXY_API_KEY above to view key pool.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">📜 Recent MCP Call Logs</h2>
        <div class="controls">
          <button class="btn-sm btn-danger" onclick="clearLogs()">Clear Logs</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Tool / Method</th>
              <th>Query / Target Preview</th>
              <th>Key Used</th>
              <th>Status</th>
              <th>Cost</th>
              <th>Latency</th>
              <th>Note / Error</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            <tr><td colspan="8" class="muted" style="text-align:center;padding:24px">No call logs yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">⚙️ Pi <code>~/.pi/agent/mcp.json</code> Configuration</h2>
        <button class="btn-sm btn-primary" onclick="copyMcpConfig()">Copy Config</button>
      </div>
      <div class="section-body">
        <pre id="mcpConfigPre"></pre>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let refreshTimer = null;

    function showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.style.display = 'block';
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    function getProxyKey() {
      return localStorage.getItem('exa_proxy_api_key') || '';
    }

    function saveProxyKey() {
      const val = document.getElementById('proxyKeyInput').value.trim();
      localStorage.setItem('exa_proxy_api_key', val);
      showToast('Proxy API Key saved');
      loadOverview();
    }

    function renderMcpSnippet() {
      const origin = window.location.origin;
      const snippet = {
        mcpServers: {
          exa: {
            url: origin + "/mcp?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,deep_search_exa",
            headers: {
              "x-api-key": getProxyKey() || "\${EXA_PROXY_API_KEY}"
            },
            exposure: "codemode",
            toolExposure: {
              web_search_exa: "direct"
            },
            description: "Real-time web search, advanced search, and content extraction via Exa LB Proxy"
          }
        }
      };
      document.getElementById('mcpConfigPre').textContent = JSON.stringify(snippet, null, 2);
    }

    async function apiFetch(path, options = {}) {
      const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      const key = getProxyKey();
      if (key) headers['x-api-key'] = key;
      const res = await fetch(path, Object.assign({}, options, { headers }));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || ('HTTP ' + res.status));
      }
      return data;
    }

    function statusBadge(key) {
      if (!key.enabled) return '<span class="badge badge-disabled">DISABLED</span>';
      if (key.status === 'cooldown' && key.cooldown_until > Date.now()) {
        const secs = Math.ceil((key.cooldown_until - Date.now()) / 1000);
        return '<span class="badge badge-cooldown">COOLDOWN (' + secs + 's)</span>';
      }
      if (key.status === 'exhausted') return '<span class="badge badge-exhausted">EXHAUSTED</span>';
      if (key.status === 'invalid') return '<span class="badge badge-invalid">INVALID</span>';
      return '<span class="badge badge-active">ACTIVE</span>';
    }

    function logStatusBadge(status) {
      if (status === 'ok') return '<span class="badge badge-active">OK</span>';
      if (status === 'retried') return '<span class="badge badge-cooldown">RETRY</span>';
      return '<span class="badge badge-invalid">ERROR</span>';
    }

    function fmtTime(iso) {
      if (!iso) return '-';
      const d = new Date(iso);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return diffSec + 's ago';
      if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
      if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }

    function esc(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async function loadOverview() {
      const badge = document.getElementById('connBadge');
      try {
        const data = await apiFetch('/api/overview');
        badge.className = 'badge badge-active';
        badge.textContent = 'Connected (v' + (data.version || '1.0') + ')';

        const cost = Number(data.stats.totalCostUsd || 0);
        const quota = Number(data.stats.totalQuotaUsd || 0);
        const rem = Math.max(0, quota - cost);

        document.getElementById('strategySelect').value = data.stats.strategy || 'least_used';
        document.getElementById('kpiKeys').textContent = data.stats.activeKeys + ' / ' + data.stats.totalKeys;
        document.getElementById('kpiToolCalls').textContent = data.stats.totalToolCalls;
        document.getElementById('kpiTotalReq').textContent = 'Total MCP RPCs: ' + data.stats.totalRequests;
        document.getElementById('kpiCost').textContent = '$' + cost.toFixed(3) + ' / $' + quota.toFixed(0);
        document.getElementById('kpiRemaining').textContent = 'Est. Remaining: $' + rem.toFixed(3);
        document.getElementById('kpiSuccessRate').textContent = data.stats.successRate + '%';
        document.getElementById('kpiFailovers').textContent = 'Auto-failovers: ' + data.stats.totalFailovers;
        document.getElementById('kpiLatency').textContent = data.stats.avgLatencyMs ? (data.stats.avgLatencyMs + ' ms') : '-';
        document.getElementById('poolSummaryText').textContent =
          data.stats.activeKeys + ' active of ' + data.stats.totalKeys + ' keys (' + data.stats.strategy + ')';

        const totalKeyCalls = data.keys.reduce((acc, k) => acc + (k.total_calls || 0), 0);
        const kb = document.getElementById('keysTableBody');
        if (!data.keys.length) {
          kb.innerHTML = '<tr><td colspan="10" class="muted" style="text-align:center;padding:24px">No Exa API keys in pool yet. Add one above!</td></tr>';
        } else {
          kb.innerHTML = data.keys.map(k => {
            const pct = totalKeyCalls > 0 ? Math.round((k.total_calls / totalKeyCalls) * 100) : 0;
            const kCost = Number(k.total_cost_usd || 0);
            const kQuota = Number(k.quota_usd || 10);
            const kLeft = Math.max(0, kQuota - kCost);
            return '<tr>' +
              '<td class="mono">#' + k.id + '</td>' +
              '<td><strong>' + esc(k.label) + '</strong></td>' +
              '<td class="mono muted">' + esc(k.masked_key) + '</td>' +
              '<td>' + statusBadge(k) + '</td>' +
              '<td><div class="bar-wrap"><div class="bar-fill" style="width:' + pct + '%"></div></div><span class="mono">' + pct + '%</span></td>' +
              '<td class="mono">' + k.total_calls + ' <span class="muted">(' + k.success_calls + ' / ' + k.error_calls + ')</span></td>' +
              '<td class="mono">$' + kCost.toFixed(3) + ' / $' + kQuota.toFixed(2) + ' <span class="muted">($' + kLeft.toFixed(2) + ' left)</span></td>' +
              '<td class="muted" title="' + esc(k.last_used_at || '') + '">' + fmtTime(k.last_used_at) + '</td>' +
              '<td class="err-text" title="' + esc(k.last_error || '') + '">' + esc(k.last_error || '-') + '</td>' +
              '<td><div style="display:flex;gap:4px">' +
                '<button class="btn-sm" onclick="testKey(' + k.id + ', this)">Test</button>' +
                '<button class="btn-sm" onclick="editQuota(' + k.id + ', ' + kQuota + ')">Quota</button>' +
                '<button class="btn-sm" onclick="toggleKey(' + k.id + ', ' + (!k.enabled) + ')">' + (k.enabled ? 'Disable' : 'Enable') + '</button>' +
                ((k.status !== 'active' || k.last_error) ? '<button class="btn-sm" onclick="resetKey(' + k.id + ')">Reset</button>' : '') +
                '<button class="btn-sm btn-danger" onclick="deleteKey(' + k.id + ')">Del</button>' +
              '</div></td>' +
            '</tr>';
          }).join('');
        }

        const lb = document.getElementById('logsTableBody');
        if (!data.logs.length) {
          lb.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">No tool calls recorded yet.</td></tr>';
        } else {
          lb.innerHTML = data.logs.map(l => {
            const c = Number(l.cost_usd || 0);
            return '<tr>' +
              '<td class="muted mono" title="' + esc(l.timestamp) + '">' + fmtTime(l.timestamp) + '</td>' +
              '<td><span class="badge badge-tool">' + esc(l.tool_name || l.method) + '</span></td>' +
              '<td class="query-cell" title="' + esc(l.query_preview || '') + '">' + esc(l.query_preview || '-') + '</td>' +
              '<td class="mono">' + (l.key_label ? (esc(l.key_label) + ' <span class="muted">(' + esc(l.masked_key) + ')</span>') : '-') + '</td>' +
              '<td>' + logStatusBadge(l.status) + '</td>' +
              '<td class="mono">' + (c > 0 ? ('$' + c.toFixed(3)) : '-') + '</td>' +
              '<td class="mono">' + (l.latency_ms != null ? (l.latency_ms + ' ms') : '-') + '</td>' +
              '<td class="err-text" title="' + esc(l.error_message || '') + '">' + esc(l.error_message || '-') + '</td>' +
            '</tr>';
          }).join('');
        }
      } catch (err) {
        badge.className = 'badge badge-invalid';
        badge.textContent = err.message;
      }
    }

    async function addSingleKey() {
      const label = document.getElementById('singleLabel').value.trim();
      const apiKey = document.getElementById('singleKey').value.trim();
      const quotaUsd = Number(document.getElementById('singleQuota').value) || 10;
      if (!apiKey) return showToast('Please enter an Exa API key');
      try {
        const res = await apiFetch('/api/keys', {
          method: 'POST',
          body: JSON.stringify({ keys: [{ label, apiKey, quotaUsd }] })
        });
        document.getElementById('singleLabel').value = '';
        document.getElementById('singleKey').value = '';
        showToast('Added ' + res.added + ' key(s)');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function addBatchKeys() {
      const rawText = document.getElementById('batchKeysInput').value.trim();
      if (!rawText) return showToast('Paste at least one key');
      try {
        const res = await apiFetch('/api/keys', {
          method: 'POST',
          body: JSON.stringify({ rawText })
        });
        document.getElementById('batchKeysInput').value = '';
        showToast('Imported ' + res.added + ' key(s)');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function editQuota(id, curQuota) {
      const input = prompt('Enter quota budget in USD for Key #' + id + ' (e.g. 10 for monthly free tier, 20 for new signup):', String(curQuota));
      if (input === null) return;
      const quotaUsd = Number(input);
      if (!(quotaUsd > 0)) return showToast('Invalid quota amount');
      try {
        await apiFetch('/api/keys/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ quotaUsd })
        });
        showToast('Updated Key #' + id + ' quota to $' + quotaUsd.toFixed(2));
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function resetAllStats() {
      if (!confirm('Reset all key call counts and tracked spend to 0?')) return;
      try {
        await apiFetch('/api/keys/reset-stats', { method: 'POST' });
        showToast('All key counters reset to 0');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function toggleKey(id, enabled) {
      try {
        await apiFetch('/api/keys/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ enabled })
        });
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function resetKey(id) {
      try {
        await apiFetch('/api/keys/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ enabled: true, status: 'active', resetError: true })
        });
        showToast('Key #' + id + ' reset to active');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function testKey(id, btn) {
      const orig = btn.textContent;
      btn.textContent = '...';
      btn.disabled = true;
      try {
        const res = await apiFetch('/api/keys/' + id + '/test', { method: 'POST' });
        showToast(res.ok ? ('Key #' + id + ' OK (' + res.latencyMs + 'ms)') : ('Key #' + id + ' Failed: ' + res.error));
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    }

    async function testAllKeys() {
      const btn = document.getElementById('btnTestAll');
      btn.disabled = true;
      btn.textContent = 'Testing...';
      try {
        const res = await apiFetch('/api/keys/test-all', { method: 'POST' });
        showToast('Verified ' + res.tested + ' keys (' + res.healthy + ' healthy)');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '🩺 Verify All Active Keys';
      }
    }

    async function deleteKey(id) {
      if (!confirm('Remove key #' + id + ' from pool?')) return;
      try {
        await apiFetch('/api/keys/' + id, { method: 'DELETE' });
        showToast('Deleted key #' + id);
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function updateStrategy(strategy) {
      try {
        await apiFetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify({ strategy })
        });
        showToast('Strategy updated to ' + strategy);
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function clearLogs() {
      try {
        await apiFetch('/api/logs', { method: 'DELETE' });
        showToast('Call logs cleared');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    function copyMcpConfig() {
      const text = document.getElementById('mcpConfigPre').textContent;
      navigator.clipboard.writeText(text);
      showToast('Copied mcp.json snippet!');
    }

    function toggleAutoRefresh(enabled) {
      clearInterval(refreshTimer);
      if (enabled) {
        refreshTimer = setInterval(loadOverview, 5000);
      }
    }

    document.getElementById('proxyKeyInput').value = getProxyKey();
    renderMcpSnippet();
    loadOverview();
    toggleAutoRefresh(true);
  </script>
</body>
</html>`;
}
