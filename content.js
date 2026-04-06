(function () {
  const ANALYZE_BUTTON_CLASS = "roblox-analyze-trade-button";
  const ANALYZE_MODAL_ID = "roblox-analyze-trade-modal";
  const STYLE_ID = "roblox-analyze-trade-styles";
  const DEFAULT_SERVER_URL = "****";
  const SERVER_URL_KEY = "rpal_server_url";
  const CLIENT_ID_KEY = "rpal_client_id";
  const DISCORD_INVITE_URL = "https://discord.gg/robud";
  const FONT_LINK_ID = "roblox-analyze-trade-fonts";

  function getServerUrl() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([SERVER_URL_KEY], function (r) {
        var url = (r && r[SERVER_URL_KEY]) || DEFAULT_SERVER_URL;
        resolve((url || "").replace(/\/$/, ""));
      });
    });
  }
  const RECENT_ANALYSES_KEY = "rpal_recent_analyses";
  const MAX_RECENT_ANALYSES = 10;

  var _usr = { username: null, userId: null };
  
  var _tradeCache = {};
  var _lastTradeId = null;
  var _inboundTrades = [];
  var _inboundTradesFetched = false;
  var TRADE_CACHE_TTL = 5 * 60 * 1000;
  function fetchInboundTradesList() {
    if (_inboundTradesFetched) return;
    _inboundTradesFetched = true;
    
    fetch("https://trades.roblox.com/v1/trades/Inbound?sortOrder=Desc&limit=25", {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" }
    })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (data && data.data && Array.isArray(data.data)) {
        _inboundTrades = data.data;
        console.log("[TradeAnalyze] Fetched inbound trades list:", _inboundTrades.length, "trades");
        _inboundTrades.forEach(function(trade, idx) {
          console.log("[TradeAnalyze] Inbound trade", idx, "- ID:", trade.id, "User:", trade.user && trade.user.name);
        });
      }
    })
    .catch(function(e) {
      console.log("[TradeAnalyze] Failed to fetch inbound trades:", e);
    });
  }

  function getTradeIdFromInboundList(rowIndex) {
    if (rowIndex >= 0 && rowIndex < _inboundTrades.length) {
      var trade = _inboundTrades[rowIndex];
      console.log("[TradeAnalyze] Found trade ID from inbound list at index", rowIndex, ":", trade.id);
      return String(trade.id);
    }
    return null;
  }

  function getSelectedTradeIndex() {
    var selectedRow = document.querySelector(".trade-row.selected");
    if (!selectedRow) {
      console.log("[TradeAnalyze] No selected trade row found");
      return -1;
    }
    
    var container = selectedRow.closest(".simplebar-content") || selectedRow.parentElement;
    if (!container) return -1;
    
    var allRows = container.querySelectorAll(".trade-row");
    var index = Array.from(allRows).indexOf(selectedRow);
    
    console.log("[TradeAnalyze] Selected trade row index:", index, "of", allRows.length, "total rows");
    return index;
  }
  
  function getTradeRowIndex(buttonEl) {
    var selectedIndex = getSelectedTradeIndex();
    if (selectedIndex >= 0) return selectedIndex;
    
    if (!buttonEl) return -1;
    
    var row = buttonEl.closest(".trade-row");
    if (!row) {
      row = buttonEl.closest(".trade-list-item, [class*='trade-row'], [class*='trade-item']");
    }
    if (!row) {
      row = buttonEl.closest("li, .list-item, [role='listitem']");
    }
    if (!row) return -1;
    
    var container = row.closest(".simplebar-content") || row.parentElement;
    if (!container) return -1;
    
    var allRows = container.querySelectorAll(".trade-row");
    if (allRows.length === 0) {
      allRows = container.children;
    }
    
    var index = Array.from(allRows).indexOf(row);
    console.log("[TradeAnalyze] Trade row index (from button):", index);
    return index;
  }

  (function interceptFetch() {
    var originalFetch = window.fetch;
    window.fetch = function(url, options) {
      return originalFetch.apply(this, arguments).then(function(response) {
        try {
          var urlStr = typeof url === "string" ? url : (url && url.url ? url.url : "");
          var match = urlStr.match(/trades\.roblox\.com\/v2\/trades\/(\d+)/);
          if (match && match[1]) {
            var tradeId = match[1];
            console.log("[TradeAnalyze] Intercepted fetch for trade ID:", tradeId);
            response.clone().json().then(function(data) {
              console.log("[TradeAnalyze] Trade API response:", JSON.stringify(data, null, 2));
              if (data && data.offers) {
                _tradeCache[tradeId] = {
                  data: data,
                  timestamp: Date.now()
                };
                _lastTradeId = tradeId; // Store as last viewed trade
                console.log("[TradeAnalyze] Cached trade data for ID:", tradeId);
                console.log("[TradeAnalyze] Set _lastTradeId to:", tradeId);
                data.offers.forEach(function(offer, idx) {
                  console.log("[TradeAnalyze] Offer", idx, "- User:", offer.user && offer.user.name, "Robux:", offer.robux);
                });
              }
            }).catch(function(e) { console.log("[TradeAnalyze] Failed to parse response:", e); });
          }
        } catch (_e) {}
        return response;
      });
    };
  })();

  (function interceptXHR() {
    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._rpal_url = url;
      return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      var xhr = this;
      var url = xhr._rpal_url || "";
      
      xhr.addEventListener("load", function() {
        try {
          var match = url.match(/trades\.roblox\.com\/v2\/trades\/(\d+)/);
          if (match && match[1] && xhr.responseText) {
            var tradeId = match[1];
            console.log("[TradeAnalyze] Intercepted XHR for trade ID:", tradeId);
            var data = JSON.parse(xhr.responseText);
            console.log("[TradeAnalyze] Trade API response (XHR):", JSON.stringify(data, null, 2));
            if (data && data.offers) {
              _tradeCache[tradeId] = {
                data: data,
                timestamp: Date.now()
              };
              _lastTradeId = tradeId; // Store as last viewed trade
              console.log("[TradeAnalyze] Cached trade data (XHR) for ID:", tradeId);
              console.log("[TradeAnalyze] Set _lastTradeId to:", tradeId);
              data.offers.forEach(function(offer, idx) {
                console.log("[TradeAnalyze] Offer", idx, "- User:", offer.user && offer.user.name, "Robux:", offer.robux);
              });
            }
          }
        } catch (_e) {}
      });
      
      return originalSend.apply(this, arguments);
    };
  })();

  function getCachedTradeData(tradeId) {
    if (!tradeId) return null;
    var cached = _tradeCache[tradeId];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > TRADE_CACHE_TTL) {
      delete _tradeCache[tradeId];
      return null;
    }
    return cached.data;
  }

  function getRobuxFromCachedTrade(tradeId, myUserId) {
    var data = getCachedTradeData(tradeId);
    console.log("[TradeAnalyze] getCachedTradeData for tradeId:", tradeId, "result:", data);
    if (!data || !data.offers || !Array.isArray(data.offers)) return null;
    
    console.log("[TradeAnalyze] Trade offers:", JSON.stringify(data.offers, null, 2));
    
    var myOffer = null;
    var theirOffer = null;
    
    for (var i = 0; i < data.offers.length; i++) {
      var offer = data.offers[i];
      var offerUserId = offer.user && offer.user.id != null ? String(offer.user.id) : null;
      console.log("[TradeAnalyze] Offer", i, "- userId:", offerUserId, "robux:", offer.robux, "myUserId:", myUserId);
      if (myUserId && offerUserId === String(myUserId)) {
        myOffer = offer;
      } else {
        theirOffer = offer;
      }
    }
    
    if (!myOffer && !theirOffer && data.offers.length >= 2) {
      myOffer = data.offers[0];
      theirOffer = data.offers[1];
    }
    
    var giveRobuxRaw = myOffer && typeof myOffer.robux === "number" ? Math.max(0, myOffer.robux) : 0;
    var receiveRobuxRaw = theirOffer && typeof theirOffer.robux === "number" ? Math.max(0, theirOffer.robux) : 0;
    
    var giveRobuxAfterTax = Math.floor(giveRobuxRaw * 0.7);
    var receiveRobuxAfterTax = Math.floor(receiveRobuxRaw * 0.7);
    
    console.log("[TradeAnalyze] Raw robux - GIVE:", giveRobuxRaw, "RECEIVE:", receiveRobuxRaw);
    console.log("[TradeAnalyze] After 30% tax - GIVE:", giveRobuxAfterTax, "RECEIVE:", receiveRobuxAfterTax);
    
    return { 
      giveRobux: giveRobuxAfterTax, 
      receiveRobux: receiveRobuxAfterTax,
      giveRobuxRaw: giveRobuxRaw,
      receiveRobuxRaw: receiveRobuxRaw
    };
  }

  const ICONS = {
    red: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#e74c3c"/><path d="M16 16l16 16M32 16L16 32" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    yellow: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#F5A623"/><rect x="22" y="13" width="4" height="15" rx="2" fill="#fff"/><circle cx="24" cy="34" r="2.5" fill="#fff"/></svg>',
    green: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#00b06f"/><path d="M14 24l7 8 15-18" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  };

  onReady(function() {
    fetchRobloxUser();
    
    if (window.location.pathname.indexOf("/trades") !== -1) {
      fetchInboundTradesList();
    }
    
    insertAnalyzeTradeButtons();
    var obs = new MutationObserver(function () {
      insertAnalyzeTradeButtons();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  });

  function onReady(cb) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cb);
    else cb();
  }

  function getClientId() {
    try {
      var id = localStorage.getItem(CLIENT_ID_KEY);
      if (!id) {
        id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0;
          var v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        localStorage.setItem(CLIENT_ID_KEY, id);
      }
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [CLIENT_ID_KEY]: id }, function () {});
      }
      return id;
    } catch (_e) {
      return "anon-" + Date.now();
    }
  }

  function getRobloxUser() {
    try {
      var username = null, userId = null;
      var nav = document.querySelector("nav") || document.querySelector("[data-testid='nav']") || document.body;
      var profileLink = nav.querySelector("a[href*='/users/'][href*='/profile']") || document.querySelector("a[href*='/users/'][href*='/profile']");
      if (profileLink) {
        var m = (profileLink.getAttribute("href") || "").match(/\/users\/(\d+)/);
        if (m) userId = m[1];
        var label = profileLink.textContent && profileLink.textContent.trim();
        if (label && label.length < 50) username = label;
      }
      if (!username && document.querySelector(".rbx-navbar-account")) {
        var account = document.querySelector(".rbx-navbar-account");
        var nameEl = account && (account.querySelector(".text-overflow") || account.querySelector("span"));
        if (nameEl) username = nameEl.textContent.trim();
      }
      return { username: username || null, userId: userId || null };
    } catch (_e) {
      return { username: null, userId: null };
    }
  }

  function fetchRobloxUser() {
    return fetch("https://users.roblox.com/v1/users/authenticated", { credentials: "include" })
      .then(function (r) {
        if (!r.ok) return getRobloxUser();
        return r.json().then(function (data) {
          var roblox = {
            userId: data.id != null ? String(data.id) : null,
            username: data.name || data.displayName || null,
          };
          _usr = roblox;
          if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ rpal_roblox_user: roblox }, function () {});
          }
          return roblox;
        });
      })
      .catch(function () { return getRobloxUser(); });
  }

  function registerWithServer(robloxUser) {
    if (!robloxUser) return;
    var cid = getClientId();
    getServerUrl().then(function (baseUrl) {
      var params = new URLSearchParams({ clientId: cid });
      if (robloxUser.userId) params.set("robloxUserId", robloxUser.userId);
      if (robloxUser.username) params.set("robloxUsername", robloxUser.username);
      fetch(baseUrl + "/api/extension/register?" + params.toString(), { method: "GET", credentials: "omit" }).catch(function () {});
    });
  }

  function isRobloxDarkMode() {
    try {
      var root = document.documentElement;
      var body = document.body || root;
      if (root.getAttribute("data-theme") === "dark" || body.getAttribute("data-theme") === "dark") return true;
      if (root.getAttribute("data-theme") === "light" || body.getAttribute("data-theme") === "light") return false;
      var darkCls = /theme-dark|dark-theme|dark-mode|\.dark\b/i;
      if (darkCls.test(String(root.className || "")) || darkCls.test(String(body.className || ""))) return true;
      var htmlClass = String(root.className || "");
      if (/\bdark\b/i.test(htmlClass) && !/\blight-theme\b/i.test(htmlClass)) return true;
      var bg = getComputedStyle(body).backgroundColor;
      var m = bg && bg.match(/\d+/g);
      if (m && m.length >= 3) {
        var brightness = (parseInt(m[0], 10) * 299 + parseInt(m[1], 10) * 587 + parseInt(m[2], 10) * 114) / 1000;
        return brightness < 128;
      }
    } catch (_e) {}
    return false;
  }

  function ensureTradeModalFonts() {
    if (document.getElementById(FONT_LINK_ID)) return;
    var link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
    document.head.appendChild(link);
  }

  function getTheme() {
    var fontStack = "'IBM Plex Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    if (isRobloxDarkMode()) {
      return {
        isDark: true,
        fontStack: fontStack,
        bg: "#13171d",
        panelBg: "#1a1f27",
        bodyGradientTop: "#1e293b",
        panelCard: "#222a35",
        itemCardBg: "#2a3341",
        itemThumbBg: "#0f1419",
        text: "#e5e7eb",
        sub: "#9ca3af",
        border: "#3d4a5c",
        primary: "#5b9cf8",
        primaryLight: "#7eb6ff",
        headerFrom: "#1a365d",
        headerTo: "#2563eb",
        green: "#4ade80",
        red: "#f87171",
        verdictRedBg: "rgba(69,10,10,0.45)",
        verdictRedBorder: "#991b1b",
        verdictRedText: "#fecaca",
        verdictGreenBg: "rgba(6,78,59,0.4)",
        verdictGreenBorder: "#059669",
        verdictGreenText: "#6ee7b7",
        verdictYellowBg: "rgba(113,63,18,0.45)",
        verdictYellowBorder: "#d97706",
        verdictYellowText: "#fde68a",
        spinnerTrack: "#374151",
        spinnerColor: "#60a5fa",
        footerBg: "#1a1f27",
        backdrop: "rgba(0,0,0,0.78)",
        loadingPrimary: "#93c5fd",
        loadingSub: "#9ca3af",
        cardMuted: "#2d3748",
      };
    }
    return {
      isDark: false,
      fontStack: fontStack,
      bg: "#ffffff",
      panelBg: "#f8fafc",
      bodyGradientTop: "#eff6ff",
      panelCard: "#ffffff",
      itemCardBg: "#f1f5f9",
      itemThumbBg: "#ffffff",
      text: "#0f172a",
      sub: "#64748b",
      border: "#e2e8f0",
      primary: "#1e40af",
      primaryLight: "#2563eb",
      headerFrom: "#1e3a8a",
      headerTo: "#2563eb",
      green: "#059669",
      red: "#dc2626",
      verdictRedBg: "#fef2f2",
      verdictRedBorder: "#fecaca",
      verdictRedText: "#b91c1c",
      verdictGreenBg: "#ecfdf5",
      verdictGreenBorder: "#a7f3d0",
      verdictGreenText: "#047857",
      verdictYellowBg: "#fffbeb",
      verdictYellowBorder: "#fde68a",
      verdictYellowText: "#b45309",
      spinnerTrack: "#e2e8f0",
      spinnerColor: "#1e40af",
      footerBg: "#ffffff",
      backdrop: "rgba(15,23,42,0.52)",
      loadingPrimary: "#1e40af",
      loadingSub: "#64748b",
      cardMuted: "#f1f5f9",
    };
  }

  function injectStyles(t) {
    var el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    var s = document.createElement("style");
    s.id = STYLE_ID;
    var css = [
      "@keyframes rpal-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}",
      "@keyframes rpal-fadein{from{opacity:0;transform:scale(.98) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}",
      "@keyframes rpal-slideup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
      ".rpal-modal{animation:rpal-fadein .28s cubic-bezier(.2,.8,.2,1);box-shadow:0 25px 50px -12px rgba(30,58,138,.2),0 0 0 1px " + t.border + ";width:clamp(720px,90vw,1680px);height:clamp(520px,86vh,1020px);border-radius:clamp(16px,1.4vw,24px);overflow:hidden;display:flex;flex-direction:column;background:" + t.bg + ";border:1px solid " + t.border + "}",
      ".rpal-modal .rpal-body-inner{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;background:linear-gradient(180deg," + t.bodyGradientTop + " 0%," + t.panelBg + " 22%);padding:clamp(14px,2vw,26px);scrollbar-width:thin}",
      ".rpal-layout-root{display:flex;flex-direction:column;gap:clamp(14px,1.8vw,22px);max-width:100%}",
      ".rpal-verdict-hero.rpal-verdict{margin:0;padding:clamp(22px,2.6vw,40px);border-radius:clamp(18px,1.5vw,26px);box-shadow:0 10px 40px " + (t.isDark ? "rgba(0,0,0,.45)" : "rgba(30,58,138,.1)") + "}",
      ".rpal-totals-strip{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,1.5vw,18px)}",
      ".rpal-total-pill{background:" + t.panelCard + ";border:1px solid " + t.border + ";border-radius:clamp(14px,1.2vw,18px);padding:clamp(12px,1.5vw,20px);text-align:center;box-shadow:0 2px 12px " + (t.isDark ? "rgba(0,0,0,.35)" : "rgba(15,23,42,.04)") + "}",
      ".rpal-total-pill .rpal-pill-k{display:block;font-size:10px;font-weight:700;color:" + t.sub + ";text-transform:uppercase;letter-spacing:.08em}",
      ".rpal-total-pill .rpal-pill-v{display:block;font-size:clamp(20px,2.2vw,30px);font-weight:800;color:" + t.primary + ";margin-top:6px;letter-spacing:-.03em}",
      ".rpal-total-pill.rpal-pill-recv .rpal-pill-v{color:" + t.green + "}",
      ".rpal-trade-split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(14px,2vw,26px);align-items:start}",
      ".rpal-trade-col{background:" + t.panelCard + ";border:1px solid " + t.border + ";border-radius:clamp(16px,1.3vw,22px);padding:clamp(14px,1.8vw,24px);box-shadow:0 4px 24px " + (t.isDark ? "rgba(0,0,0,.4)" : "rgba(15,23,42,.05)") + "}",
      ".rpal-trade-col-give{border-top:4px solid " + t.primaryLight + "}",
      ".rpal-trade-col-recv{border-top:4px solid " + t.green + "}",
      ".rpal-col-head{font-size:clamp(14px,1.35vw,18px);font-weight:800;color:" + t.primary + ";letter-spacing:-.02em;margin:0 0 clamp(10px,1.2vw,16px);display:flex;align-items:center;gap:8px}",
      ".rpal-trade-col-recv .rpal-col-head{color:" + t.green + "}",
      ".rpal-col-head::before{content:'';width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.85}",
      ".rpal-items-section .rpal-items-grid{margin-top:0}",
      "@media (max-width:820px){.rpal-trade-split{grid-template-columns:1fr}.rpal-totals-strip{grid-template-columns:1fr}}",
      ".rpal-extras-stack{display:flex;flex-direction:column;gap:clamp(10px,1.2vw,14px);margin-top:clamp(4px,0.6vw,8px)}",
      ".rpal-extras-stack a.rpal-reasoning-toggle{justify-content:center}",
      ".rpal-spinner{width:clamp(38px,4vw,52px);height:clamp(38px,4vw,52px);border:3px solid " + t.spinnerTrack + ";border-top-color:" + t.spinnerColor + ";border-radius:50%;animation:rpal-spin .75s linear infinite;margin:0 auto clamp(12px,2vw,20px)}",
      "#rpal-trade-cards-wrap{animation:rpal-slideup .24s ease-out}",
      ".rpal-items-grid{display:flex;flex-wrap:wrap;gap:clamp(12px,1.4vw,20px);justify-content:flex-start;margin:clamp(10px,1.4vw,18px) 0}",
      ".rpal-item-card{width:clamp(88px,10vw,142px);text-align:center;background:" + t.itemCardBg + ";border-radius:clamp(12px,1.1vw,16px);padding:clamp(10px,1.1vw,16px) clamp(8px,1vw,14px);display:flex;flex-direction:column;align-items:center;border:1px solid " + t.border + ";transition:transform .15s ease,box-shadow .15s ease}",
      ".rpal-item-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px " + (t.isDark ? "rgba(0,0,0,.45)" : "rgba(30,58,138,.12)") + "}",
      ".rpal-item-card img{width:clamp(62px,8vw,112px);height:clamp(62px,8vw,112px);border-radius:clamp(8px,1vw,12px);object-fit:contain;background:" + t.itemThumbBg + ";border:1px solid " + t.border + "}",
      ".rpal-item-name{font-size:clamp(11px,1.2vw,16px);font-weight:600;color:" + t.text + ";margin-top:clamp(6px,0.6vw,10px);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.35}",
      ".rpal-item-value{font-size:clamp(12px,1.3vw,17px);color:" + t.green + ";font-weight:700;margin-top:clamp(4px,0.5vw,8px)}",
      ".rpal-section-label{font-size:clamp(9px,0.9vw,13px);font-weight:700;color:" + t.sub + ";margin:0 0 clamp(4px,0.6vw,10px);text-align:left;text-transform:uppercase;letter-spacing:.06em}",
      ".rpal-robux-subsection{font-size:clamp(10px,1vw,14px);color:" + t.sub + ";margin:clamp(4px,0.6vw,8px) 0 0;padding:clamp(4px,0.6vw,8px) 0;border-top:1px solid " + t.border + "}",
      ".rpal-total{font-size:clamp(11px,1.2vw,16px);font-weight:700;color:" + t.text + ";text-align:right;margin:clamp(6px,0.7vw,12px) 0 0}",
      ".rpal-divider{border:none;border-top:1px solid " + t.border + ";margin:clamp(12px,1.4vw,20px) 0}",
      ".rpal-verdict{text-align:center;padding:clamp(16px,2.2vw,28px) clamp(18px,2.6vw,32px);border-radius:clamp(12px,1.2vw,18px);display:flex;flex-direction:column;align-items:center;gap:clamp(8px,1vw,14px);background:" + t.panelCard + ";border:1px solid " + t.border + ";box-shadow:0 4px 20px " + (t.isDark ? "rgba(0,0,0,.35)" : "rgba(15,23,42,.06)") + "}",
      ".rpal-verdict-icon{margin:0;display:flex;align-items:center;justify-content:center}",
      ".rpal-verdict-icon svg{width:clamp(40px,4.2vw,58px);height:clamp(40px,4.2vw,58px)}",
      ".rpal-verdict-label{font-size:clamp(14px,1.45vw,21px);font-weight:700;line-height:1.35}",
      ".rpal-verdict.v-red{background:" + t.verdictRedBg + ";border-color:" + t.verdictRedBorder + "}",
      ".rpal-verdict.v-red .rpal-verdict-label{color:" + t.verdictRedText + "}",
      ".rpal-verdict.v-green{background:" + t.verdictGreenBg + ";border-color:" + t.verdictGreenBorder + "}",
      ".rpal-verdict.v-green .rpal-verdict-label{color:" + t.verdictGreenText + "}",
      ".rpal-verdict.v-yellow{background:" + t.verdictYellowBg + ";border-color:" + t.verdictYellowBorder + "}",
      ".rpal-verdict.v-yellow .rpal-verdict-label{color:" + t.verdictYellowText + "}",
      ".rpal-reasoning-toggle{cursor:pointer;display:flex;align-items:center;gap:clamp(8px,1vw,14px);padding:clamp(10px,1.2vw,16px) clamp(12px,1.4vw,20px);background:" + t.panelCard + ";border-radius:clamp(10px,1vw,14px);border:1px solid " + t.border + ";font-size:clamp(11px,1.15vw,15px);font-weight:600;color:" + t.text + ";user-select:none;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease;width:100%;box-sizing:border-box}",
      ".rpal-reasoning-toggle:hover{background:" + t.cardMuted + ";border-color:" + t.primaryLight + ";box-shadow:0 2px 12px " + (t.isDark ? "rgba(0,0,0,.3)" : "rgba(30,58,138,.08)") + "}",
      ".rpal-reasoning-toggle svg{transition:transform .2s ease;flex-shrink:0}",
      ".rpal-reasoning-toggle.open svg{transform:rotate(90deg)}",
      ".rpal-btn-close{padding:clamp(10px,1.1vw,16px) clamp(18px,2.2vw,32px)!important;max-width:240px!important;font-size:clamp(12px,1.15vw,16px)!important;font-weight:600!important}",
      ".rpal-reasoning-list{list-style:none;margin:clamp(8px,1vw,14px) 0 0;padding:0 0 0 clamp(18px,2.2vw,30px);border-left:3px solid " + t.primary + "}",
      ".rpal-reasoning-list li{margin:clamp(5px,0.7vw,10px) 0;font-size:clamp(11px,1.15vw,15px);color:" + t.text + ";line-height:1.55}",
      ".rpal-reasoning-list li strong{font-weight:700;color:" + t.primary + "}",
      ".rpal-bot-estimate{margin-top:0;padding:clamp(10px,1.2vw,16px) clamp(12px,1.4vw,20px);background:" + t.panelCard + ";border-radius:clamp(10px,1vw,14px);font-size:clamp(11px,1.15vw,15px);color:" + t.sub + ";border:1px solid " + t.border + "}",
      ".rpal-bot-estimate strong{color:" + t.green + ";font-weight:700}",
      ".rpal-bot-estimate.rpal-bot-estimate-negative strong{color:" + t.red + "}",
      ".rpal-remaining{font-size:clamp(10px,1vw,14px);color:" + t.sub + "!important;opacity:.92}",
    ].join("");
    s.textContent = css;
    document.head.appendChild(s);
  }

  function createModal() {
    ensureTradeModalFonts();
    var t = getTheme();
    injectStyles(t);
    var old = document.getElementById(ANALYZE_MODAL_ID);
    if (old) old.remove();
    var backdrop = document.createElement("div");
    backdrop.id = ANALYZE_MODAL_ID;
    Object.assign(backdrop.style, { position: "fixed", inset: "0", backgroundColor: t.backdrop, zIndex: "9999", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" });
    var modal = document.createElement("div");
    modal.className = "rpal-modal";
    modal.setAttribute("role", "document");
    Object.assign(modal.style, { fontFamily: t.fontStack });
    var header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      padding: "clamp(12px, 1.6vw, 20px) clamp(16px, 2.2vw, 28px)",
      borderBottom: "none",
      position: "relative",
      minHeight: "clamp(48px, 5.5vh, 68px)",
      flexShrink: "0",
      background: "linear-gradient(135deg, " + t.headerFrom + " 0%, " + t.headerTo + " 55%, #3b82f6 100%)",
      boxShadow: "0 4px 24px rgba(30, 58, 138, 0.35)",
    });
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,.92)" stroke-width="2" stroke-linecap="round"/></svg>';
    Object.assign(closeBtn.style, { border: "none", background: "transparent", cursor: "pointer", padding: "clamp(6px, 0.8vw, 12px)", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", left: "clamp(10px, 1.5vw, 18px)", top: "50%", transform: "translateY(-50%)" });
    var titleWrap = document.createElement("div");
    Object.assign(titleWrap.style, { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" });
    var title = document.createElement("h4");
    title.textContent = "Trade analysis";
    Object.assign(title.style, { margin: "0", fontSize: "clamp(16px, 1.6vw, 24px)", fontWeight: "800", letterSpacing: "-0.03em", color: "#ffffff" });
    var sub = document.createElement("div");
    sub.textContent = "RoBud · Rolimons values";
    Object.assign(sub.style, { margin: "4px 0 0", fontSize: "clamp(11px, 1.05vw, 14px)", fontWeight: "500", color: "rgba(255,255,255,0.88)" });
    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);
    header.append(closeBtn, titleWrap);
    var body = document.createElement("div");
    Object.assign(body.style, { flex: "1", minHeight: "0", display: "flex", flexDirection: "column", overflow: "hidden" });
    var footer = document.createElement("div");
    Object.assign(footer.style, { padding: "clamp(12px, 1.6vw, 20px) clamp(16px, 2.2vw, 28px)", borderTop: "1px solid " + t.border, display: "flex", justifyContent: "center", flexShrink: "0", background: t.footerBg });
    var footerBtn = document.createElement("button");
    footerBtn.type = "button";
    footerBtn.className = "rpal-btn-close";
    footerBtn.textContent = "Close";
    Object.assign(footerBtn.style, {
      width: "auto",
      maxWidth: "clamp(180px, 16vw, 260px)",
      padding: "clamp(10px, 1.1vw, 16px) clamp(22px, 2.8vw, 40px)",
      borderRadius: "clamp(10px, 1.1vw, 14px)",
      border: "none",
      background: "linear-gradient(180deg, " + t.primaryLight + " 0%, " + t.primary + " 100%)",
      color: "#fff",
      cursor: "pointer",
      fontSize: "clamp(12px, 1.2vw, 17px)",
      fontWeight: "600",
      boxShadow: "0 4px 16px rgba(30, 64, 175, 0.35)",
    });
    footer.appendChild(footerBtn);
    modal.append(header, body, footer);
    backdrop.appendChild(modal);
    function close() { backdrop.remove(); }
    closeBtn.addEventListener("click", close);
    footerBtn.addEventListener("click", close);
    backdrop.addEventListener("click", function(e) { if (e.target === backdrop) close(); });
    document.body.appendChild(backdrop);
    return { content: body, theme: t, close: close };
  }

  function showLoading(el, theme) {
    var tm = theme || getTheme();
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.minHeight = "0";
    el.innerHTML = '<div style="text-align:center;padding:clamp(32px,5vw,56px) 0"><div class="rpal-spinner"></div><p style="margin:12px 0 0;font-size:clamp(14px,1.35vw,19px);font-weight:600;color:' + tm.loadingPrimary + '">Crunching values\u2026</p><p style="margin:6px 0 0;font-size:clamp(12px,1.1vw,15px);color:' + tm.loadingSub + '">Matching items to Rolimons</p></div>';
  }

  function showError(el, msg, t) {
    el.style.alignItems = "";
    el.style.justifyContent = "";
    el.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = msg;
    Object.assign(p.style, { color: (t && t.red) || "#e74c3c", fontSize: "clamp(13px,1.3vw,18px)", textAlign: "center", margin: "clamp(10px,1.5vw,18px) 0" });
    el.appendChild(p);
  }

  function fmtValue(v) {
    if (v == null) return "?";
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1000) return (v / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeHtmlAttr(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderBold(text) {
    var escaped = escapeHtml(text);
    return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  function saveToRecentAnalyses(data) {
    try {
      var giveTotal = (data.giveTotal || 0) + (data.giveRobux || 0);
      var receiveTotal = (data.receiveTotal || 0) + (data.receiveRobux || 0);
      var giveLabel = (data.give || []).slice(0, 2).map(function (i) { return i.name || "?"; }).join(", ");
      if ((data.give || []).length > 2) giveLabel += " +" + ((data.give || []).length - 2);
      var receiveLabel = (data.receive || []).slice(0, 2).map(function (i) { return i.name || "?"; }).join(", ");
      if ((data.receive || []).length > 2) receiveLabel += " +" + ((data.receive || []).length - 2);
      if (data.giveRobux > 0) giveLabel = (giveLabel ? giveLabel + ", " : "") + fmtValue(data.giveRobux) + " R$";
      if (data.receiveRobux > 0) receiveLabel = (receiveLabel ? receiveLabel + ", " : "") + fmtValue(data.receiveRobux) + " R$";
      var entry = { timestamp: Date.now(), verdict: data.verdict || "yellow", giveTotal: giveTotal, receiveTotal: receiveTotal, giveLabel: giveLabel || "—", receiveLabel: receiveLabel || "—" };
      chrome.storage.local.get([RECENT_ANALYSES_KEY], function (stored) {
        var list = (stored && stored[RECENT_ANALYSES_KEY]) || [];
        if (!Array.isArray(list)) list = [];
        list.unshift(entry);
        list = list.slice(0, MAX_RECENT_ANALYSES);
        chrome.storage.local.set({ [RECENT_ANALYSES_KEY]: list }, function () {});
      });
    } catch (_e) {}
  }

  function buildItemsSection(label, items, total, robux, pageThumbs, hideLabel) {
    var wrap = document.createElement("div");
    wrap.className = "rpal-items-section";
    if (label && !hideLabel) {
      var lbl = document.createElement("div");
      lbl.className = "rpal-section-label";
      lbl.textContent = label;
      wrap.appendChild(lbl);
    }
    var grid = document.createElement("div");
    grid.className = "rpal-items-grid";
    items.forEach(function(item, i) {
      var card = document.createElement("div");
      card.className = "rpal-item-card";
      var img = document.createElement("img");
      var pageThumb = pageThumbs && pageThumbs[i] ? pageThumbs[i] : null;
      img.src = pageThumb || item.thumbnail || "";
      img.alt = item.name;
      if (!img.src) img.style.visibility = "hidden";
      var name = document.createElement("div");
      name.className = "rpal-item-name";
      name.textContent = item.name;
      name.title = item.name;
      var val = document.createElement("div");
      val.className = "rpal-item-value";
      val.textContent = item.value != null ? fmtValue(item.value) : "N/A";
      card.append(img, name, val);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    if (robux && robux > 0) {
      var robuxSub = document.createElement("div");
      robuxSub.className = "rpal-robux-subsection";
      robuxSub.textContent = "Robux: " + (robux >= 1000 ? (robux / 1000).toFixed(1).replace(/\.0$/, "") + "K" : robux) + " R$";
      wrap.appendChild(robuxSub);
    }
    var tot = document.createElement("div");
    tot.className = "rpal-total";
    tot.textContent = "Total Value: " + fmtValue(total) + (robux > 0 ? " + " + (robux >= 1000 ? (robux / 1000).toFixed(1).replace(/\.0$/, "") + "K" : robux) + " R$" : "");
    wrap.appendChild(tot);
    return wrap;
  }

  function buildVerdict(verdict) {
    var level = verdict || "yellow";
    var wrap = document.createElement("div");
    wrap.className = "rpal-verdict v-" + level;
    var icon = document.createElement("div");
    icon.className = "rpal-verdict-icon";
    icon.innerHTML = ICONS[level] || ICONS.yellow;
    wrap.appendChild(icon);
    var lbl = document.createElement("div");
    lbl.className = "rpal-verdict-label";
    if (level === "green") lbl.textContent = "Good trade \u2014 advised for acceptance.";
    else if (level === "red") lbl.textContent = "It is advised that you do not take this trade.";
    else lbl.textContent = "This trade is fair \u2014 use your judgment.";
    wrap.appendChild(lbl);
    return wrap;
  }

  function buildReasoningDropdown(reasoning, hasVerdict, verdictLevel) {
    if (!hasVerdict) return null;
    var wrap = document.createElement("div");
    wrap.style.marginTop = "12px";
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rpal-reasoning-toggle";
    var reasoningLabel = verdictLevel === "yellow" ? "Why? Show reasoning" : "Reasoning";
    toggle.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg><span>' + reasoningLabel + '</span>';
    var list = document.createElement("ul");
    list.className = "rpal-reasoning-list";
    list.style.display = "none";
    if (reasoning && reasoning.length > 0) {
      reasoning.forEach(function(item) {
        var li = document.createElement("li");
        li.innerHTML = renderBold(item);
        list.appendChild(li);
      });
    } else {
      var li = document.createElement("li");
      li.textContent = "No reasoning provided.";
      li.style.opacity = "0.8";
      list.appendChild(li);
    }
    toggle.addEventListener("click", function() {
      list.style.display = list.style.display === "none" ? "block" : "none";
      toggle.classList.toggle("open", list.style.display !== "none");
    });
    wrap.appendChild(toggle);
    wrap.appendChild(list);
    return wrap;
  }

  function generateTradeImage(data, giveThumbs, receiveThumbs) {
    return getServerUrl().then(function (baseUrl) {
    var c = document.createElement("canvas");
    c.width = 560; c.height = 580;
    var ctx = c.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    var t = getTheme();
    var giveItems = data.give || [];
    var recvItems = data.receive || [];
    var giveThumbsArr = giveThumbs || [];
    var recvThumbsArr = receiveThumbs || [];
    var cols = 4, slotW = 68, slotH = 92;
    function pickImageUrl(item, pageThumb) {
      var id = (item && (item.assetId || item.id)) || null;
      if (id) return baseUrl + "/api/thumbnail?assetId=" + id;
      if (pageThumb) return pageThumb;
      if (item && item.thumbnail) return item.thumbnail;
      return null;
    }
    function drawSlot(x, y, item, img) {
      ctx.fillStyle = t.border || "#3a3a3c";
      ctx.strokeRect(x, y, 64, 64);
      if (img) { try { ctx.drawImage(img, x, y, 64, 64); } catch (_e) {} }
      ctx.fillStyle = t.text || "#e0e0e0";
      ctx.font = "11px sans-serif";
      ctx.fillText((item && item.name || "?").slice(0, 10), x, y + 66);
      if (item && item.value != null) ctx.fillText(fmtValue(item.value), x, y + 80);
    }
    function drawRobuxSlot(x, y, robux) {
      ctx.fillStyle = t.border || "#3a3a3c";
      ctx.strokeRect(x, y, 64, 64);
      ctx.fillStyle = t.green || "#00b06f";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("R$", x + 32, y + 38);
      ctx.textAlign = "left";
      ctx.fillStyle = t.text || "#e0e0e0";
      ctx.font = "11px sans-serif";
      ctx.fillText("Robux", x, y + 66);
      ctx.fillText(fmtValue(robux), x, y + 80);
    }
    var allUrls = [];
    for (var i = 0; i < Math.min(giveItems.length, 8); i++) {
      var u = pickImageUrl(giveItems[i], giveThumbsArr[i]);
      if (u) allUrls.push({ url: u, type: "give", i: i });
    }
    for (var j = 0; j < Math.min(recvItems.length, 8); j++) {
      var u2 = pickImageUrl(recvItems[j], recvThumbsArr[j]);
      if (u2) allUrls.push({ url: u2, type: "recv", i: j });
    }
    var loadPromises = allUrls.length ? allUrls.map(function (o) { return loadImage(o.url).then(function (img) { return { o: o, img: img }; }); }) : [Promise.resolve()];
    return Promise.all(loadPromises).then(function (loaded) {
      var imgMap = {};
      (loaded || []).forEach(function (x) { if (x && x.o) { imgMap[x.o.type + "_" + x.o.i] = x.img; } });
      ctx.fillStyle = t.bg || "#232527";
      ctx.fillRect(0, 0, 560, 580);
      ctx.fillStyle = t.text || "#e0e0e0";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Trade", 280, 26);
      ctx.font = "13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = t.sub || "#a0a0a0";
      ctx.fillText("Give:", 20, 48);
      var y = 60;
      var giveCount = Math.min(giveItems.length, 8);
      var hasGiveRobux = (data.giveRobux || 0) > 0;
      for (var i2 = 0; i2 < giveCount; i2++) {
        var col = i2 % cols, row = Math.floor(i2 / cols);
        drawSlot(20 + col * (slotW + 10), y + row * (slotH + 6), giveItems[i2], imgMap["give_" + i2]);
      }
      if (hasGiveRobux) {
        var idx = giveCount, col2 = idx % cols, row2 = Math.floor(idx / cols);
        drawRobuxSlot(20 + col2 * (slotW + 10), y + row2 * (slotH + 6), data.giveRobux || 0);
        giveCount++;
      }
      var giveRows = Math.ceil(giveCount / cols);
      var giveH = giveRows * (slotH + 6) + 20;
      ctx.fillStyle = t.sub || "#a0a0a0";
      ctx.fillText("Receive:", 20, 50 + giveH);
      y = 62 + giveH;
      var recvCount = Math.min(recvItems.length, 8);
      var hasRecvRobux = (data.receiveRobux || 0) > 0;
      for (var j2 = 0; j2 < recvCount; j2++) {
        var col3 = j2 % cols, row3 = Math.floor(j2 / cols);
        drawSlot(20 + col3 * (slotW + 10), y + row3 * (slotH + 6), recvItems[j2], imgMap["recv_" + j2]);
      }
      if (hasRecvRobux) {
        var idx2 = recvCount, col4 = idx2 % cols, row4 = Math.floor(idx2 / cols);
        drawRobuxSlot(20 + col4 * (slotW + 10), y + row4 * (slotH + 6), data.receiveRobux || 0);
        recvCount++;
      }
      var recvRows = Math.ceil(recvCount / cols);
      var botY = y + recvRows * (slotH + 6) + 24;
      ctx.strokeStyle = t.border || "#3a3a3c";
      ctx.beginPath(); ctx.moveTo(20, botY - 12); ctx.lineTo(540, botY - 12); ctx.stroke();
      var giveSum = (data.giveTotal || 0) + (data.giveRobux || 0);
      var recvSum = (data.receiveTotal || 0) + (data.receiveRobux || 0);
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = t.text || "#e0e0e0";
      ctx.textAlign = "center";
      ctx.fillText("Give: " + fmtValue(giveSum) + "  |  Receive: " + fmtValue(recvSum) + " (Rolimons)", 280, botY + 12);
      try { return c.toDataURL("image/png"); } catch (_e) { return null; }
    });
    });
  }

  function renderResult(el, data, giveThumbs, receiveThumbs, theme) {
    el.style.alignItems = "";
    el.style.justifyContent = "";
    el.innerHTML = "";
    var inner = document.createElement("div");
    inner.className = "rpal-body-inner";
    var root = document.createElement("div");
    root.className = "rpal-layout-root";

    var verdictEl = buildVerdict(data.verdict);
    verdictEl.classList.add("rpal-verdict-hero");
    root.appendChild(verdictEl);

    var giveSum = (data.giveTotal || 0) + (data.giveRobux || 0);
    var recvSum = (data.receiveTotal || 0) + (data.receiveRobux || 0);
    var strip = document.createElement("div");
    strip.className = "rpal-totals-strip";
    strip.innerHTML =
      '<div class="rpal-total-pill"><span class="rpal-pill-k">You give (total)</span><span class="rpal-pill-v">' + escapeHtml(fmtValue(giveSum)) + '</span></div>' +
      '<div class="rpal-total-pill rpal-pill-recv"><span class="rpal-pill-k">You receive (total)</span><span class="rpal-pill-v">' + escapeHtml(fmtValue(recvSum)) + '</span></div>';
    root.appendChild(strip);

    var split = document.createElement("div");
    split.className = "rpal-trade-split";
    split.id = "rpal-trade-cards-wrap";

    var colGive = document.createElement("div");
    colGive.className = "rpal-trade-col rpal-trade-col-give";
    var headGive = document.createElement("div");
    headGive.className = "rpal-col-head";
    headGive.textContent = "Your offer";
    colGive.appendChild(headGive);
    colGive.appendChild(buildItemsSection("", data.give, data.giveTotal, data.giveRobux, giveThumbs, true));

    var colRecv = document.createElement("div");
    colRecv.className = "rpal-trade-col rpal-trade-col-recv";
    var headRecv = document.createElement("div");
    headRecv.className = "rpal-col-head";
    headRecv.textContent = "Their offer";
    colRecv.appendChild(headRecv);
    colRecv.appendChild(buildItemsSection("", data.receive, data.receiveTotal, data.receiveRobux, receiveThumbs, true));

    split.appendChild(colGive);
    split.appendChild(colRecv);
    root.appendChild(split);

    var extras = document.createElement("div");
    extras.className = "rpal-extras-stack";
    var reasoningEl = buildReasoningDropdown(data.reasoning, data.verdict != null, data.verdict || "yellow");
    if (reasoningEl) extras.appendChild(reasoningEl);
    if (data.botValueEstimate) {
      var est = document.createElement("div");
      var val = data.botValueEstimate.trim();
      var isNegative = val.startsWith("-");
      est.className = "rpal-bot-estimate" + (isNegative ? " rpal-bot-estimate-negative" : "");
      est.innerHTML = "Value delta (bot): <strong>" + escapeHtml(val) + "</strong>";
      extras.appendChild(est);
    }
    var askRealBtn = document.createElement("a");
    askRealBtn.href = DISCORD_INVITE_URL;
    askRealBtn.target = "_blank";
    askRealBtn.rel = "noopener noreferrer";
    askRealBtn.className = "rpal-reasoning-toggle";
    askRealBtn.textContent = "Discuss on Discord (RoBud)";
    askRealBtn.style.textDecoration = "none";
    askRealBtn.style.textAlign = "center";
    askRealBtn.style.justifyContent = "center";
    extras.appendChild(askRealBtn);
    if (typeof data.remainingChecks === "number" && !data.isPremium) {
      var remEl = document.createElement("div");
      remEl.className = "rpal-remaining";
      remEl.style.cssText = "text-align:center;font-size:11px;color:" + (theme && theme.sub ? theme.sub : "#64748b") + ";";
      remEl.textContent = data.remainingChecks + " free analyses left today.";
      extras.appendChild(remEl);
    }
    root.appendChild(extras);
    inner.appendChild(root);
    el.appendChild(inner);
  }

  function getTradeRowScope(buttonEl) {
    if (!buttonEl || !buttonEl.parentElement) return null;
    var node = buttonEl.parentElement;
    while (node && node !== document.body) {
      var headings = node.querySelectorAll("h1,h2,h3,h4,h5,h6,.section-header,.text-subheader");
      for (var i = 0; i < headings.length; i++) {
        var t = (headings[i].textContent || "").toLowerCase();
        if (t.indexOf("items you will give") !== -1 || t.indexOf("items you will receive") !== -1) return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function findSectionContainer(headingText, scopeRoot) {
    var lower = headingText.toLowerCase();
    var root = scopeRoot || document;
    var candidates = root.querySelectorAll("h1,h2,h3,h4,h5,h6,.section-header,.text-subheader");
    var match = null;
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].textContent && candidates[i].textContent.toLowerCase().indexOf(lower) !== -1) { match = candidates[i]; break; }
    }
    if (!match) return null;
    var container = match.parentElement;
    while (container && container !== document.body) {
      if (container.children && container.children.length > 1) break;
      container = container.parentElement;
    }
    return container;
  }

  function extractItemsFromSection(headingText, scopeRoot) {
    var container = findSectionContainer(headingText, scopeRoot);
    if (!container) return { items: [], thumbs: [] };
    var items = [], thumbs = [];
    container.querySelectorAll(".item-card-name").forEach(function(el) {
      var name = el.textContent.trim();
      if (!name) return;
      var id = null, thumb = null;
      var card = el.closest(".item-card-container") || el.closest(".item-card") || el.parentElement;
      if (card) {
        // Roblox's bundle system can make the /catalog link id differ from the internal "target id".
        // The thumbnail-target-id is generally the most reliable id to use for backend lookups.
        var thumbTargetEl = card.querySelector("thumbnail-2d[thumbnail-target-id], [thumbnail-target-id]");
        if (thumbTargetEl) {
          var tidRaw = thumbTargetEl.getAttribute("thumbnail-target-id");
          if (tidRaw) {
            var tid = parseInt(String(tidRaw).replace(/\D/g, ""), 10);
            if (!isNaN(tid) && tid > 0) id = String(tid);
          }
        }
        var linkEl = card.querySelector('a[href*="/catalog/"]');
        if (!id && linkEl) { var m = linkEl.href.match(/\/catalog\/(\d+)/); if (m) id = m[1]; }
        var imgEl = card.querySelector("img");
        if (imgEl && imgEl.src) thumb = imgEl.src;
      }
      items.push({ name: name, id: id });
      thumbs.push(thumb);
    });
    return { items: items, thumbs: thumbs };
  }

  function isCounterPage() { try { return /\/trades\/[^/]+\/counter/.test(window.location.pathname || ""); } catch (_e) { return false; } }
  function isUserTradePage() { try { return /\/users\/\d+\/trade\/?$/.test((window.location.pathname || "").replace(/\/$/, "")); } catch (_e) { return false; } }
  function isTradePageWithMakeOffer() { return isCounterPage() || isUserTradePage(); }

  function extractItemsFromCounterOffer(offerPanel) {
    var items = [], thumbs = [];
    offerPanel.querySelectorAll(".trade-request-item[data-collectibleiteminstanceid]").forEach(function(el) {
      // Bundle system can change item links from `/catalog/...` to `/bundles/...`.
      // Prefer extracting the name from the UI label instead of relying on URL path.
      var nameEl =
        el.querySelector(".text-lead.item-name") ||
        el.querySelector(".item-name") ||
        el.querySelector(".trade-request-item .item-name a") ||
        el.querySelector(".trade-request-item a[href*='/catalog/']") ||
        el.querySelector(".trade-request-item a[href*='/bundles/']");
      var name = nameEl ? (nameEl.textContent || "").trim() : "";
      if (!name) return;
      var id = null;
      // Prefer thumbnail-target-id to be resilient to the bundle wrapper system.
      var thumbTargetEl = el.querySelector("thumbnail-2d[thumbnail-target-id], [thumbnail-target-id]");
      if (thumbTargetEl) {
        var tidRaw = thumbTargetEl.getAttribute("thumbnail-target-id");
        if (tidRaw) {
          var tid = parseInt(String(tidRaw).replace(/\D/g, ""), 10);
          if (!isNaN(tid) && tid > 0) id = String(tid);
        }
      }
      // If thumbnail-target-id is missing, fall back to catalog/bundles URL id.
      if (!id) {
        var fallbackLink =
          el.querySelector('a[href*="/catalog/"]') || el.querySelector('a[href*="/bundles/"]');
        if (fallbackLink && fallbackLink.href) {
          var m = fallbackLink.href.match(/\/(catalog|bundles)\/(\d+)/);
          if (m && m[2]) id = m[2];
        }
      }
      var value = null;
      var valEl = el.querySelector(".item-value .text-robux, .text-robux");
      if (valEl) { var n = parseInt(valEl.textContent.replace(/\D/g, ""), 10); if (!isNaN(n)) value = n; }
      var imgEl = el.querySelector("img[src]");
      items.push({ name: name, id: id, value: value });
      thumbs.push(imgEl && imgEl.src ? imgEl.src : null);
    });
    return { items: items, thumbs: thumbs };
  }

  function extractRobuxFromCounterOffer(offerPanel) {
    var rawRobux = 0;
    var afterTaxRobux = 0;
    
    var inputEl = offerPanel.querySelector('input[name="robux"]');
    if (inputEl) {
      var rawStr = String(inputEl.value || inputEl.getAttribute("value") || "").replace(/\D/g, "");
      if (rawStr) {
        var n = parseInt(rawStr, 10);
        if (!isNaN(n) && n > 0) rawRobux = n;
      }
    }
    
    var robuxLines = offerPanel.querySelectorAll(".robux-line");
    for (var i = 0; i < robuxLines.length; i++) {
      var line = robuxLines[i];
      var lineText = (line.textContent || "").toLowerCase();
      if (lineText.indexOf("after") !== -1 && lineText.indexOf("fee") !== -1) {
        var valSpan = line.querySelector(".robux-line-value");
        if (valSpan) {
          var n2 = parseInt((valSpan.textContent || "").replace(/\D/g, ""), 10);
          if (!isNaN(n2) && n2 > 0) {
            afterTaxRobux = n2;
            break;
          }
        }
      }
    }
    if (rawRobux > 0 && afterTaxRobux === 0) afterTaxRobux = Math.floor(rawRobux * 0.7);
    if (afterTaxRobux > 0 && rawRobux === 0) rawRobux = Math.ceil(afterTaxRobux / 0.7);
    
    return { plusRobux: afterTaxRobux, plusRobuxRaw: rawRobux };
  }

  function extractTradeDataFromCounterPage() {
    var offers = document.querySelectorAll(".trade-request-window-offer");
    var giveData = { items: [], thumbs: [] }, receiveData = { items: [], thumbs: [] };
    var giveRobux = 0, receiveRobux = 0;
    offers.forEach(function(panel) {
      var h2 = panel.querySelector("h2");
      var label = (h2 && h2.textContent || "").toLowerCase();
      var extracted = extractItemsFromCounterOffer(panel);
      var rb = extractRobuxFromCounterOffer(panel);
      if (label.indexOf("your offer") !== -1) {
        giveData = extracted;
        giveRobux = rb.plusRobux;
      } else if (label.indexOf("your request") !== -1) {
        receiveData = extracted;
        receiveRobux = rb.plusRobux;
      }
    });
    return {
      giveData: giveData,
      receiveData: receiveData,
      giveRobux: giveRobux,
      receiveRobux: receiveRobux,
    };
  }

  function parseRobuxFromElement(el) {
    if (!el) return 0;
    var text = (el.value != null ? String(el.value) : (el.textContent || "")).replace(/\D/g, "");
    if (!text) return 0;
    var n = parseInt(text, 10);
    return Number.isFinite(n) ? n : 0;
  }

  /** Roblox trade detail: "Robux Offered (After … fee)" amount only (post-tax). Ignores Total Value lines. */
  function extractRobuxOfferedAfterFeeFromSection(headingText, scopeRoot) {
    var container = findSectionContainer(headingText, scopeRoot);
    if (!container) return 0;
    var lines = container.querySelectorAll(".robux-line");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var txt = (line.textContent || "").replace(/\s+/g, " ").toLowerCase();
      if (txt.indexOf("total value") !== -1) continue;
      var isOfferedLine = txt.indexOf("robux offered") !== -1 || (txt.indexOf("after") !== -1 && txt.indexOf("fee") !== -1);
      if (!isOfferedLine) continue;
      var valEl = line.querySelector(".robux-line-amount .robux-line-value");
      if (!valEl || valEl.closest(".item-card-container, .item-card")) continue;
      return Math.max(0, parseRobuxFromElement(valEl));
    }
    return 0;
  }

  function extractRobuxFromSection(headingText, scopeRoot) {
    var container = findSectionContainer(headingText, scopeRoot);
    if (!container) return { afterTax: 0, raw: 0 };
    var afterTax = 0;
    var raw = 0;
    
    var inputRobux = container.querySelector('input[name="robux"]') || container.querySelector('[class*="robux"] input[type="number"]') || container.querySelector('[class*="robux"] input');
    if (inputRobux) {
      var n3 = parseRobuxFromElement(inputRobux);
      if (n3 > raw) raw = n3;
    }
    
    var textLabelRobux = container.querySelector('.robux-line .text-label.robux-line-value');
    if (textLabelRobux) {
      var n = parseRobuxFromElement(textLabelRobux);
      if (n > afterTax) afterTax = n;
    }
    var afterFeeRobux = container.querySelector('.robux-line .robux-line-amount .text-secondary.robux-line-value')
      || container.querySelector('.robux-line-amount .robux-line-value')
      || container.querySelector('[class*="robux-line"] .robux-line-value');
    if (afterFeeRobux) {
      var n2 = parseRobuxFromElement(afterFeeRobux);
      if (n2 > afterTax) afterTax = n2;
    }
    
    if (afterTax === 0) {
      var robuxLineValues = container.querySelectorAll(".robux-line .robux-line-value, [class*='robux'] [class*='value']");
      for (var i = 0; i < robuxLineValues.length; i++) {
        var el = robuxLineValues[i];
        if (el.closest(".item-card-container, .item-card, [class*='item-card']")) continue;
        var n4 = parseRobuxFromElement(el);
        if (n4 > afterTax) afterTax = n4;
      }
    }
    
    if (afterTax === 0 && raw === 0) {
      var robuxCandidates = container.querySelectorAll("[class*='robux'], [class*='Robux']");
      for (var j = 0; j < robuxCandidates.length; j++) {
        var cand = robuxCandidates[j];
        if (cand.closest(".item-card-container, .item-card")) continue;
        var parsed = parseRobuxFromElement(cand);
        if (parsed > 0) {
          if (cand.querySelector('input')) raw = Math.max(raw, parsed);
          else afterTax = Math.max(afterTax, parsed);
        }
      }
    }
    if (afterTax === 0 && raw === 0) {
      container.querySelectorAll(".robux-line, [class*='robux-line']").forEach(function (line) {
        var lineLower = (line.textContent || "").toLowerCase();
        line.querySelectorAll(".robux-line-value, .text-robux, span").forEach(function (el) {
          if (el.closest(".item-card-container, .item-card")) return;
          var n = parseRobuxFromElement(el);
          if (!n) return;
          if (lineLower.indexOf("after") !== -1 || lineLower.indexOf("fee") !== -1) afterTax = Math.max(afterTax, n);
          else if (lineLower.indexOf("robux") !== -1) raw = Math.max(raw, n);
        });
      });
    }
    
    if (afterTax > 0 && raw === 0) raw = Math.ceil(afterTax / 0.7);
    if (raw > 0 && afterTax === 0) afterTax = Math.floor(raw * 0.7);
    
    return { afterTax: afterTax, raw: raw };
  }

  function getTradeIdFromPage(scopeOrNull, buttonEl) {
    try {
      if (!scopeOrNull) { 
        var m = (window.location.pathname || "").match(/\/trades\/(\d+)/); 
        if (m) {
          console.log("[TradeAnalyze] Found trade ID in URL:", m[1]);
          return m[1];
        }
      } else {
        var link = scopeOrNull.querySelector('a[href*="/trades/"]');
        if (link) {
          var m2 = (link.getAttribute("href") || "").match(/\/trades\/(\d+)/);
          if (m2) {
            console.log("[TradeAnalyze] Found trade ID in link:", m2[1]);
            return m2[1];
          }
        }
      }
      
      if (_inboundTrades.length > 0) {
        var rowIndex = getSelectedTradeIndex();
        if (rowIndex < 0 && buttonEl) {
          rowIndex = getTradeRowIndex(buttonEl);
        }
        console.log("[TradeAnalyze] Row index:", rowIndex, "Inbound trades available:", _inboundTrades.length);
        if (rowIndex >= 0) {
          var inboundId = getTradeIdFromInboundList(rowIndex);
          if (inboundId) {
            console.log("[TradeAnalyze] Found trade ID from inbound list:", inboundId);
            return inboundId;
          }
        }
      }
      
      if (_lastTradeId) {
        console.log("[TradeAnalyze] Using _lastTradeId as fallback:", _lastTradeId);
        return _lastTradeId;
      }
      
      return null;
    } catch (_) { return null; }
  }

  function fetchTradeRobuxFromApi(tradeId, robloxUserId) {
    if (!tradeId || !robloxUserId) return Promise.resolve(null);
    var myId = String(robloxUserId);
    console.log("[TradeAnalyze] Fetching trade data from API for trade:", tradeId, "myId:", myId);
    
    return fetch("https://trades.roblox.com/v1/trades/" + tradeId, { method: "GET", credentials: "include", headers: { "Accept": "application/json" } })
      .then(function (r) { 
        console.log("[TradeAnalyze] API response status:", r.status);
        if (!r.ok) return null; 
        return r.json(); 
      })
      .then(function (data) {
        if (!data) return null;
        console.log("[TradeAnalyze] Trade API response:", JSON.stringify(data, null, 2));
        
        if (data.offers && Array.isArray(data.offers)) {
          var myOffer = null;
          var theirOffer = null;
          
          for (var i = 0; i < data.offers.length; i++) {
            var offer = data.offers[i];
            var offerUserId = offer.user && offer.user.id != null ? String(offer.user.id) : null;
            console.log("[TradeAnalyze] Offer", i, "- userId:", offerUserId, "robux:", offer.robux);
            
            if (offerUserId === myId) {
              myOffer = offer;
            } else {
              theirOffer = offer;
            }
          }
          
          var giveRobuxRaw = myOffer && typeof myOffer.robux === "number" ? Math.max(0, myOffer.robux) : 0;
          var receiveRobuxRaw = theirOffer && typeof theirOffer.robux === "number" ? Math.max(0, theirOffer.robux) : 0;
          
          var giveRobuxAfterTax = Math.floor(giveRobuxRaw * 0.7);
          var receiveRobuxAfterTax = Math.floor(receiveRobuxRaw * 0.7);
          
          console.log("[TradeAnalyze] Raw robux - GIVE:", giveRobuxRaw, "RECEIVE:", receiveRobuxRaw);
          console.log("[TradeAnalyze] After 30% tax - GIVE:", giveRobuxAfterTax, "RECEIVE:", receiveRobuxAfterTax);
          return { 
            giveRobux: giveRobuxAfterTax, 
            receiveRobux: receiveRobuxAfterTax,
            giveRobuxRaw: giveRobuxRaw,
            receiveRobuxRaw: receiveRobuxRaw
          };
        }
        
        var a = data.participantAOffer, b = data.participantBOffer;
        if (!a || !b) return null;
        function uid(p) { return p && p.user && p.user.id != null ? String(p.user.id) : null; }
        function robux(p) { return p && typeof p.robux === "number" && !isNaN(p.robux) ? Math.max(0, p.robux) : 0; }
        var idA = uid(a), idB = uid(b);
        var ourOffer = (idA === myId ? a : null) || (idB === myId ? b : null);
        var theirOffer = (idA === myId ? b : null) || (idB === myId ? a : null);
        var giveRobuxRawFallback = robux(ourOffer);
        var receiveRobuxRawFallback = robux(theirOffer);
        return { 
          giveRobux: Math.floor(giveRobuxRawFallback * 0.7), 
          receiveRobux: Math.floor(receiveRobuxRawFallback * 0.7),
          giveRobuxRaw: giveRobuxRawFallback,
          receiveRobuxRaw: receiveRobuxRawFallback
        };
      }).catch(function (e) { 
        console.log("[TradeAnalyze] API fetch error:", e);
        return null; 
      });
  }

  async function handleAnalyzeClick(evt) {
    if (!document.body) return;
    var modal = createModal();
    showLoading(modal.content, modal.theme);
    var robloxUser = getRobloxUser();
    if (!robloxUser.userId && _usr.userId) robloxUser = _usr;
    
    try {
      var authUser = await fetchRobloxUser();
      if (authUser.userId) robloxUser = authUser;
    } catch (_e) {}
    
    var hasCounterDom = document.querySelectorAll(".trade-request-window-offer").length > 0;
    var scope = null;
    var clickedBtn = evt && evt.target && evt.target.classList && evt.target.classList.contains(ANALYZE_BUTTON_CLASS) ? evt.target : null;
    if (!hasCounterDom) {
      if (clickedBtn) scope = getTradeRowScope(clickedBtn);
    }
    
    var tradeId = getTradeIdFromPage(hasCounterDom ? null : scope, clickedBtn);
    
    var giveData, receiveData;
    var giveRobux = 0, receiveRobux = 0;
    if (hasCounterDom) {
      var counter = extractTradeDataFromCounterPage();
      giveData = counter.giveData;
      receiveData = counter.receiveData;
      giveRobux = counter.giveRobux;
      receiveRobux = counter.receiveRobux;
    } else {
      giveData = extractItemsFromSection("Items you will give", scope);
      receiveData = extractItemsFromSection("Items you will receive", scope);
      giveRobux = extractRobuxOfferedAfterFeeFromSection("Items you will give", scope);
      receiveRobux = extractRobuxOfferedAfterFeeFromSection("Items you will receive", scope);
    }
    
    console.log("[TradeAnalyze] === ANALYZE TRADE CLICKED ===");
    console.log("[TradeAnalyze] Trade ID:", tradeId);
    console.log("[TradeAnalyze] Robux after fee (give / receive):", giveRobux, receiveRobux);
    // Avoid calling /tradecheck when a side is effectively empty.
    // If a side has neither items nor Robux, skip.
    if (
      (giveData.items.length === 0 && (giveRobux || 0) <= 0) ||
      (receiveData.items.length === 0 && (receiveRobux || 0) <= 0)
    ) {
      modal.content.style.alignItems = "";
      modal.content.style.justifyContent = "";
      modal.content.innerHTML = '<div style="padding:clamp(20px,3vw,40px)"><p style="margin:0 0 clamp(10px,1.5vw,18px);color:' + (modal.theme.red || "#e74c3c") + ';font-size:clamp(13px,1.4vw,20px);">Add items or Robux on each side</p><p style="margin:0;font-size:clamp(12px,1.2vw,17px);color:' + (modal.theme.sub || "#a0a0a0") + ';line-height:1.5;"><strong>How to use:</strong></p><ul style="margin:clamp(8px,1vw,16px) 0 0;padding-left:clamp(16px,2vw,28px);font-size:clamp(12px,1.2vw,17px);color:' + (modal.theme.sub || "#a0a0a0") + ';line-height:1.65;"><li>On <strong>Inbound</strong> or <strong>Outbound</strong> trades: expand a trade row first, then click Analyze Trade.</li><li>On a <strong>counter-offer</strong> page: each side needs at least one item or some Robux.</li></ul></div>';
      return;
    }
    try {
      var baseUrl = await getServerUrl();
      var res = await fetch(baseUrl + "/tradecheck", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        body: JSON.stringify({ give: giveData.items, receive: receiveData.items, giveRobux: giveRobux, receiveRobux: receiveRobux, engine: "v3.1", clientId: getClientId(), robloxUsername: robloxUser.username, robloxUserId: robloxUser.userId, tradeId: tradeId || undefined })
      });
      var data;
      try { data = await res.json(); } catch (_) { data = {}; }
      if (!res.ok) {
        var errMsg = (data && (data.message || data.error)) || ("Request failed: " + res.status);
        if (res.status === 401) errMsg = "Server returned unauthorized. Please try again later.";
        if (res.status === 429 && data.remainingChecks === 0) errMsg = "Daily limit reached. Upgrade to Gold or Diamond for more checks.";
        showError(modal.content, errMsg, modal.theme);
        return;
      }
      if (!data.success) { showError(modal.content, (data && data.message) || "Something went wrong.", modal.theme); return; }
      data.giveRobux = giveRobux;
      data.receiveRobux = receiveRobux;
      renderResult(modal.content, data, giveData.thumbs, receiveData.thumbs, modal.theme);
      saveToRecentAnalyses(data);
    } catch (_e) {
      showError(modal.content, "Could not reach the server. Please try again later.", modal.theme);
    }
  }

  function insertAnalyzeButtonOnCounterPage() {
    if (!isTradePageWithMakeOffer()) return;
    var makeOffer = document.querySelector('button[ng-click="sendTrade()"], button.btn-cta-md.btn-full-width');
    if (!makeOffer || !makeOffer.textContent || makeOffer.textContent.toLowerCase().indexOf("make") === -1) return;
    var parent = makeOffer.parentElement;
    if (!parent || parent.querySelector("." + ANALYZE_BUTTON_CLASS)) return;
    var inboundBtn = document.querySelector('button.btn-control-md.ng-binding[ng-click^="declineTrade"]');
    var btnClasses = inboundBtn ? inboundBtn.className + " " + ANALYZE_BUTTON_CLASS : "btn-control-md btn-full-width ng-binding " + ANALYZE_BUTTON_CLASS;
    var ab = document.createElement("button");
    ab.type = "button";
    ab.textContent = "Analyze Trade";
    ab.className = btnClasses.replace(/\s+/g, " ").trim();
    ab.style.marginTop = "8px";
    ab.addEventListener("click", function (e) { handleAnalyzeClick(e); });
    parent.insertBefore(ab, makeOffer.nextSibling);
  }

  function addAnalyzeAfterButton(btn) {
    var parent = btn.parentElement;
    if (!parent || parent.querySelector("." + ANALYZE_BUTTON_CLASS)) return;
    var ab = document.createElement("button");
    ab.type = "button";
    ab.textContent = "Analyze Trade";
    ab.className = (btn.className || "").trim() + " " + ANALYZE_BUTTON_CLASS;
    var st = btn.getAttribute("style");
    if (st) ab.setAttribute("style", st);
    ab.style.marginLeft = "4px";
    ab.style.marginTop = (btn.style && btn.style.marginTop) || "0";
    ab.addEventListener("click", function (e) { handleAnalyzeClick(e); });
    parent.insertBefore(ab, btn.nextSibling);
  }

  function insertAnalyzeButtonAfterDeclineOrWithdraw() {
    var path = (window.location.pathname || "").toLowerCase();
    if (path.indexOf("/trades") === -1) return;
    var seen = new Set();
    document.querySelectorAll("button.btn-control-md, button[ng-click]").forEach(function (btn) {
      if (btn && btn.classList && btn.classList.contains("ng-hide")) return; // don't attach to hidden ng templates
      var text = (btn.textContent || "").trim().toLowerCase();
      var ngShow = (btn.getAttribute("ng-show") || "").toLowerCase();
      var ngClick = btn.getAttribute("ng-click") || "";
      var isDeclineTrade = ngClick.indexOf("declineTrade") !== -1;
      var isDeclineText = text.indexOf("decline") !== -1;
      var isWithdrawText = text === "withdraw" || (text.indexOf("withdraw") !== -1);
      if (isDeclineTrade || isDeclineText) { if (!seen.has(btn)) { seen.add(btn); addAnalyzeAfterButton(btn); } return; }
      if (isWithdrawText) { if (!seen.has(btn)) { seen.add(btn); addAnalyzeAfterButton(btn); } }
    });
    document.querySelectorAll("button").forEach(function (btn) {
      if (btn && btn.classList && btn.classList.contains("ng-hide")) return;
      var text = (btn.textContent || "").trim().toLowerCase();
      if (text.indexOf("decline") === -1 && text.indexOf("withdraw") === -1) return;
      var parent = btn.parentElement;
      if (!parent || parent.querySelector("." + ANALYZE_BUTTON_CLASS)) return;
      if (seen.has(btn)) return;
      seen.add(btn);
      addAnalyzeAfterButton(btn);
    });
  }

  function insertAnalyzeTradeButtons() {
    insertAnalyzeButtonOnCounterPage();
    insertAnalyzeButtonAfterDeclineOrWithdraw();
  }

  (function runRegisterOnLoad() {
    var fromDom = getRobloxUser();
    if (fromDom.userId) registerWithServer(fromDom);
    fetchRobloxUser().then(function (roblox) {
      if (roblox && roblox.userId) registerWithServer(roblox);
    });
  })();
})();
