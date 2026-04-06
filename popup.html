<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RoBud - Trade Analyze</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      color-scheme: light;
      --bg-top: #e8eef9;
      --bg: #f0f4fb;
      --bg-bottom: #f8fafc;
      --surface: #ffffff;
      --surface-light: #eef2ff;
      --border: #c7d2fe;
      --border-subtle: #e2e8f0;
      --text: #0f172a;
      --text-muted: #475569;
      --text-dim: #64748b;
      --accent: #1e40af;
      --accent-light: #2563eb;
      --accent-soft: #dbeafe;
      --green: #059669;
      --red: #dc2626;
      --yellow: #d97706;
      --radius: 14px;
      --shadow: 0 4px 24px rgba(30, 58, 138, 0.08);
      --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
      --tabs-bg: rgba(255, 255, 255, 0.6);
      --input-bg: #ffffff;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        color-scheme: dark;
        --bg-top: #0c1016;
        --bg: #131920;
        --bg-bottom: #0f1419;
        --surface: #1c2430;
        --surface-light: #283240;
        --border: #3d4d62;
        --border-subtle: #2a3442;
        --text: #e8edf4;
        --text-muted: #94a3b8;
        --text-dim: #8b9cae;
        --accent: #5b9cf8;
        --accent-light: #82b4ff;
        --accent-soft: rgba(91, 156, 248, 0.14);
        --green: #4ade80;
        --red: #f87171;
        --yellow: #fbbf24;
        --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35);
        --tabs-bg: rgba(0, 0, 0, 0.25);
        --input-bg: #252d3a;
      }

      .plan-card.gold .plan-name { color: #fcd34d; }
      .plan-card.diamond .plan-name { color: #7dd3fc; }
      .status-card.gold .status-badge { background: rgba(251, 191, 36, 0.14); color: #fcd34d; }
      .status-card.diamond .status-badge { background: rgba(56, 189, 248, 0.12); color: #7dd3fc; }
      .status-value.gold { color: #fcd34d; }
      .status-value.diamond { color: #7dd3fc; }
      .plan-card.gold {
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.07) 0%, var(--surface) 100%);
      }
      .plan-card.diamond {
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, var(--surface) 100%);
      }
      .plan-ctas .btn-robux,
      .plan-card .plan-upgrade-single.btn-robux {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
      }
      .header {
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
      }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    html, body {
      overflow-x: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    body::-webkit-scrollbar, html::-webkit-scrollbar {
      display: none;
    }
    body {
      width: 340px;
      font-family: 'IBM Plex Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      background: linear-gradient(180deg, var(--bg-top) 0%, var(--bg) 32%, var(--bg-bottom) 100%);
      color: var(--text);
      line-height: 1.5;
    }

    .popup {
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 18px 18px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 52%, #3b82f6 100%);
      border-bottom: none;
      box-shadow: 0 4px 20px rgba(30, 58, 138, 0.35);
    }

    .logo {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    }

    .header-text h1 {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .header-text p {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.88);
      margin-top: 2px;
    }

    .status-card {
      margin: 14px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      animation: slideIn 0.3s ease;
    }

    .status-card.premium,
    .status-card.gold,
    .status-card.diamond {
      border-color: var(--accent-light);
      background: linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 55%);
    }

    .status-card.gold {
      border-color: #ca8a04;
      background: linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, var(--surface) 60%);
    }

    .status-card.diamond {
      border-color: #0ea5e9;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, var(--surface) 60%);
    }

    .status-card.free {
      border-color: var(--green);
    }

    .status-card.gold .status-badge { background: rgba(202, 138, 4, 0.15); color: #a16207; }
    .status-card.diamond .status-badge { background: rgba(14, 165, 233, 0.12); color: #0369a1; }
    .status-value.gold { color: #a16207; }
    .status-value.diamond { color: #0369a1; }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .status-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .status-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      background: var(--surface-light);
      color: var(--text-muted);
    }

    .status-card.premium .status-badge {
      background: rgba(37, 99, 235, 0.12);
      color: var(--accent);
    }

    .status-card.free .status-badge {
      background: rgba(74,222,128,0.15);
      color: var(--green);
    }

    .status-value {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .status-value.premium { color: var(--accent); }

    .status-note {
      font-size: 13px;
      color: var(--text-muted);
    }

    .status-extra {
      margin-top: 12px;
    }

    .time-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--surface-light);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }

    .time-badge.lifetime {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(250, 204, 21, 0.12));
      color: var(--accent);
    }

    .expires-text {
      margin-top: 6px;
      font-size: 11px;
      color: var(--text-dim);
    }

    .upgrade-btn {
      display: block;
      width: 100%;
      margin-top: 12px;
      padding: 12px;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: background 0.2s;
    }

    .upgrade-btn:hover {
      background: var(--accent-light);
      filter: brightness(1.05);
    }

    .pricing-section {
      margin-top: 14px;
      padding: 0 14px;
    }

    .pricing-section .section-title {
      margin-bottom: 10px;
    }

    .plan-cards {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .plan-card {
      padding: 14px;
      border-radius: var(--radius);
      border: 1px solid var(--border-subtle);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
    }

    .plan-card.gold {
      border-color: rgba(202, 138, 4, 0.35);
      background: linear-gradient(135deg, rgba(250, 204, 21, 0.08) 0%, var(--surface) 100%);
    }

    .plan-card.diamond {
      border-color: rgba(14, 165, 233, 0.35);
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, var(--surface) 100%);
    }

    .plan-name {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .plan-card.gold .plan-name { color: #a16207; }
    .plan-card.diamond .plan-name { color: #0369a1; }

    .plan-desc {
      font-size: 11px;
      color: var(--text-dim);
      margin-bottom: 8px;
    }

    .plan-price {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .plan-ctas {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .plan-ctas a {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .plan-ctas a:hover { opacity: 0.9; }

    .plan-ctas .btn-robux {
      background: linear-gradient(180deg, var(--accent-light) 0%, var(--accent) 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(30, 64, 175, 0.25);
    }

    .plan-ctas .btn-discord {
      background: #5865f2;
      color: white;
    }

    .plan-card.current {
      box-shadow: 0 0 0 2px var(--accent), var(--shadow-sm);
      position: relative;
    }

    .plan-card.current::before {
      content: 'Current plan';
      position: absolute;
      top: 8px;
      right: 10px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
    }

    .plan-card.free .plan-name { color: var(--green); }
    .plan-usage {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 4px;
    }
    .plan-time-left {
      font-size: 11px;
      color: var(--text-dim);
      margin-bottom: 8px;
    }
    .plan-card .plan-upgrade-single {
      display: block;
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      transition: opacity 0.2s;
      margin-top: 6px;
    }
    .plan-card .plan-upgrade-single:hover { opacity: 0.9; }
    .plan-card .plan-upgrade-single.btn-robux { background: linear-gradient(180deg, var(--accent-light) 0%, var(--accent) 100%); color: white; box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2); }
    .plan-card .plan-upgrade-single.btn-discord { background: #5865f2; color: white; }
    .plan-card .plan-upgrade-single.btn-upgrade { background: var(--accent); color: white; }

    .status-summary {
      margin: 14px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      font-size: 13px;
      color: var(--text-muted);
      box-shadow: var(--shadow-sm);
    }

    .status-summary strong { color: var(--text); }
    .status-summary a { color: var(--accent); text-decoration: none; font-weight: 600; }
    .status-summary a:hover { text-decoration: underline; }

    .section {
      padding: 0 14px;
      margin-top: 14px;
      animation: slideIn 0.3s ease;
      animation-delay: 0.1s;
      animation-fill-mode: both;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 10px;
    }

    .recent-list {
      list-style: none;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      max-height: 160px;
      overflow-y: auto;
      box-shadow: var(--shadow-sm);
    }

    .recent-list:empty::after {
      content: 'No analyses yet';
      display: block;
      padding: 20px;
      text-align: center;
      color: var(--text-dim);
      font-size: 12px;
    }

    .recent-item {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .recent-item:last-child { border-bottom: none; }

    .recent-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .recent-dot.green { background: var(--green); }
    .recent-dot.red { background: var(--red); }
    .recent-dot.yellow { background: var(--yellow); }

    .recent-body { flex: 1; min-width: 0; }

    .recent-summary {
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .recent-meta {
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 2px;
    }

    .footer {
      margin: 14px;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      font-size: 11px;
      color: var(--text-dim);
      line-height: 1.6;
      box-shadow: var(--shadow-sm);
    }

    .footer a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-subtle);
      padding: 0 14px;
      gap: 4px;
      background: var(--tabs-bg);
    }
    .tab {
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-dim);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      margin-bottom: -1px;
    }
    .tab:hover { color: var(--accent); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

    .panel { display: none; }
    .panel.active { display: block; }

    .trade-ad-section {
      margin: 14px;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
    }
    .trade-ad-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 8px;
    }
    .trade-ad-tags {
      min-height: 32px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .trade-ad-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--surface-light);
      border-radius: 6px;
      font-size: 11px;
    }
    .trade-ad-tag button {
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      padding: 0 2px;
      font-size: 14px;
      line-height: 1;
    }
    .trade-ad-tag button:hover { color: var(--red); }
    .trade-ad-search-wrap {
      margin-top: 8px;
      position: relative;
    }
    .trade-ad-search {
      width: 100%;
      padding: 8px 10px;
      background: var(--input-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text);
      font-size: 12px;
    }
    .trade-ad-search::placeholder { color: var(--text-dim); }
    .trade-ad-dropdown {
      position: absolute;
      left: 0;
      right: 0;
      top: 100%;
      margin-top: 4px;
      max-height: 140px;
      overflow-y: auto;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      z-index: 10;
      list-style: none;
      box-shadow: var(--shadow);
    }
    .trade-ad-dropdown li {
      padding: 6px 10px;
      font-size: 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-subtle);
    }
    .trade-ad-dropdown li:last-child { border-bottom: none; }
    .trade-ad-dropdown li:hover { background: var(--surface-light); }
    .trade-ad-actions {
      margin: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .trade-ad-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .trade-ad-toggle input { accent-color: var(--accent); }
    .trade-ad-btn {
      padding: 10px;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .trade-ad-btn:hover { background: var(--accent-light); }
    .trade-ad-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .trade-ad-msg {
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 4px;
    }
    .trade-ad-msg.error { color: var(--red); }
    .trade-ad-msg.ok { color: var(--green); }
  </style>
</head>
<body>
  <div class="popup">
    <header class="header">
      <img src="logo.png" alt="RoBud" class="logo">
      <div class="header-text">
        <h1>RoBud</h1>
        <p>Trade value checker</p>
      </div>
    </header>
    <nav class="tabs">
      <button type="button" class="tab active" data-tab="status">Status</button>
      <button type="button" class="tab" data-tab="subscriptions">Subscriptions</button>
      <button type="button" class="tab" data-tab="tradead">Trade Ad</button>
    </nav>
    
    <main id="panel-status" class="panel active">
    <div class="status-summary" id="status-summary"></div>
    <section class="section">
      <h2 class="section-title">Recent</h2>
      <ul class="recent-list" id="recent-list"></ul>
    </section>
    
    <div class="footer">
      <p><strong>Gold</strong> 600 requests/mo · <strong>Diamond</strong> 1,600 requests/mo. Pay with Robux (gamepass) or via Discord ($).</p>
      <p style="margin-top: 6px;">Questions? <a href="https://discord.gg/robud" target="_blank" rel="noopener" id="footer-discord">Discord</a></p>
    </div>
    </main>

    <main id="panel-subscriptions" class="panel">
      <div class="plans-wrap" style="padding: 0 14px; margin-top: 14px;">
        <h2 class="section-title">Plans</h2>
        <div class="plan-cards" id="all-plan-cards">
          <div class="plan-card free" id="plan-free"><div class="plan-name">Free</div><div class="plan-desc">10 checks per day</div><div class="plan-usage" id="plan-free-usage">—</div><div class="plan-ctas" id="plan-free-cta"></div></div>
          <div class="plan-card gold" id="plan-gold"><div class="plan-name">Gold</div><div class="plan-desc">600 requests per month</div><div class="plan-price">$10/mo or 2,000 R$</div><div class="plan-usage" id="plan-gold-usage"></div><div class="plan-time-left" id="plan-gold-time"></div><div class="plan-ctas" id="plan-gold-cta"></div></div>
          <div class="plan-card diamond" id="plan-diamond"><div class="plan-name">Diamond</div><div class="plan-desc">1,600 requests per month</div><div class="plan-price">$20/mo or 3,500 R$</div><div class="plan-usage" id="plan-diamond-usage"></div><div class="plan-time-left" id="plan-diamond-time"></div><div class="plan-ctas" id="plan-diamond-cta"></div></div>
        </div>
      </div>
      <div class="footer" style="margin-top: 14px;">
        <p><strong>Gold</strong> 600 requests/mo · <strong>Diamond</strong> 1,600 requests/mo. Pay with Robux (gamepass) or via Discord ($).</p>
        <p style="margin-top: 6px;">Questions? <a href="https://discord.gg/robud" target="_blank" rel="noopener" id="footer-discord-subs">Discord</a></p>
      </div>
    </main>

    <main id="panel-tradead" class="panel">
      <div class="trade-ad-coming-soon" style="padding: 24px 16px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 8px;">Trade Ad</p>
        <p>Coming soon.</p>
      </div>
    </main>
  </div>
  <script src="popup.js"></script>
</body>
</html>
