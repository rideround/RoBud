(function () {
  const DEFAULT_SERVER_URL = "https://ropal-production.up.railway.app";
  const SERVER_URL_KEY = "rpal_server_url";
  const CLIENT_ID_KEY = "rpal_client_id";

  const theserverhost = new Set([
    "ropal-production.up.railway.app",
    "getrobud.com",
    "www.getrobud.com",
    "localhost",
    "127.0.0.1",
  ]);

  function normalizeServerUrl(raw) {
    let fallback;
    try {
      fallback = new URL(DEFAULT_SERVER_URL).origin;
    } catch (_e) {
      fallback = DEFAULT_SERVER_URL.replace(/\/$/, "");
    }
    try {
      const s = raw == null ? "" : String(raw).trim();
      if (s === "") return fallback;
      const t = s.replace(/\/$/, "");
      const url = new URL(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(t) ? t : "https://" + t);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1"))) return fallback;
      if (!theserverhost.has(url.hostname)) return fallback;
      url.hash = "";
      url.search = "";
      return url.origin;
    } catch (_e2) {
      return fallback;
    }
  }
  const ROBLOX_USER_KEY = "rpal_roblox_user";
  const RECENT_ANALYSES_KEY = "rpal_recent_analyses";
  const TRADE_AD_STATE_KEY = "rpal_trade_ad_state";
  const ROLIMONS_ITEMDETAILS = "https://api.rolimons.com/items/v2/itemdetails";
  const ROLIMONS_TRADEAD_POST = "https://api.rolimons.com/tradeads/v1/createad";
  const AUTO_POST_INTERVAL_MS = 20 * 60 * 1000;
  const DISCORD_INVITE_URL = "https://discord.gg/robud";

  const recentList = document.getElementById("recent-list");

  var rolimonsItems = null;
  var tradeAdTimer = null;

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function fmtValue(v) {
    if (v == null) return "?";
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(2).replace(/\.?0+$/, "") + "K";
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function renderRecent(list) {
    recentList.innerHTML = "";
    if (!list || !list.length) return;
    list.forEach(function (entry) {
      const li = document.createElement("li");
      li.className = "recent-item";
      const dot = document.createElement("span");
      dot.className = "recent-dot " + (entry.verdict || "yellow");
      const body = document.createElement("div");
      body.className = "recent-body";
      const summary = document.createElement("div");
      summary.className = "recent-summary";
      summary.textContent = (entry.giveLabel || "—") + " → " + (entry.receiveLabel || "—");
      const meta = document.createElement("div");
      meta.className = "recent-meta";
      meta.textContent = fmtValue(entry.giveTotal) + " → " + fmtValue(entry.receiveTotal) + " · " + timeAgo(entry.timestamp);
      body.appendChild(summary);
      body.appendChild(meta);
      li.appendChild(dot);
      li.appendChild(body);
      recentList.appendChild(li);
    });
  }

  function loadRecent() {
    chrome.storage.local.get([RECENT_ANALYSES_KEY], function (stored) {
      const list = (stored && stored[RECENT_ANALYSES_KEY]) || [];
      renderRecent(Array.isArray(list) ? list : []);
    });
  }

  function escapeAttr(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  /** Only https (or http on localhost). Rejects javascript:, data:, etc. */
  function safeUrlForHref(s, fallback) {
    if (s == null || String(s).trim() === "") return fallback;
    try {
      const u = new URL(String(s).trim());
      if (u.protocol === "https:") return u.href;
      if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return u.href;
      return fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function renderAllPlanCards(data, state) {
    var container = document.getElementById("all-plan-cards");
    if (!container) return;
    var goldUrl = safeUrlForHref((data && data.gamepassUrlGold) || "", "");
    var diamondUrl = safeUrlForHref((data && data.gamepassUrlDiamond) || "", "");
    var discordUrl = safeUrlForHref((data && data.discordInvite) || "", DISCORD_INVITE_URL);
    var footerDiscord = document.getElementById("footer-discord");
    if (footerDiscord) footerDiscord.href = discordUrl;
    var footerDiscordSubs = document.getElementById("footer-discord-subs");
    if (footerDiscordSubs) footerDiscordSubs.href = discordUrl;

    var current = null;
    var freeRemaining = 0;
    var freeLimit = 10;
    var goldUsed = 0;
    var goldLimit = 600;
    var diamondUsed = 0;
    var diamondLimit = 1600;
    var timeLeftHtml = "";
    var expiresAt = null;
    var isLifetime = false;

    if (state === "ok" && data) {
      if (data.premium === true || data.isPremium === true) {
        current = (data.tier || "gold").toLowerCase();
        if (current === "gold") {
          goldUsed = typeof data.usedThisMonth === "number" ? data.usedThisMonth : 0;
          goldLimit = typeof data.limitPerMonth === "number" ? data.limitPerMonth : 600;
        } else {
          diamondUsed = typeof data.usedThisMonth === "number" ? data.usedThisMonth : 0;
          diamondLimit = typeof data.limitPerMonth === "number" ? data.limitPerMonth : 1600;
        }
        isLifetime = data.isLifetime === true;
        expiresAt = data.expiresAt;
        if (isLifetime) timeLeftHtml = "✨ Lifetime";
        else if (expiresAt) {
          var exp = new Date(expiresAt);
          var now = new Date();
          var ms = exp - now;
          var d = Math.floor(ms / (24 * 60 * 60 * 1000));
          var h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          timeLeftHtml = (d > 0 ? d + "d " : "") + h + "h left · Expires " + exp.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        } else if (typeof data.daysRemaining === "number") {
          timeLeftHtml = data.daysRemaining + " days left";
        }
      } else {
        current = "free";
        freeRemaining = typeof data.remainingChecks === "number" ? data.remainingChecks : data.limitPerDay || 10;
        freeLimit = typeof data.limitPerDay === "number" ? data.limitPerDay : 10;
      }
    } else if (state === "loading") {
      current = "free";
      freeRemaining = "—";
      freeLimit = 10;
    } else if (state === "err") {
      current = null;
    }

    [ "free", "gold", "diamond" ].forEach(function (plan) {
      var card = document.getElementById("plan-" + plan);
      if (!card) return;
      card.classList.remove("current");
      if (plan === current) card.classList.add("current");

      var usageEl = document.getElementById("plan-" + plan + "-usage");
      var timeEl = document.getElementById("plan-" + plan + "-time");
      var ctaEl = document.getElementById("plan-" + plan + "-cta");
      if (!usageEl || !ctaEl) return;

      if (plan === "free") {
        if (state === "err") {
          usageEl.textContent = "Couldn't connect";
          usageEl.style.display = "";
          ctaEl.innerHTML = "<span style=\"font-size:11px;color:var(--red);\">Try again later</span>";
        } else {
          usageEl.textContent = current === "free" ? (state === "loading" ? "Checking..." : freeRemaining + " / " + freeLimit + " today") : "—";
          usageEl.style.display = "";
          ctaEl.innerHTML = "";
          /* Premium status is shown on the Gold/Diamond cards; keep Free row uncluttered */
        }
        if (timeEl) timeEl.style.display = "none";
        return;
      }

      if (plan === "gold") {
        if (current === "gold") {
          usageEl.textContent = goldUsed + " / " + goldLimit + " this month";
          usageEl.style.display = "";
          if (timeEl) { timeEl.textContent = timeLeftHtml; timeEl.style.display = ""; }
          ctaEl.innerHTML = "";
        } else {
          usageEl.style.display = "none";
          if (timeEl) timeEl.style.display = "none";
          ctaEl.innerHTML = "";
          if (current === "free" && (goldUrl || discordUrl)) {
            ctaEl.innerHTML = (goldUrl ? '<a href="' + escapeAttr(goldUrl) + '" target="_blank" rel="noopener" class="plan-upgrade-single btn-robux">Gold 1 mo (2,000 R$)</a>' : "") +
              (goldUrl && discordUrl ? " " : "") +
              '<a href="' + escapeAttr(DISCORD_INVITE_URL) + '" target="_blank" rel="noopener" class="plan-upgrade-single btn-discord">Buy with USD</a>';
          } else if (current === "diamond") {
            ctaEl.innerHTML = "<span style=\"font-size:11px;color:var(--text-dim);\">You're on Diamond</span>";
          }
        }
        return;
      }

      if (plan === "diamond") {
        if (current === "diamond") {
          usageEl.textContent = diamondUsed + " / " + diamondLimit + " this month";
          usageEl.style.display = "";
          if (timeEl) { timeEl.textContent = timeLeftHtml; timeEl.style.display = ""; }
          ctaEl.innerHTML = "";
        } else {
          usageEl.style.display = "none";
          if (timeEl) timeEl.style.display = "none";
          ctaEl.innerHTML = "";
          if (current === "free" || current === "gold") {
            ctaEl.innerHTML = (diamondUrl ? '<a href="' + escapeAttr(diamondUrl) + '" target="_blank" rel="noopener" class="plan-upgrade-single btn-robux">Diamond 1 mo (3,500 R$)</a>' : "") +
              (diamondUrl && discordUrl ? " " : "") +
              '<a href="' + escapeAttr(DISCORD_INVITE_URL) + '" target="_blank" rel="noopener" class="plan-upgrade-single btn-discord">Buy with USD</a>';
          }
        }
      }
    });

    var summaryEl = document.getElementById("status-summary");
    if (summaryEl) {
      if (state === "loading") {
        summaryEl.innerHTML = "Checking your plan...";
        summaryEl.style.display = "block";
      } else if (state === "err") {
        summaryEl.innerHTML = "Couldn't connect. <a href=\"#\" onclick=\"location.reload(); return false;\">Retry</a>";
        summaryEl.style.display = "block";
      } else if (current === "free") {
        summaryEl.innerHTML = "<strong>Free</strong> · " + (typeof freeRemaining === "number" ? freeRemaining + " / " + freeLimit + " checks today" : freeRemaining) + ". <a href=\"#\" data-tab=\"subscriptions\">View plans</a>";
        summaryEl.style.display = "block";
      } else if (current === "gold") {
        summaryEl.innerHTML = "<strong>Gold</strong> · " + goldUsed + " / " + goldLimit + " this month" + (timeLeftHtml ? " · " + timeLeftHtml : "") + ". <a href=\"#\" data-tab=\"subscriptions\">Manage</a>";
        summaryEl.style.display = "block";
      } else if (current === "diamond") {
        summaryEl.innerHTML = "<strong>Diamond</strong> · " + diamondUsed + " / " + diamondLimit + " this month" + (timeLeftHtml ? " · " + timeLeftHtml : "") + ". <a href=\"#\" data-tab=\"subscriptions\">Manage</a>";
        summaryEl.style.display = "block";
      } else {
        summaryEl.innerHTML = "Your plan · <a href=\"#\" data-tab=\"subscriptions\">View plans</a>";
        summaryEl.style.display = "block";
      }
    }
  }

  function getServerUrl(cb) {
    chrome.storage.local.get([SERVER_URL_KEY], function (r) {
      var stored = r && r[SERVER_URL_KEY];
      var raw = stored != null && String(stored).trim() !== "" ? stored : DEFAULT_SERVER_URL;
      cb(normalizeServerUrl(raw));
    });
  }

  function run() {
    loadRecent();
    renderAllPlanCards(null, "loading");
    chrome.storage.local.get([CLIENT_ID_KEY, ROBLOX_USER_KEY], function (stored) {
      const clientId = stored && stored[CLIENT_ID_KEY];
      const robloxUser = stored && stored[ROBLOX_USER_KEY];
      const robloxUserId = robloxUser && robloxUser.userId;

      if (!robloxUserId) {
        renderAllPlanCards(
          { gamepassUrlGold: "", gamepassUrlDiamond: "", discordInvite: DISCORD_INVITE_URL },
          "ok"
        );
        var usageEl = document.getElementById("plan-free-usage");
        var ctaEl = document.getElementById("plan-free-cta");
        if (usageEl) usageEl.textContent = "Connect to see usage";
        if (ctaEl) ctaEl.innerHTML = "<span style=\"font-size:11px;color:var(--text-dim);\">Open a Roblox trade page to connect</span>";
        var summaryEl = document.getElementById("status-summary");
        if (summaryEl) summaryEl.innerHTML = "Connect your account · Open a Roblox trade page, then <a href=\"#\" data-tab=\"subscriptions\">view plans</a>.";
        return;
      }

      getServerUrl(function (baseUrl) {
        var url = baseUrl + "/api/extension/premium?robloxUserId=" + encodeURIComponent(robloxUserId);
        if (clientId) url += "&clientId=" + encodeURIComponent(clientId);

        fetch(url, { method: "GET", credentials: "omit" })
        .then(function (r) {
          return r.json().catch(function () { return {}; });
        })
        .then(function (data) {
          renderAllPlanCards(data, "ok");
        })
        .catch(function () {
          renderAllPlanCards(null, "err");
        });
      });
    });
  }

  function switchToTab(tabId) {
    var tabBtn = document.querySelector(".tab[data-tab=\"" + tabId + "\"]");
    if (tabBtn) {
      document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      tabBtn.classList.add("active");
      var panel = document.getElementById("panel-" + tabId);
      if (panel) panel.classList.add("active");
    }
  }

  function initTabs() {
    document.querySelectorAll(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchToTab(btn.getAttribute("data-tab"));
      });
    });
    document.addEventListener("click", function (e) {
      var link = e.target && e.target.closest ? e.target.closest("a[data-tab]") : null;
      if (link && link.getAttribute("data-tab")) {
        e.preventDefault();
        switchToTab(link.getAttribute("data-tab"));
      }
    });
  }

  function loadRolimonsItems() {
    return fetch(ROLIMONS_ITEMDETAILS, { credentials: "omit" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.items) {
          rolimonsItems = [];
          Object.entries(data.items).forEach(function (entry) {
            var id = entry[0];
            var arr = entry[1];
            rolimonsItems.push({ id: id, name: (arr[0] || "").trim(), acronym: (arr[1] || "").trim() });
          });
          return rolimonsItems;
        }
        return [];
      })
      .catch(function () { return []; });
  }

  function renderTradeAdTags(containerId, items, side) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = "";
    (items || []).forEach(function (item, i) {
      var tag = document.createElement("span");
      tag.className = "trade-ad-tag";
      tag.textContent = item.name || item.id;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "\u00D7";
      btn.setAttribute("aria-label", "Remove");
      btn.addEventListener("click", function () {
        var state = getTradeAdState();
        if (side === "offering") state.offering.splice(i, 1);
        else state.seeking.splice(i, 1);
        saveTradeAdState(state);
        renderTradeAdTags(containerId, side === "offering" ? state.offering : state.seeking, side);
      });
      tag.appendChild(btn);
      el.appendChild(tag);
    });
  }

  function getTradeAdState() {
    var s = window._tradeAdState || { offering: [], seeking: [], autoPost: false };
    return { offering: (s.offering || []).slice(), seeking: (s.seeking || []).slice(), autoPost: !!s.autoPost };
  }

  function saveTradeAdState(state) {
    window._tradeAdState = state;
    chrome.storage.local.set({ [TRADE_AD_STATE_KEY]: state });
  }

  function showTradeAdMsg(text, isError) {
    var el = document.getElementById("trade-ad-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "trade-ad-msg" + (isError ? " error" : text ? " ok" : "");
  }

  function postTradeAdOnRolimons(offering, seeking, cb) {
    chrome.storage.local.get([ROBLOX_USER_KEY], function (stored) {
      var robloxUser = stored && stored[ROBLOX_USER_KEY];
      var robloxId = robloxUser && robloxUser.userId != null ? parseInt(robloxUser.userId, 10) : null;
      if (robloxId == null || isNaN(robloxId)) {
        cb(new Error("Open a Roblox trade page first to connect your account."));
        return;
      }
      chrome.tabs.query({ url: "*://*.rolimons.com/*" }, function (tabs) {
        if (!tabs || tabs.length === 0) {
          cb(new Error("Open Rolimons.com to post (cookies required)."));
          return;
        }
        var tabId = tabs[0].id;
        var offerIds = (offering || []).map(function (i) { return parseInt(String(i.id), 10); }).filter(function (n) { return !isNaN(n); });
        var seekIds = (seeking || []).map(function (i) { return parseInt(String(i.id), 10); }).filter(function (n) { return !isNaN(n); });
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: function (url, robloxId, offerIds, seekIds) {
            window.__rpalTradeAdResult = null;
            var body = {
              playerId: robloxId,
              offerItemIds: offerIds,
              requestItemIds: seekIds
            };
            console.log("[RPAL Trade Ad] POST", url, "body:", JSON.stringify(body));
            fetch(url, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            })
            .then(function (r) {
              var clone = r.clone();
              return r.json()
                .then(function (d) { return { ok: r.ok, status: r.status, statusText: r.statusText, data: d }; })
                .catch(function () {
                  return clone.text().then(function (text) {
                    console.error("[RPAL Trade Ad] Response", r.status, r.statusText, text);
                    return { ok: r.ok, status: r.status, statusText: r.statusText, data: text || null };
                  });
                });
            })
            .then(function (result) {
              console.log("[RPAL Trade Ad] Result", result);
              window.__rpalTradeAdResult = result;
            })
            .catch(function (e) {
              console.error("[RPAL Trade Ad] Error", e);
              window.__rpalTradeAdResult = { err: e.message };
            });
        },
        args: [ROLIMONS_TRADEAD_POST, robloxId, offerIds, seekIds]
      }, function () {
        setTimeout(function () {
          chrome.scripting.executeScript({ target: { tabId: tabId }, func: function () { return window.__rpalTradeAdResult; } }, function (results) {
            var result = (results && results[0] && results[0].result) || null;
            if (result && result.err) cb(new Error(result.err));
            else if (result && result.ok) cb(null);
            else if (result && !result.ok) {
              var msg = "Post failed: " + (result.status || "?") + " " + (result.statusText || "");
              if (result.data != null) {
                var dataStr = typeof result.data === "string" ? result.data : JSON.stringify(result.data);
                if (dataStr && dataStr.length < 200) msg += " — " + dataStr;
                else if (typeof result.data === "object" && result.data.message) msg += " — " + result.data.message;
              }
              cb(new Error(msg));
            } else cb(new Error("No response from Rolimons."));
          });
        }, 2000);
      });
    });
    });
  }

  function doPostTradeAd() {
    var state = getTradeAdState();
    if (!state.offering.length && !state.seeking.length) {
      showTradeAdMsg("Add at least one offering or seeking item.", true);
      return;
    }
    var btn = document.getElementById("trade-ad-post-now");
    if (btn) btn.disabled = true;
    showTradeAdMsg("Posting...");
    postTradeAdOnRolimons(state.offering, state.seeking, function (err) {
      if (btn) btn.disabled = false;
      if (err) showTradeAdMsg(err.message || "Post failed.", true);
      else showTradeAdMsg("Posted successfully.");
    });
  }

  function setupTradeAdAutoPost() {
    if (tradeAdTimer) clearInterval(tradeAdTimer);
    tradeAdTimer = null;
    var state = getTradeAdState();
    if (!state.autoPost) return;
    tradeAdTimer = setInterval(function () {
      var s = getTradeAdState();
      if (s.offering.length || s.seeking.length) doPostTradeAd();
    }, AUTO_POST_INTERVAL_MS);
  }

  function showSearchDropdown(inputId, dropdownId, side) {
    var input = document.getElementById(inputId);
    var dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown || !rolimonsItems) return;
    var q = (input.value || "").trim().toLowerCase();
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
    if (q.length < 2) return;
    var state = getTradeAdState();
    var existing = (side === "offering" ? state.offering : state.seeking).map(function (i) { return i.id; });
    var matches = rolimonsItems.filter(function (item) {
      if (existing.indexOf(item.id) !== -1) return false;
      var name = (item.name || "").toLowerCase();
      var ac = (item.acronym || "").toLowerCase();
      return name.indexOf(q) !== -1 || ac.indexOf(q) !== -1 || (item.id + "").indexOf(q) !== -1;
    }).slice(0, 15);
    matches.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item.name + (item.acronym ? " (" + item.acronym + ")" : "");
      li.addEventListener("click", function () {
        if (side === "offering") state.offering.push(item);
        else state.seeking.push(item);
        saveTradeAdState(state);
        renderTradeAdTags("trade-ad-offering", state.offering, "offering");
        renderTradeAdTags("trade-ad-seeking", state.seeking, "seeking");
        input.value = "";
        dropdown.style.display = "none";
      });
      dropdown.appendChild(li);
    });
    if (matches.length) dropdown.style.display = "block";
  }

  function initTradeAdTab() {
    if (!document.getElementById("trade-ad-post-now")) return;
    loadRolimonsItems();
    chrome.storage.local.get([TRADE_AD_STATE_KEY], function (stored) {
      var state = (stored && stored[TRADE_AD_STATE_KEY]) || { offering: [], seeking: [], autoPost: false };
      window._tradeAdState = state;
      renderTradeAdTags("trade-ad-offering", state.offering, "offering");
      renderTradeAdTags("trade-ad-seeking", state.seeking, "seeking");
      var autoCheck = document.getElementById("trade-ad-auto");
      if (autoCheck) {
        autoCheck.checked = !!state.autoPost;
        autoCheck.addEventListener("change", function () {
          var s = getTradeAdState();
          s.autoPost = autoCheck.checked;
          saveTradeAdState(s);
          setupTradeAdAutoPost();
        });
      }
      document.getElementById("trade-ad-post-now").addEventListener("click", doPostTradeAd);
      ["trade-ad-search-offer", "trade-ad-search-seek"].forEach(function (id, idx) {
        var input = document.getElementById(id);
        var side = idx === 0 ? "offering" : "seeking";
        var dropId = idx === 0 ? "trade-ad-dropdown-offer" : "trade-ad-dropdown-seek";
        if (input) {
          input.addEventListener("input", function () { showSearchDropdown(id, dropId, side); });
          input.addEventListener("focus", function () { showSearchDropdown(id, dropId, side); });
        }
      });
      document.getElementById("trade-ad-dropdown-offer").addEventListener("click", function (e) { e.stopPropagation(); });
      document.getElementById("trade-ad-dropdown-seek").addEventListener("click", function (e) { e.stopPropagation(); });
      setupTradeAdAutoPost();
    });
  }

  initTabs();
  run();
  initTradeAdTab();
})();
