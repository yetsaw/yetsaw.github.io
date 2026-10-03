/* ============================================================
   YETSAW · 前端脚本
   1) 昼夜模式：按访问者本地时区（06:00–18:00 日间）+ 手动覆盖
   2) 时钟 / 高考倒计时 / 新年倒计时 / 最近提交时间
   3) 目录自动加载：GitHub Contents API → manifest.json → 占位数据
   4) 全站检索 + 阅读面板（marked.js 渲染 Markdown）
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 0. 配置 ---------- */
  var REPO = "yetsaw/yetsaw.github.io";          // GitHub Pages 仓库
  var BRANCH = "main";                            // 如主分支为 master 请改这里
  var CACHE_TTL = 10 * 60 * 1000;                 // 目录缓存 10 分钟
  var DOC_EXTS = ["md", "markdown", "txt", "html", "pdf"];

  var SECTIONS = [
    { code: "01", title: "日札", en: "DAILY NOTES", path: "daily" },
    { code: "02", title: "匝章", en: "ESSAYS", path: "essays" },
    { code: "03", title: "研文", en: "RESEARCH", path: "research" },
    {
      code: "04", title: "诗遇 · 临仙集", en: "POETRY I", alert: false, path: "poetry/linxian",
    },
    { code: "05", title: "诗遇 · 瓷山集", en: "POETRY II", path: "poetry/cishan" },
    {
      code: "06", title: "模拟文化", en: "SIMULATED CULTURE", path: "simulation",
      children: [
        { title: "谟意民主共和国", en: "MOYI REPUBLIC", path: "simulation/moyi" },
        { title: "奎塔维亚新世界", en: "KUITAVIA", path: "simulation/kuitavia" },
        { title: "源点新世纪", en: "ORIGIN ERA", path: "simulation/yuandian" },
        { title: "集成海风集团", en: "HAIFENG GROUP", path: "simulation/haifeng" }
      ]
    },
    {
      code: "07", title: "游戏", en: "GAMES", path: "games",
      children: [
        { title: "通盘皓素 Totally White", en: "TOTALLY WHITE", path: "games/totally-white" },
        { title: "罔极沉冥 Totally Dark", en: "TOTALLY DARK", path: "games/totally-dark" },
        { title: "锦中周报 JZSH Weekly", en: "JZSH WEEKLY", path: "games/jzsh-weekly" },
        { title: "反应手册 Reaction Brochure", en: "REACTION BROCHURE", path: "games/reaction-brochure" }
      ]
    }
  ];

  /* 兜底占位：API 被限流且文件夹无 manifest.json 时展示，保证页面不空 */
  var FALLBACK = {
    "daily": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "essays": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "research": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "poetry/linxian": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "poetry/cishan": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "simulation/moyi": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "simulation/kuitavia": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "simulation/yuandian": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "simulation/haifeng": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "games/totally-white": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "games/totally-dark": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "games/jzsh-weekly": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }],
    "games/reaction-brochure": [{ name: "示例 · 欢迎条目.md", date: "迁移中" }]
  };

  var $ = function (s) { return document.querySelector(s); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  /* ---------- 1. 昼夜模式 ---------- */
  function applyTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    var ft = $("#footTheme");
    if (ft) ft.textContent = (mode === "dark" ? "NIGHT MODE · 夜间" : "DAY MODE · 日间");
  }
  function themeByClock() {
    var h = new Date().getHours();
    return (h >= 6 && h < 18) ? "light" : "dark";
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("yetsaw-theme"); } catch (e) {}
    applyTheme(saved || themeByClock());
    setInterval(function () {
      var cur = null;
      try { cur = localStorage.getItem("yetsaw-theme"); } catch (e) {}
      if (!cur) applyTheme(themeByClock());
    }, 30 * 1000);
  })();
  var tgl = $("#themeToggle");
  if (tgl) tgl.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("yetsaw-theme", next); } catch (e) {}
    applyTheme(next);
  });

  /* ---------- 2. 移动导航 ---------- */
  var burger = $("#navBurger"), nav = $("#topnav");
  if (burger && nav) burger.addEventListener("click", function () { nav.classList.toggle("open"); });

  /* ---------- 3. 时钟 ---------- */
  function tickClock() {
    var c = $("#clock"); if (!c) return;
    var d = new Date();
    c.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    var dn = $("#daynight");
    if (dn) {
      var h = d.getHours();
      dn.textContent = (h >= 6 && h < 18)
        ? "DAY · 日间 " + d.getTimezoneOffset() / -60 + "H"
        : "NIGHT · 夜间 " + d.getTimezoneOffset() / -60 + "H";
    }
  }
  tickClock(); setInterval(tickClock, 1000);

  /* ---------- 4. 倒计时看板 ---------- */
  function nextGaokao() {
    var now = new Date();
    var y = now.getFullYear();
    var g = new Date(y, 5, 7, 9, 0, 0); // 6 月 7 日 09:00
    if (now > new Date(y, 5, 9, 17, 0, 0)) g = new Date(y + 1, 5, 7, 9, 0, 0);
    return g;
  }
  function nextNewyear() {
    var now = new Date();
    return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
  }
  function fmtDiff(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    return { d: d, str: pad(h) + ":" + pad(m) + ":" + pad(s) };
  }
  function tickCountdowns() {
    var g = $("#countdownGaokao");
    if (g) {
      var gg = nextGaokao();
      var r = fmtDiff(gg - new Date());
      g.textContent = r.d + " 天 " + r.str;
      $("#gaokaoDate").textContent = "目标 " + gg.getFullYear() + "-06-07 09:00";
    }
    var n = $("#countdownNewyear");
    if (n) {
      var nn = nextNewyear();
      var r2 = fmtDiff(nn - new Date());
      n.textContent = r2.d + " 天 " + r2.str;
      $("#newyearDate").textContent = "目标 " + nn.getFullYear() + "-01-01 00:00";
    }
  }
  tickCountdowns(); setInterval(tickCountdowns, 1000);

  /* 最近提交时间（GitHub API，失败则显示本地日期） */
  (function lastCommit() {
    var el = $("#lastUpdate"); if (!el) return;
    fetch("https://api.github.com/repos/" + REPO + "/commits?per_page=1")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j[0] && j[0].commit && j[0].commit.committer) {
          var d = new Date(j[0].commit.committer.date);
          el.textContent = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
        } else { throw new Error("no commit"); }
      })
      .catch(function () {
        var d = new Date();
        el.textContent = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      });
  })();

  /* ---------- 5. 目录加载：API → manifest → 兜底 ---------- */
  var loadModeEl = $("#loadMode");

  function cacheKey(p) { return "yetsaw-dir-" + p; }
  function readCache(p) {
    try {
      var raw = localStorage.getItem(cacheKey(p));
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > CACHE_TTL) return null;
      return o.items;
    } catch (e) { return null; }
  }
  function writeCache(p, items) {
    try { localStorage.setItem(cacheKey(p), JSON.stringify({ t: Date.now(), items: items })); } catch (e) {}
  }

  function fromApi(p) {
    return fetch("https://api.github.com/repos/" + REPO + "/contents/" + p + "?ref=" + BRANCH)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (!Array.isArray(j)) throw new Error("not a dir");
        return j.filter(function (f) {
          if (f.type !== "file") return false;
          var ext = f.name.split(".").pop().toLowerCase();
          return DOC_EXTS.indexOf(ext) >= 0 && f.name.toLowerCase() !== "manifest.json";
        }).map(function (f) {
          return { name: f.name, date: (f.sha || "").slice(0, 7), url: f.download_url || (p + "/" + f.name) };
        });
      });
  }
  function fromManifest(p) {
    return fetch(p + "/manifest.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (!Array.isArray(j)) throw new Error("bad manifest");
        return j.map(function (it) {
          return { name: it.name, date: it.date || "", url: it.url || (p + "/" + (it.file || it.name)) };
        });
      });
  }
  function loadDir(p) {
    var c = readCache(p);
    if (c) return Promise.resolve({ items: c, mode: "cache" });
    return fromApi(p)
      .then(function (items) { writeCache(p, items); return { items: items, mode: "api" }; })
      .catch(function () {
        return fromManifest(p).then(function (items) { writeCache(p, items); return { items: items, mode: "manifest" }; });
      })
      .catch(function () {
        return { items: FALLBACK[p] || [], mode: "fallback" };
      });
  }

  /* ---------- 6. 渲染目录 ---------- */
  var ALL_ENTRIES = []; // {section, sub, item} 供检索

  function renderSections() {
    var root = $("#sectionsRoot"); if (!root) return;
    SECTIONS.forEach(function (sec) {
      var el = document.createElement("section");
      el.className = "section" + (sec.alert ? " section--alert" : "");
      el.id = "sec-" + sec.code;

      var head = document.createElement("div");
      head.className = "section-head";
      head.innerHTML =
        '<span class="section-code">' + sec.code + '</span>' +
        '<h3 class="section-title">' + sec.title + '</h3>' +
        '<span class="section-en">' + sec.en + '</span>' +
        '<span class="section-caret">▶</span>';
      head.addEventListener("click", function () { el.classList.toggle("open"); });
      el.appendChild(head);

      var body = document.createElement("div");
      body.className = "section-body";
      el.appendChild(body);
      root.appendChild(el);

      if (sec.children) {
        sec.children.forEach(function (sub) { body.appendChild(renderSubsec(sec, sub)); });
      } else {
        body.appendChild(renderSubsec(sec, { title: null, path: sec.path }));
      }
    });
  }

  function renderSubsec(sec, sub) {
    var wrap = document.createElement("div");
    wrap.className = "subsec";

    var head = document.createElement("div");
    head.className = "subsec-head";
    head.innerHTML = (sub.title
      ? "<span>" + sub.title + '</span><span class="mono" style="font-size:.68rem;opacity:.6;letter-spacing:.18em">' + sub.en + "</span>"
      : '<span class="mono" style="font-size:.8rem;letter-spacing:.14em">条目 · ENTRIES</span>')
      + '<span class="subsec-caret">▶</span>';
    wrap.appendChild(head);

    var body = document.createElement("div");
    body.className = "subsec-body";
    var ul = document.createElement("ul");
    ul.className = "entry-list";
    var loading = document.createElement("li");
    loading.className = "entry-empty";
    loading.textContent = "装载中…";
    ul.appendChild(loading);
    body.appendChild(ul);
    wrap.appendChild(body);

    head.addEventListener("click", function (ev) {
      ev.stopPropagation();
      wrap.classList.toggle("open");
      if (!wrap.dataset.loaded) { wrap.dataset.loaded = "1"; fillList(ul, sub.path, sec, sub); }
    });
    return wrap;
  }

  function fillList(ul, path, sec, sub) {
    loadDir(path).then(function (res) {
      if (loadModeEl) {
        var label = { api: "API 实时目录", manifest: "manifest.json 目录", cache: "缓存目录", fallback: "占位数据" }[res.mode];
        loadModeEl.textContent = "目录源 · " + label;
      }
      ul.innerHTML = "";
      if (!res.items.length) {
        var li = document.createElement("li");
        li.className = "entry-empty";
        li.textContent = "此分区暂无条目。";
        ul.appendChild(li);
        return;
      }
      res.items.forEach(function (it) {
        var li = document.createElement("li");
        li.className = "entry";
        li.dataset.name = it.name.toLowerCase();
        li.dataset.section = sec.title;
        li.dataset.sub = sub.title || "";
        li.innerHTML = '<span class="entry-dot"></span>' +
          '<span class="entry-name"></span>' +
          (it.date ? '<span class="entry-date">' + it.date + "</span>" : "");
        li.querySelector(".entry-name").textContent = it.name;
        li.addEventListener("click", function () { openReader(it, sec, sub); });
        ul.appendChild(li);
        ALL_ENTRIES.push({ el: li, name: it.name, sec: sec.title, sub: sub.title || "" });
      });
      updateTotal();
    });
  }

  function updateTotal() {
    var t = $("#entryTotal"); if (!t) return;
    var n = ALL_ENTRIES.length;
    t.textContent = n + " ENTRIES · 已装载条目";
  }

  /* ---------- 7. 阅读面板 ---------- */
  var reader = $("#reader");
  function openReader(item, sec, sub) {
    if (!reader) return;
    $("#readerPath").textContent = (sub.title ? sec.title + " / " + sub.title : sec.title) + " / " + item.name;
    var body = $("#readerBody");
    body.innerHTML = '<p class="mono" style="color:var(--muted);letter-spacing:.2em">LOADING…</p>';
    reader.hidden = false;
    document.body.style.overflow = "hidden";

    var ext = item.name.split(".").pop().toLowerCase();
    if (ext === "pdf") {
      body.innerHTML = '<p style="margin:2em 0">PDF 文件，请在浏览器中直接查看：</p>' +
        '<p><a class="textlink" href="' + item.url + '" target="_blank" rel="noopener">' + item.url + "</a></p>";
      return;
    }
    fetch(item.url)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        if ((ext === "md" || ext === "markdown") && window.marked) {
          body.innerHTML = window.marked.parse(text);
        } else if (ext === "html") {
          body.innerHTML = '<p class="mono" style="color:var(--muted);margin-bottom:1em">HTML 文档 · 在新窗口打开：</p><p><a class="textlink" href="' + item.url + '" target="_blank" rel="noopener">' + item.url + "</a></p>";
        } else {
          body.innerHTML = "<pre></pre>";
          body.querySelector("pre").textContent = text;
        }
      })
      .catch(function () {
        body.innerHTML = '<p>无法装载该文件。若为外部链接，请直接访问：<br><a class="textlink" href="' + item.url + '" target="_blank" rel="noopener">' + item.url + "</a></p>";
      });
  }
  function closeReader() {
    if (!reader) return;
    reader.hidden = true;
    document.body.style.overflow = "";
  }
  var rc = $("#readerClose");
  if (rc) rc.addEventListener("click", closeReader);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReader(); });

  /* ---------- 8. 检索 ---------- */
  var searchBox = $("#searchBox");
  if (searchBox) searchBox.addEventListener("input", function () {
    var q = searchBox.value.trim().toLowerCase();
    var count = 0;
    if (!q) {
      ALL_ENTRIES.forEach(function (en) {
        en.el.classList.remove("hidden-by-search");
        en.el.querySelector(".entry-name").textContent = en.name;
      });
      $("#searchCount").textContent = "";
      return;
    }
    ALL_ENTRIES.forEach(function (en) {
      var hit = (en.name + " " + en.sec + " " + en.sub).toLowerCase().indexOf(q) >= 0;
      en.el.classList.toggle("hidden-by-search", !hit);
      if (hit) {
        count++;
        var nameEl = en.el.querySelector(".entry-name");
        nameEl.innerHTML = "";
        var frag = document.createDocumentFragment();
        var lower = en.name.toLowerCase(), idx = 0, pos;
        while ((pos = lower.indexOf(q, idx)) >= 0) {
          frag.appendChild(document.createTextNode(en.name.slice(idx, pos)));
          var m = document.createElement("mark");
          m.textContent = en.name.slice(pos, pos + q.length);
          frag.appendChild(m);
          idx = pos + q.length;
        }
        frag.appendChild(document.createTextNode(en.name.slice(idx)));
        nameEl.appendChild(frag);
      } else {
        en.el.querySelector(".entry-name").textContent = en.name;
      }
    });
    var sc = $("#searchCount");
    sc.textContent = count + " 条命中";
    sc.style.color = count ? "var(--accent)" : "var(--alert)";
  });

  /* ---------- 9. 启动 ---------- */
  if (document.body.dataset.page === "home") {
    renderSections();
    // 默认展开前两个分区，便于首屏浏览
    var first = document.querySelector(".section");
    if (first) first.classList.add("open");
  }
})();
