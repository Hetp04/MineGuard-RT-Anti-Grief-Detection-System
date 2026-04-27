//= require action_cable
//= require_self

// MineGuard premium dashboard JS — ActionCable consumer + Chart.js wiring +
// live stat / table / feed / toast updates + connection indicator.
(function () {
  if (!window.ActionCable) return;

  // -------- Connection indicator --------
  var consumer = ActionCable.createConsumer();
  var connEl = document.getElementById("conn-indicator");
  function setConn(state, label) {
    if (!connEl) return;
    connEl.classList.remove("online", "offline");
    if (state) connEl.classList.add(state);
    var lbl = connEl.querySelector(".conn-label");
    if (lbl) lbl.textContent = label;
  }

  consumer.subscriptions.create({ channel: "DashboardChannel" }, {
    connected:    function () { setConn("online", "live · connected"); },
    disconnected: function () { setConn("offline", "reconnecting…"); },
    rejected:     function () { setConn("offline", "rejected"); },
    received: function (data) {
      switch (data.type) {
        case "event":  return handleEvent(data.event);
        case "player": return handlePlayer(data.player);
        case "alert":  return handleAlert(data.alert);
        case "stats":  return handleStats(data.stats);
      }
    }
  });

  // -------- Chart.js setup (only on dashboard) --------
  var charts = {};
  function initCharts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.color = "#6b6b6b";
    Chart.defaults.font.family = '"Inter", system-ui, sans-serif';
    Chart.defaults.font.size = 11;

    var tl = document.getElementById("chart-timeline");
    if (tl && window.__bootstrap && window.__bootstrap.timeline) {
      var b = window.__bootstrap.timeline;
      charts.timeline = new Chart(tl.getContext("2d"), {
        type: "line",
        data: {
          labels: b.labels,
          datasets: [{
            label: "events/min",
            data: b.data,
            borderColor: "#ececec",
            backgroundColor: "rgba(236,236,236,0.08)",
            borderWidth: 1.5,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4
          }]
        },
        options: chartOptions({ y: true })
      });
    }

    var dist = document.getElementById("chart-distribution");
    if (dist && window.__bootstrap && window.__bootstrap.distribution) {
      var d = window.__bootstrap.distribution;
      charts.distribution = new Chart(dist.getContext("2d"), {
        type: "bar",
        data: {
          labels: d.labels,
          datasets: [{
            data: d.data,
            backgroundColor: ["#22c55e88", "#eab30888", "#fb923c88", "#ef444488"],
            borderColor:     ["#22c55e",   "#eab308",   "#fb923c",   "#ef4444"],
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: chartOptions({ y: true, legend: false })
      });
    }
  }

  function chartOptions(opts) {
    opts = opts || {};
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: { display: opts.legend === undefined ? false : opts.legend },
        tooltip: {
          backgroundColor: "#171717",
          borderColor: "#2a2a2a",
          borderWidth: 1,
          titleColor: "#ececec",
          bodyColor: "#b4b4b4",
          padding: 8,
          displayColors: false
        }
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b6b6b", maxRotation: 0 } },
        y: opts.y ? { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b6b6b", precision: 0 }, beginAtZero: true } : { display: false }
      }
    };
  }

  // -------- Handlers --------
  function handleEvent(ev) {
    var feed = document.getElementById("event-feed");
    if (!feed) return;
    var li = document.createElement("li");
    var dangerous = /tnt|lava|fire/i.test(ev.action_type) || /tnt|lava|fire/i.test(ev.block_type);
    if (dangerous) li.className = "danger";
    var ts = new Date(ev.occurred_at);
    li.innerHTML =
      '<span class="ts">' + ts.toTimeString().slice(0, 8) + '</span>' +
      '<span class="who">' + esc(ev.player_name) + '</span>' +
      '<span class="what">' + esc(ev.action_type.replace(/_/g, " ")) + '</span>' +
      '<span class="block">' + esc(ev.block_type) + '</span>';
    feed.insertBefore(li, feed.firstChild);
    while (feed.children.length > 80) feed.removeChild(feed.lastChild);
  }

  function handlePlayer(p) {
    var table = document.getElementById("players-table");
    if (!table) return;
    var tbody = table.querySelector("tbody");
    var row = tbody.querySelector('tr[data-player-id="' + p.id + '"]');
    if (!row) {
      row = document.createElement("tr");
      row.setAttribute("data-player-id", p.id);
      row.innerHTML =
        '<td><span class="strong">' + esc(p.name) + '</span><div class="muted tiny mono">' + esc(p.uuid || "") + '</div></td>' +
        '<td class="num" data-score>0</td>' +
        '<td data-status></td>' +
        '<td data-last></td>' +
        '<td><a class="btn ghost" href="/players/' + p.id + '">View →</a></td>';
      tbody.insertBefore(row, tbody.firstChild);
    }
    var scoreCell  = row.querySelector("[data-score]");
    var statusCell = row.querySelector("[data-status]");
    var lastCell   = row.querySelector("[data-last]");
    scoreCell.textContent = p.risk_score;
    scoreCell.className = "num score " + p.status;
    statusCell.innerHTML = pillHTML(p.status);
    lastCell.innerHTML = '<span class="muted">' + esc((p.last_action || "").replace(/_/g, " ")) + '</span> <span class="mono tiny dim">' + esc(p.last_block || "") + '</span>';
    row.classList.remove("flash-row");
    void row.offsetWidth;
    row.classList.add("flash-row");
  }

  function handleAlert(a) {
    showToast(a);
    var alertsTable = document.getElementById("alerts-table");
    if (alertsTable) {
      var tbody = alertsTable.querySelector("tbody");
      var tr = document.createElement("tr");
      var t = new Date(a.created_at).toTimeString().slice(0, 8);
      tr.innerHTML =
        '<td class="mono muted tiny">' + t + '</td>' +
        '<td>' + pillHTML(a.severity) + '</td>' +
        '<td class="strong">' + esc(a.player_name) + '</td>' +
        '<td class="num score ' + scoreClass(a.risk_score) + '">' + a.risk_score + '</td>' +
        '<td class="muted">' + esc(a.reason_summary || "") + '</td>' +
        '<td><a class="btn ghost" href="/alerts/' + a.id + '">Open →</a></td>';
      tbody.insertBefore(tr, tbody.firstChild);
      tr.classList.add("flash-row");
    }
  }

  function handleStats(s) {
    setStat("stat-active",   s.active_players);
    setStat("stat-watching", s.watching);
    setStat("stat-alerts",   s.open_alerts);
    setStat("stat-top",      s.highest_score, scoreClass(s.highest_score));

    if (charts.timeline && s.events_per_minute) {
      charts.timeline.data.labels = s.events_per_minute.labels;
      charts.timeline.data.datasets[0].data = s.events_per_minute.data;
      charts.timeline.update("none");
    }
    if (charts.distribution && s.risk_distribution) {
      charts.distribution.data.datasets[0].data = s.risk_distribution.data;
      charts.distribution.update("none");
    }
  }

  function setStat(id, value, extraClass) {
    var el = document.getElementById(id);
    if (!el) return;
    if (String(el.textContent).trim() !== String(value)) {
      el.textContent = value;
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    }
    if (extraClass) {
      el.className = "card-value " + extraClass;
    }
  }

  // -------- Toasts --------
  function showToast(a) {
    var host = document.getElementById("toast-host");
    if (!host) return;
    var t = document.createElement("div");
    t.className = "toast " + (a.severity || "");
    t.innerHTML =
      '<div class="toast-title">' + (a.severity || "alert").toUpperCase() + ' · ' + esc(a.player_name || "") + '</div>' +
      '<div class="toast-body">' + esc(a.reason_summary || "") + '</div>';
    host.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; }, 5500);
    setTimeout(function () { t.remove(); }, 6000);
    // hard cap simultaneous toasts so a flood doesn't overwhelm
    while (host.children.length > 4) host.removeChild(host.firstChild);
  }

  // -------- helpers --------
  function pillHTML(status) {
    return '<span class="pill ' + status + '">' + status.replace(/_/g, " ") + '</span>';
  }
  function scoreClass(score) {
    if (score >= 80) return "critical";
    if (score >= 60) return "suspicious";
    if (score >= 30) return "watching";
    return "normal";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  // -------- boot --------
  document.addEventListener("DOMContentLoaded", initCharts);
})();
