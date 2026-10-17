/* ══════════════════════════════════════════════════════════════════════════
   Sunil Kumar — portfolio
   Motion layer. Everything here is progressive: if GSAP is unavailable, or
   the visitor prefers reduced motion, the `anim` class is dropped and the
   page renders fully visible and fully usable.
   ══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var doc = document.documentElement;
  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GSAP = window.gsap;
  var ST = window.ScrollTrigger;

  var canAnimate = !!GSAP && !!ST && !prefersReduce;

  /* ── shared, motion-free behaviour ───────────────────────────────────── */

  function markSection(id) {
    var links = document.querySelectorAll(".nav a");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("is-active", links[i].getAttribute("href") === "#" + id);
    }
  }

  function killPlaceholderLinks() {
    var links = document.querySelectorAll("[data-demo]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("href") === "#") {
        links[i].setAttribute("aria-disabled", "true");
        links[i].addEventListener("click", function (e) { e.preventDefault(); });
      }
    }
  }

  function smoothAnchors() {
    var lenis = window.__lenis;
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        var hash = this.getAttribute("href");
        if (!hash || hash === "#") return;
        var target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();

        if (lenis) {
          lenis.scrollTo(target, { offset: -64, duration: 1.15 });
        } else {
          target.scrollIntoView({ behavior: prefersReduce ? "auto" : "smooth", block: "start" });
        }

        if (history.replaceState) history.replaceState(null, "", hash);
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }.bind(links[i]));
    }
  }

  /* ── static mode: no GSAP, or reduced motion ─────────────────────────── */

  function initStatic() {
    var topbar = document.querySelector(".topbar");
    var fill = document.querySelector("[data-rail-fill]");
    var num = document.querySelector("[data-rail-num]");
    var word = document.querySelector("[data-rail-word]");
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var max = doc.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? window.scrollY / max : 0;
        if (topbar) topbar.classList.toggle("is-stuck", window.scrollY > 60);
        if (fill) fill.style.transform = "scaleY(" + ratio + ")";
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var sections = document.querySelectorAll("[data-section]");
    if ("IntersectionObserver" in window && sections.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var sec = entry.target;
          if (num) num.textContent = sec.getAttribute("data-num") || "";
          if (word) word.textContent = sec.getAttribute("data-name") || "";
          if (sec.id) markSection(sec.id);
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      for (var i = 0; i < sections.length; i++) io.observe(sections[i]);
    }

    killPlaceholderLinks();
    smoothAnchors();
  }

  if (!canAnimate) {
    doc.classList.remove("anim");
    initStatic();
    return;
  }

  /* ── animated mode ───────────────────────────────────────────────────── */

  GSAP.registerPlugin(ST, window.ScrollToPlugin);
  GSAP.defaults({ ease: "power3.out" });

  /* Drop the pre-paint hidden state in the very same task that builds the
     tweens, so the browser never paints an in-between frame. Transitions are
     frozen first: if a transition were live, GSAP would read its in-between
     value as the tween's end value and the element would stay hidden. */
  doc.classList.add("no-transitions");
  doc.classList.remove("anim");

  /* smooth scrolling ------------------------------------------------------ */
  function initLenis() {
    if (typeof window.Lenis === "undefined") return;
    var lenis = new window.Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      smoothWheel: true
    });
    window.__lenis = lenis;
    lenis.on("scroll", ST.update);
    GSAP.ticker.add(function (time) { lenis.raf(time * 1000); });
    GSAP.ticker.lagSmoothing(0);
  }

  /* hero ------------------------------------------------------------------ */
  function initHero() {
    var tl = GSAP.timeline({ delay: 0.12 });

    tl.from("[data-hero-line]", {
      yPercent: 130,
      duration: 1.25,
      ease: "expo.out",
      stagger: 0.085
    })
    .from(".hero-meta span", {
      opacity: 0,
      y: 14,
      duration: 0.7,
      stagger: 0.06
    }, 0.15)
    .from(".hero-lede", {
      opacity: 0,
      y: 24,
      duration: 0.9
    }, 0.35)
    .from(".hero-copy > *", {
      opacity: 0,
      y: 24,
      duration: 0.9,
      stagger: 0.1
    }, 0.45);
  }

  /* section titles + display lines ---------------------------------------- */
  function initLines() {
    var lines = GSAP.utils.toArray("[data-line]");
    lines.forEach(function (el) {
      GSAP.from(el, {
        yPercent: 130,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: el.closest(".mask") || el, start: "top 88%" }
      });
    });
  }

  /* generic reveals ------------------------------------------------------- */
  function initReveals() {
    var items = GSAP.utils.toArray("[data-anim]");
    items.forEach(function (el) {
      GSAP.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.85,
        scrollTrigger: { trigger: el, start: "top 92%" }
      });
    });
  }

  /* project plates -------------------------------------------------------- */
  function initPlates() {
    GSAP.utils.toArray("[data-plate]").forEach(function (plate) {
      var bar = plate.querySelector(".plate-bar");
      var num = plate.querySelector("[data-parallax]");
      var points = plate.querySelectorAll("[data-points] li");

      if (bar) {
        GSAP.from(bar, {
          scaleX: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: plate, start: "top 88%" }
        });
      }

      if (num) {
        GSAP.fromTo(num, { yPercent: 16 }, {
          yPercent: -16,
          ease: "none",
          scrollTrigger: {
            trigger: plate,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      }

      if (points.length) {
        GSAP.from(points, {
          opacity: 0,
          y: 18,
          duration: 0.65,
          stagger: 0.06,
          scrollTrigger: { trigger: plate, start: "top 80%" }
        });
      }
    });
  }

  /* reading band ---------------------------------------------------------- */
  function initBand() {
    var track = document.querySelector("[data-band-track]");
    var set = document.querySelector("[data-band-set]");
    var band = document.querySelector(".band");
    if (!track || !set || !band) return;

    /* Copy the set enough times that the strip always overflows the viewport,
       so the loop never shows a seam — including on very wide screens. */
    function pad() {
      var setW = set.offsetWidth;
      if (!setW) return;
      while (track.scrollWidth - setW < window.innerWidth + 120) {
        var copy = set.cloneNode(true);
        copy.removeAttribute("data-band-set");
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      }
    }
    pad();

    var loop = null;

    function start() {
      if (loop) loop.kill();
      var w = set.offsetWidth;
      if (!w) return;
      loop = GSAP.to(track, {
        x: -w,
        duration: w / 72, /* roughly 72px per second */
        ease: "none",
        repeat: -1
      });
      loop.timeScale(speed.v);
    }

    /* keep the strip full after a resize or a font swap */
    function refill() {
      pad();
      start();
    }
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refill, 200);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refill);

    /* let scroll velocity drive the ticker speed */
    var speed = { v: 1 };
    ST.create({
      trigger: document.body,
      start: "top top",
      end: "max",
      onUpdate: function (self) {
        speed.v = 1 + Math.min(Math.abs(self.getVelocity()) / 1600, 3.2);
      }
    });
    GSAP.ticker.add(function () {
      speed.v += (1 - speed.v) * 0.05;
      if (loop) loop.timeScale(speed.v);
    });

    start();

    GSAP.from(band, {
      opacity: 0,
      yPercent: 10,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: band, start: "top 96%" }
    });
  }

  /* rail, nav, top bar ---------------------------------------------------- */
  function initChrome() {
    var topbar = document.querySelector(".topbar");
    var fill = document.querySelector("[data-rail-fill]");
    var num = document.querySelector("[data-rail-num]");
    var word = document.querySelector("[data-rail-word]");

    if (topbar) {
      ST.create({
        trigger: document.body,
        start: "top -60",
        end: "max",
        onToggle: function (self) { topbar.classList.toggle("is-stuck", self.isActive); }
      });
    }

    if (fill) {
      GSAP.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4
        }
      });
    }

    GSAP.utils.toArray("[data-section]").forEach(function (sec) {
      ST.create({
        trigger: sec,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: function (self) {
          if (!self.isActive) return;
          if (num) num.textContent = sec.getAttribute("data-num") || "";
          if (word) word.textContent = sec.getAttribute("data-name") || "";
          if (sec.id) markSection(sec.id);
        }
      });
    });
  }

  /* cursor accent --------------------------------------------------------- */
  function initCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var dot = document.querySelector("[data-cursor]");
    if (!dot) return;

    var xTo = GSAP.quickTo(dot, "x", { duration: 0.34, ease: "power3" });
    var yTo = GSAP.quickTo(dot, "y", { duration: 0.34, ease: "power3" });
    var shown = false;

    window.addEventListener("pointermove", function (e) {
      if (!shown) { shown = true; dot.classList.add("is-on"); }
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });

    var hot = "a, button, .plate, .spec-row";
    document.addEventListener("pointerover", function (e) {
      if (!e.target.closest || !e.target.closest(hot)) return;
      dot.classList.add("is-hot");
      GSAP.to(dot, { scale: 2.2, duration: 0.3, overwrite: "auto" });
    });
    document.addEventListener("pointerout", function (e) {
      if (!e.target.closest || !e.target.closest(hot)) return;
      dot.classList.remove("is-hot");
      GSAP.to(dot, { scale: 1, duration: 0.3, overwrite: "auto" });
    });

    window.addEventListener("pointerleave", function () { dot.classList.remove("is-on"); });
  }

  /* go -------------------------------------------------------------------- */
  initLenis();
  initHero();
  initLines();
  initReveals();
  initPlates();
  initBand();
  initChrome();
  initCursor();
  killPlaceholderLinks();
  smoothAnchors();
  doc.classList.remove("no-transitions");

  /* Deep links: if the page opens part-way down (a #hash or a restored scroll
     position) finish the reveals that are already at or above the fold, so a
     visitor never lands on content that is still waiting to animate in. */
  function settleDeepLink() {
    if (!location.hash && window.scrollY <= 1) return;
    var vh = window.innerHeight;
    ST.getAll().forEach(function (st) {
      if (!st.animation || st.vars.scrub !== undefined) return;
      var el = st.trigger;
      if (!el || !el.getBoundingClientRect) return;
      if (el.closest && el.closest(".hero")) return;
      if (el.getBoundingClientRect().top < vh) st.animation.progress(1);
    });
  }
  settleDeepLink();

  /* fonts change metrics — recalculate trigger positions once they settle */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ST.refresh(); settleDeepLink(); });
  }
  window.addEventListener("load", function () { ST.refresh(); settleDeepLink(); });

})();
