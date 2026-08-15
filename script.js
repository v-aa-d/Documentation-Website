/*
  Shared logic for the index page and every section page.
  Each page sets `window.SITE_SECTION` (a slug from data.js SECTIONS, or
  undefined on the root index) before loading this file.
*/

(function () {
  const SECTION = window.SITE_SECTION || null;
  const PREFIX = SECTION ? "../" : "";
  let activeSection = SECTION;
  let navLinks = [];

  function buildHeader() {
    const nav = document.querySelector(".section-nav");
    const logo = document.querySelector(".logo");
    const aboutLink = document.querySelector("[data-action='about']");
    const header = document.querySelector(".site-header");
    if (logo) logo.setAttribute("href", `${PREFIX}index.html`);
    if (aboutLink) {
      aboutLink.setAttribute("href", `${PREFIX}index.html`);
    }
    if (!nav) return;

    const tooltip = document.createElement("div");
    tooltip.className = "nav-tooltip";
    if (header) header.appendChild(tooltip);

    nav.innerHTML = "";
    navLinks = SECTIONS.map((s) => {
      const a = document.createElement("a");
      a.textContent = s.label;
      a.href = `${PREFIX}${s.slug}/index.html`;
      a.dataset.section = s.slug;
      if (s.slug === SECTION) a.classList.add("is-current");
      a.addEventListener("mouseenter", () => {
        highlightRows(s.slug);
        renderParagraphs(tooltip, s.blurb);
        tooltip.style.left = `${a.offsetLeft}px`;
        tooltip.classList.add("is-visible");
        showSectionPreview(s.slug);
      });
      a.addEventListener("mouseleave", () => {
        highlightRows(activeSection);
        tooltip.classList.remove("is-visible");
        hideSectionPreview();
      });
      nav.appendChild(a);
      return a;
    });
  }

  // Pool of every image any experiment in a section has, so hovering the
  // nav title can scatter a random sample across the empty middle column.
  function getSectionImages(slug) {
    const basePath = `${PREFIX}${slug}/`;
    return EXPERIMENTS.filter((e) => e.section === slug && e.images)
      .flatMap((e) => e.images)
      .filter((src) => !isVideo(src))
      .map((src) => basePath + src);
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Approximate footprint (in % of the container) used only for collision
  // checks — doesn't need to be exact, just enough to keep images apart.
  const PREVIEW_BOX_W = 44;
  const PREVIEW_BOX_H = 46;
  const PREVIEW_TEXT_CLEARANCE = 26; // keep clear of the tooltip text up top

  function boxesOverlap(a, b) {
    return (
      a.left < b.left + PREVIEW_BOX_W &&
      b.left < a.left + PREVIEW_BOX_W &&
      a.top < b.top + PREVIEW_BOX_H &&
      b.top < a.top + PREVIEW_BOX_H
    );
  }

  function pickPreviewPosition(placed) {
    let fallback = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = {
        top: PREVIEW_TEXT_CLEARANCE + Math.random() * (95 - PREVIEW_BOX_H - PREVIEW_TEXT_CLEARANCE),
        left: Math.random() * (100 - PREVIEW_BOX_W),
      };
      if (!placed.some((p) => boxesOverlap(candidate, p))) return candidate;
      fallback = candidate;
    }
    return fallback;
  }

  function showSectionPreview(slug) {
    const container = document.querySelector(".col-empty");
    if (!container) return;
    container.innerHTML = "";
    const images = shuffle(getSectionImages(slug)).slice(0, 3);
    const placed = [];
    images.forEach((src) => {
      const pos = pickPreviewPosition(placed);
      placed.push(pos);
      const img = document.createElement("img");
      img.src = src;
      img.className = "preview-scatter";
      img.style.top = `${pos.top}%`;
      img.style.left = `${pos.left}%`;
      container.appendChild(img);
    });
  }

  function hideSectionPreview() {
    const container = document.querySelector(".col-empty");
    if (container) container.innerHTML = "";
  }

  // Updates the nav + list highlighting to reflect whichever section's
  // experiment is currently displayed in the stage (may differ from the
  // page's own SECTION when a cross-section experiment was selected).
  function setActiveSection(sectionSlug) {
    activeSection = sectionSlug;
    navLinks.forEach((a) => a.classList.toggle("is-current", a.dataset.section === sectionSlug));
    highlightRows(sectionSlug);
  }

  // Splits text on blank lines and fills a container with one <p> per
  // paragraph — shared by the About text and the nav hover tooltips.
  function renderParagraphs(container, text) {
    container.innerHTML = "";
    text.split(/\n\s*\n/).forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph.trim();
      container.appendChild(p);
    });
  }

  function highlightRows(sectionSlug) {
    document.querySelectorAll(".exp-row").forEach((row) => {
      row.classList.toggle("is-highlight", row.dataset.section === sectionSlug);
    });
  }

  function formatDate(d) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (iso) return `${iso[3]}.${iso[2]}`;
    const dmy = /^(\d{2})\.(\d{2})\.\d{2}$/.exec(d);
    if (dmy) return `${dmy[1]}.${dmy[2]}`;
    return d;
  }

  function truncateTitle(text, max = 35) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + "…";
  }

  function buildList() {
    const list = document.querySelector(".exp-list");
    if (!list) return;
    list.innerHTML = "";
    EXPERIMENTS.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "exp-row";
      row.dataset.section = entry.section;
      row.dataset.number = entry.number;
      if (entry.section === SECTION) row.classList.add("is-highlight");
      row.innerHTML = `
        <span>${entry.number}</span>
        <span title="${entry.term}">${truncateTitle(entry.term)}</span>
        <span>${formatDate(entry.date)}</span>
        <p class="exp-desc"><span class="exp-desc-type">${entry.type}</span>${entry.description || ""}</p>
      `;
      row.addEventListener("click", () => onRowClick(entry, row));
      list.appendChild(row);
    });
    highlightRows(SECTION);
  }

  function onRowClick(entry, row) {
    if (!SECTION) {
      // The home page has no stage to display into — go to the
      // experiment's own section page, already showing it.
      window.location.href = `${entry.section}/index.html?exp=${entry.number}`;
      return;
    }
    if (row.classList.contains("is-active")) {
      // Already the displayed experiment — just toggle its description.
      row.classList.toggle("is-open");
      return;
    }
    setActive(entry);
    // Persist the selection in the URL so a refresh keeps showing it.
    const url = new URL(window.location.href);
    url.searchParams.set("exp", entry.number);
    window.history.replaceState(null, "", url);
  }

  function isVideo(src) {
    return /\.(mp4|webm|mov|m4v)$/i.test(src);
  }

  function createMediaEl(src, alt, className) {
    let el;
    if (isVideo(src)) {
      el = document.createElement("video");
      el.autoplay = true;
      el.loop = true;
      el.muted = true;
      el.playsInline = true;
    } else {
      el = document.createElement("img");
      el.alt = alt;
    }
    el.src = src;
    if (className) el.className = className;
    return el;
  }

  function setActive(entry) {
    document.querySelectorAll(".exp-row").forEach((row) => {
      const isThis = row.dataset.number === entry.number;
      row.classList.toggle("is-active", isThis);
      row.classList.toggle("is-open", isThis);
    });
    setActiveSection(entry.section);

    const frameWrap = document.querySelector(".stage-frame-wrap");
    const mediaGrid = document.querySelector(".stage-media");
    if (!frameWrap || !mediaGrid) return;

    const basePath = `${PREFIX}${entry.section}/`;
    frameWrap.querySelectorAll("iframe, .gallery-hero").forEach((el) => el.remove());
    mediaGrid.innerHTML = "";

    if (entry.mode === "gallery") {
      const hero = createMediaEl(basePath + entry.images[0], entry.term, "gallery-hero");
      frameWrap.appendChild(hero);

      entry.images.slice(1).forEach((src) => {
        mediaGrid.appendChild(createMediaEl(basePath + src, entry.term));
      });
    } else {
      const iframe = document.createElement("iframe");
      iframe.src = basePath + entry.path;
      iframe.title = entry.term;
      frameWrap.appendChild(iframe);

      if (entry.images && entry.images.length) {
        entry.images.forEach((src) => {
          mediaGrid.appendChild(createMediaEl(basePath + src, entry.term));
        });
      }
    }
  }

  function initStage() {
    const stage = document.querySelector(".stage-visual");
    if (!stage || !SECTION) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("exp");
    // A requested experiment can belong to any section, not just this page's —
    // only fall back to this section's first entry when nothing was requested.
    const initial =
      (requested && EXPERIMENTS.find((e) => e.number === requested)) ||
      EXPERIMENTS.find((e) => e.section === SECTION);
    if (initial) setActive(initial);
  }

  function initIntro() {
    const introEl = document.querySelector(".col-intro");
    if (!introEl || SECTION) return;
    renderParagraphs(introEl, ABOUT_TEXT);

    // Hidden until [About] is clicked — not shown on first entering the site.
    const aboutLink = document.querySelector("[data-action='about']");
    if (!aboutLink) return;
    aboutLink.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = introEl.classList.toggle("is-open");
      aboutLink.classList.toggle("is-current", isOpen);
    });
  }

  function initMediaToggle() {
    const buttons = document.querySelectorAll(".media-toggle-btn");
    const mediaGrid = document.querySelector(".stage-media");
    if (!buttons.length || !mediaGrid) return;
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-current"));
        btn.classList.add("is-current");
        mediaGrid.classList.toggle("is-grid", btn.dataset.view === "grid");
      });
    });
  }

  function buildFooterLink() {
    const link = document.createElement("a");
    link.className = "corner-link";
    link.href = "https://v-aa-d.github.io/vessels-for-translation/";
    link.textContent = "↳ Go to the final translations";
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildHeader();
    buildList();
    initStage();
    initIntro();
    initMediaToggle();
    buildFooterLink();
  });
})();
