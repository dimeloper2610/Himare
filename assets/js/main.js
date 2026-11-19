(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var lang = "el";

  // View Transitions where supported; an interrupted transition is harmless, so swallow its rejection
  function vt(fn) {
    if (!document.startViewTransition || reduceMotion) { fn(); return; }
    var t = document.startViewTransition(fn);
    var noop = function () {};
    if (t.ready) t.ready.catch(noop);
    if (t.finished) t.finished.catch(noop);
    if (t.updateCallbackDone) t.updateCallbackDone.catch(noop);
  }

  /* =========================================================
     Data
     ========================================================= */
  function files(n, skip) {
    var out = [];
    for (var i = 1; i <= n; i++) if (!skip || skip.indexOf(i) === -1) out.push(i);
    return out;
  }
  var pad = function (n) { return (n < 10 ? "0" : "") + n + ".jpg"; };
  var G = {
    casa: {
      dir: "casa-bella", name: "Casa Bella", rating: "5,0",
      url: "https://www.airbnb.gr/rooms/1404415852625597128",
      all: files(66),
      wide: [1],
      featured: [1, 2, 25, 7, 30, 21, 8, 38, 4, 36, 40, 51, 10, 23, 14]
    },
    mikri: {
      dir: "mikri-himara", name: { el: "Μικρή Χιμάρα", en: "Mikri Himara" }, rating: "4,84",
      url: "https://www.airbnb.gr/rooms/880163057785084192",
      all: files(24, [12]),
      featured: [1, 3, 6, 8, 2, 5, 14, 15, 18, 22, 10, 16]
    }
  };
  var nameOf = function (g) { return typeof g.name === "string" ? g.name : g.name[lang]; };
  var full = function (g, n) { return "assets/img/" + g.dir + "/" + pad(n); };
  var thumb = function (g, n) { return "assets/img/" + g.dir + "/thumb/" + pad(n); };

  var UI = {
    el: { photos: "Όλες οι φωτογραφίες", seeAll: "Δείτε τις {n}", amenMore: "Δείτε όλες τις {n} παροχές", amenLess: "Λιγότερες παροχές", copied: "Ο σύνδεσμος αντιγράφηκε", shareText: "Casa Bella & Μικρή Χιμάρα · διαμονή στη Χιμάρα" },
    en: { photos: "All photos", seeAll: "See all {n}", amenMore: "Show all {n} amenities", amenLess: "Show fewer", copied: "Link copied", shareText: "Casa Bella & Mikri Himara · stay in Himarë" }
  };
  var t = function (k, n) { return UI[lang][k].replace("{n}", n); };

  /* =========================================================
     Carousels
     ========================================================= */
  $$("[data-gallery]").forEach(function (host) {
    var key = host.dataset.gallery, g = G[key];
    var track = document.createElement("div");
    track.className = "car-track";
    g.featured.forEach(function (n, i) {
      var b = document.createElement("button");
      b.className = "car-slide" + (g.wide && g.wide.indexOf(n) !== -1 ? " wide" : "");
      b.type = "button";
      b.setAttribute("aria-label", nameOf(g) + " " + (i + 1));
      var img = new Image();
      img.alt = "";
      img.loading = i < 3 ? "eager" : "lazy";
      img.decoding = "async";
      img.src = full(g, n);
      img.onload = function () { b.style.setProperty("--ar", (img.naturalWidth / img.naturalHeight).toFixed(3)); };
      b.appendChild(img);
      b.addEventListener("click", function () { openViewer(key, g.all.indexOf(n)); });
      track.appendChild(b);
    });
    // "all photos" slide
    var all = document.createElement("button");
    all.className = "car-slide all";
    all.type = "button";
    var mg = g.all.slice(-9).map(function (n) { return '<img src="' + thumb(g, n) + '" alt="" loading="lazy">'; }).join("");
    all.innerHTML = '<span class="all-inner"><span class="mini-grid">' + mg + '</span><span class="all-label"></span></span>';
    all.addEventListener("click", function () { openSheet(key); });
    track.appendChild(all);

    var ui = document.createElement("div");
    ui.className = "car-ui";
    ui.innerHTML =
      '<button class="car-btn" type="button" data-dir="-1" aria-label="Previous"><svg class="ic"><use href="#i-chevron-left"/></svg></button>' +
      '<button class="car-btn" type="button" data-dir="1" aria-label="Next"><svg class="ic"><use href="#i-chevron-right"/></svg></button>' +
      '<div class="car-bar"><i></i></div>' +
      '<button class="car-all" type="button"><svg class="ic"><use href="#i-grid-2x2"/></svg> <span class="car-all-label"></span></button>';
    var frame = document.createElement("div");
    frame.className = "car-frame";
    frame.innerHTML =
      '<button class="car-arrow prev" type="button" data-dir="-1" aria-label="Previous"><svg class="ic"><use href="#i-chevron-left"/></svg></button>' +
      '<button class="car-arrow next" type="button" data-dir="1" aria-label="Next"><svg class="ic"><use href="#i-chevron-right"/></svg></button>';
    frame.insertBefore(track, frame.firstChild);
    host.appendChild(frame);
    host.appendChild(ui);

    var bar = $(".car-bar i", ui);
    var arrows = $$(".car-arrow", frame);
    function updateBar() {
      var max = track.scrollWidth - track.clientWidth;
      var ratio = track.clientWidth / track.scrollWidth;
      var w = Math.max(ratio * 100, 8);
      bar.style.setProperty("--w", w + "%");
      var p = max > 0 ? track.scrollLeft / max : 0;
      bar.style.setProperty("--x", (p * (100 / w * 100 - 100)) + "%");
      frame.classList.toggle("at-start", track.scrollLeft < 4);
      frame.classList.toggle("at-end", track.scrollLeft > max - 4);
    }
    track.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    setTimeout(updateBar, 300);
    // page by whole slides: move to the first slide that is cut off on that side
    function page(dir) {
      var slides = $$(".car-slide", track);
      var view = track.getBoundingClientRect();
      var target = null;
      if (dir > 0) {
        for (var i = 0; i < slides.length; i++) {
          if (slides[i].getBoundingClientRect().right > view.right + 2) { target = slides[i]; break; }
        }
      } else {
        for (var j = slides.length - 1; j >= 0; j--) {
          if (slides[j].getBoundingClientRect().left < view.left - 2) { target = slides[j]; break; }
        }
      }
      if (!target) return;
      var left = dir > 0
        ? track.scrollLeft + (target.getBoundingClientRect().left - view.left)
        : track.scrollLeft - (view.right - target.getBoundingClientRect().right);
      track.scrollTo({ left: left, behavior: reduceMotion ? "instant" : "smooth" });
    }
    $$(".car-btn, .car-arrow", host).forEach(function (btn) {
      btn.addEventListener("click", function () { page(+btn.dataset.dir); });
    });
    track.tabIndex = 0;
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); page(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); page(-1); }
    });
    $(".car-all", ui).addEventListener("click", function () { openSheet(key); });
    host._labels = function () {
      $(".all-label", all).textContent = t("seeAll", g.all.length);
      $(".car-all-label", ui).textContent = t("photos") + " (" + g.all.length + ")";
    };
    host._labels();
  });

  /* =========================================================
     Overlays: sheet (grid) + viewer (swipe), with back-button support
     ========================================================= */
  var sheet = $("#sheet"), sheetGrid = $("#sheetGrid"), sheetTitle = $("#sheetTitle");
  var viewer = $("#viewer"), vTrack = $("#viewerTrack"), vCount = $("#viewerCount");
  var stack = [];

  function lockScroll(on) { document.documentElement.style.overflow = on ? "hidden" : ""; }
  function pushOverlay(name) {
    stack.push(name);
    lockScroll(true);
    try { history.pushState({ overlay: name }, ""); } catch (e) {}
  }
  function closeTop(fromPop) {
    var name = stack.pop();
    if (!name) return;
    if (name === "viewer") { viewer.hidden = true; vTrack.innerHTML = ""; }
    if (name === "sheet") { sheet.hidden = true; }
    if (!stack.length) lockScroll(false);
    if (!fromPop) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener("popstate", function () { if (stack.length) closeTop(true); });
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { closeTop(false); }); });

  function openSheet(key) {
    var g = G[key];
    sheetTitle.textContent = nameOf(g) + " · " + g.all.length;
    sheetGrid.innerHTML = "";
    g.all.forEach(function (n, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.style.setProperty("--n", Math.min(i, 24));
      b.innerHTML = '<img src="' + thumb(g, n) + '" alt="" loading="lazy" decoding="async">';
      b.addEventListener("click", function () { openViewer(key, i); });
      sheetGrid.appendChild(b);
    });
    sheet.hidden = false;
    sheet.scrollTop = 0;
    pushOverlay("sheet");
  }

  var vState = { key: null, idx: 0 };
  function openViewer(key, idx) {
    var g = G[key];
    vState.key = key;
    vTrack.innerHTML = "";
    g.all.forEach(function (n, i) {
      var f = document.createElement("figure");
      var img = new Image();
      img.alt = nameOf(g) + " " + (i + 1);
      img.decoding = "async";
      // load current and neighbours eagerly, others lazily
      if (Math.abs(i - idx) > 1) img.loading = "lazy";
      img.src = full(g, n);
      f.appendChild(img);
      vTrack.appendChild(f);
    });
    viewer.hidden = false;
    pushOverlay("viewer");
    requestAnimationFrame(function () {
      vTrack.scrollTo({ left: idx * vTrack.clientWidth, behavior: "instant" });
      setCount(idx);
    });
  }
  function setCount(i) {
    vState.idx = i;
    vCount.textContent = (i + 1) + " / " + G[vState.key].all.length;
  }
  vTrack.addEventListener("scroll", function () {
    var i = Math.round(vTrack.scrollLeft / vTrack.clientWidth);
    if (i !== vState.idx) setCount(i);
  }, { passive: true });
  function step(d) {
    var max = G[vState.key].all.length - 1;
    var i = Math.min(max, Math.max(0, vState.idx + d));
    vTrack.scrollTo({ left: i * vTrack.clientWidth, behavior: reduceMotion ? "instant" : "smooth" });
  }
  $(".viewer-nav.prev").addEventListener("click", function () { step(-1); });
  $(".viewer-nav.next").addEventListener("click", function () { step(1); });
  document.addEventListener("keydown", function (e) {
    if (!stack.length) return;
    if (e.key === "Escape") closeTop(false);
    if (!viewer.hidden) {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }
  });

  /* =========================================================
     Hero: word split + slideshow
     ========================================================= */
  function split(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--wi:' + i + '">' + w + "</span></span>";
    }).join(" ");
  }
  $$("[data-split]").forEach(split);

  var slides = $$(".hero-slides img"), dots = $$(".hero-dots i"), cur = 0;
  function nextSlide() {
    slides[cur].classList.remove("is-active");
    dots[cur].classList.remove("on");
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add("is-active");
    void dots[cur].offsetWidth;
    dots[cur].classList.add("on");
  }
  if (!reduceMotion && slides.length > 1) setInterval(function () { if (!document.hidden) nextSlide(); }, 6000);

  /* =========================================================
     Reveal on scroll + count-up
     ========================================================= */
  $$("[data-reveal-group]").forEach(function (g) {
    $$("[data-reveal]", g).forEach(function (el, i) { el.style.setProperty("--i", i); });
  });
  $$(".amen").forEach(function (ul) { $$("li", ul).forEach(function (li, i) { li.style.setProperty("--n", Math.min(i, 12)); }); });

  function fmt(v, dec) { return lang === "el" ? v.toFixed(dec).replace(".", ",") : v.toFixed(dec); }
  function countUp(el) {
    if (el._done) return;
    el._done = true;
    var to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    if (reduceMotion) { el.textContent = fmt(to, dec); return; }
    var start = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$("[data-count]", en.target).forEach(countUp);
        if (en.target.hasAttribute("data-count")) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
    $$("[data-count]").forEach(function (el) { if (!el.closest("[data-reveal]")) io.observe(el); });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* =========================================================
     Amenities collapse
     ========================================================= */
  $$(".amen[data-collapse]").forEach(function (ul) {
    var total = $$("li", ul).length;
    ul.classList.add("collapsed");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "amen-more";
    var label = function () { btn.textContent = ul.classList.contains("collapsed") ? t("amenMore", total) : t("amenLess"); };
    btn.addEventListener("click", function () {
      var run = function () { ul.classList.toggle("collapsed"); label(); };
      vt(run);
    });
    ul.after(btn);
    ul._label = label;
    label();
  });

  /* =========================================================
     Nav state, scroll-spy, mobile book pill, progress fallback
     ========================================================= */
  var nav = $("#nav"), pill = $("#bookPill");
  var progress = $(".progress");
  var noScrollTimeline = !(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"));
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle("scrolled", window.scrollY > 40);
      if (noScrollTimeline) {
        var h = document.documentElement.scrollHeight - innerHeight;
        progress.style.setProperty("--p", h > 0 ? scrollY / h : 0);
      }
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var spyLinks = $$("[data-spy]");
  var currentProp = null;
  function setPill(key) {
    if (key === currentProp) return;
    currentProp = key;
    if (!key) { pill.classList.remove("show"); return; }
    var g = G[key];
    $("#bpName").textContent = nameOf(g);
    $("#bpRating").textContent = g.rating;
    $("#bpLink").href = g.url;
    pill.classList.add("show");
  }
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        spyLinks.forEach(function (a) { a.classList.toggle("active", a.dataset.spy === id); });
        setPill(en.target.dataset.property || null);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach(function (s) { spy.observe(s); });
  }

  /* =========================================================
     Day / night
     ========================================================= */
  var dn = $("#daynight"), dnBtn = $("#dnToggle");
  dnBtn.addEventListener("click", function () {
    var night = dn.dataset.mode !== "night";
    dn.dataset.mode = night ? "night" : "day";
    dnBtn.setAttribute("aria-checked", night ? "true" : "false");
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
  });

  /* =========================================================
     3D tilt (desktop only)
     ========================================================= */
  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add("tilting");
        el.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("tilting");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* =========================================================
     Share
     ========================================================= */
  var toast = $("#toast"), toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }
  $("#shareBtn").addEventListener("click", function () {
    var data = { title: document.title, text: t("shareText"), url: location.href.split("#")[0] };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(function () { showToast(t("copied")); });
  });

  /* =========================================================
     Language (Greek default, English)
     ========================================================= */
  var en = {
    "nav.casa": "Casa Bella", "nav.mikri": "Mikri Himara", "nav.host": "Your host", "nav.explore": "The area", "nav.faq": "FAQ",
    "hero.eyebrow": "Himarë · Albanian Riviera",
    "hero.title": "Garden, sea and family hospitality",
    "hero.lead": "Two places to stay from Superhost Pol and his family, a few minutes' walk from the beach and the town centre.",
    "hero.cta": "Find your place",
    "hero.chip3": "300 m from the sea",
    "stats.casa": "Casa Bella · 13 reviews", "stats.mikri": "Mikri Himara · 19 reviews", "stats.host": "reviews for the host", "stats.resp": "replies within an hour",

    "choose.eyebrow": "Two places, one family", "choose.title": "Choose yours",
    "choose.casaTag": "Entire home", "choose.casaText": "A bohemian home in a secret garden with orange trees, hammocks and swings.",
    "choose.mikriTag": "Private room", "choose.mikriText": "Renovated rooms with a private bathroom and a lantern‑lit courtyard, 300 m from the beach.",
    "choose.see": "Take a look",
    "cmp.type": "Type", "cmp.casaType": "Entire home", "cmp.mikriType": "Room", "cmp.guests": "Guests", "cmp.beds": "Beds",
    "cmp.casaBeds": "1 double + 2 single", "cmp.mikriBeds": "1 bed", "cmp.ideal": "Ideal for", "cmp.casaIdeal": "Families, groups of friends",
    "cmp.mikriIdeal": "Couples, solo travellers", "cmp.parking": "Parking", "cmp.tv": "TV", "cmp.washer": "Washing machine", "cmp.garden": "Garden / courtyard",

    "fav": "Guest favourite",
    "casa.type": "Entire home · Himarë, Albania", "casa.sub": "a home with a secret garden",
    "casa.f1": "4 guests", "casa.f2": "1 bedroom", "casa.f3": "3 beds", "casa.f4": "1 bathroom",
    "casa.h1t": "Close to the beach and the centre", "casa.h1": "A quiet retreat within walking distance of the beach and the centre of Himarë.",
    "casa.h2t": "A garden with hammocks and swings", "casa.h2": "A spacious garden with hammocks, swings, outdoor dining and free parking.",
    "casa.h3t": "A warm family welcome", "casa.h3": "Pol's father greets guests with local treats and thoughtful care.",
    "h.about": "About the place", "h.amenities": "Amenities", "h.reviews": "What guests say",
    "casa.desc": "Casa Bella Himara is a cluster of bohemian homes two minutes from the centre, made for friends and families who want to unwind in a unique garden full of trees, old wells and touches of nature. Each home has its own courtyard with a modern seating area, free parking, WiFi, air conditioning and a coffee machine, and the whole interior is finished in Swedish wood. It brings nature and the sea together.",
    "casa.bedroom": "Bedroom", "casa.beds": "1 double bed, 2 single beds",
    "casa.babyT": "For little ones", "casa.baby": "Cot with linen, blackout curtains",
    "casa.notinc": "No kitchen, TV, dryer or heating. Pets are not allowed.",
    "casa.guestfav": "Guest favourite · 13 reviews, all five stars",
    "casa.r1": "“The family was extremely hospitable and offered even more than was advertised. Perfect location and an even more pleasant father. We'll gladly come back!”",
    "casa.r2": "“Pol's place was an amazing place to stay in Himarë. A little oasis of calm a few minutes from the centre. Pol's father is a real gentleman; he made our stay so relaxed. Wonderful people and a beautiful place.”",

    "am.ac": "Air conditioning", "am.parking": "Free parking on the premises", "am.hammock": "Hammock and swings", "am.outdining": "Outdoor dining area",
    "am.nespresso": "Nespresso, kettle, coffee", "am.fridge": "Fridge", "am.washer": "Washing machine (free)", "am.kayak": "Kayak",
    "am.patio": "Patio or balcony", "am.crib": "Cot", "am.blackout": "Blackout curtains", "am.hotwater": "Hot water", "am.hairdryer": "Hair dryer",
    "am.shampoo": "Shampoo, conditioner, body wash", "am.linen": "Bed linen, extra pillows and blankets",
    "am.essentials": "Essentials: towels, sheets, soap, toilet paper", "am.hangers": "Hangers, drying rack, clothes storage",
    "am.cleaning": "Cleaning products", "am.greet": "Host greets you",
    "am.tv": "TV", "am.privbath": "Private bathroom", "am.lock": "Lock on the room door", "am.yard": "Courtyard and garden with seating",
    "am.raki": "Coffee and raki from your host", "am.fastout": "Quick checkout",

    "cat.clean": "Cleanliness", "cat.accuracy": "Accuracy", "cat.checkin": "Check-in", "cat.comm": "Communication", "cat.location": "Location", "cat.value": "Value",
    "cta.book": "Book on Airbnb", "cta.bookShort": "Book", "cta.price": "Add your dates on Airbnb to see prices and availability.",
    "m.sep": "September 2026", "m.aug": "August 2026", "m.ch": "Switzerland",
    "tag.hosp": "Hospitality", "tag.loc": "Location", "tag.walk": "Walkable", "tag.out": "Outdoor space", "tag.clean": "Cleanliness",
    "tag.quiet": "Quiet", "tag.family": "Family", "tag.beach": "Beach", "tag.bath": "Bathroom", "tag.near": "Close by",

    "dn.eyebrow": "The garden", "dn.title": "Day or night, always magical", "dn.day": "Day", "dn.night": "Night",
    "dn.cap": "Orange trees, hammocks and morning coffee in the shade. At night the lanterns and string lights come on.",

    "mikri.type": "Private room · Himarë, Albania", "mikri.title": "Mikri Himara",
    "mikri.f1": "2 guests", "mikri.f2": "1 bed", "mikri.f3": "Private bathroom", "mikri.f4": "300 m from the sea",
    "mikri.h1t": "Close to the beach", "mikri.h1": "A quiet spot near the beach and the old town, with shops and restaurants close by.",
    "mikri.h2t": "Garden with comfy seating", "mikri.h2": "Ideal for unwinding after a day on the coast.",
    "mikri.h3t": "Warm hosts", "mikri.h3": "Guests highlight the warm welcome from Pol and his father; many felt right at home.",
    "mikri.desc": "Our rooms are fully renovated, with a private bathroom, a courtyard and free parking. The main beach is 300 metres away and you can walk everywhere. The rooms have air conditioning, Wi‑Fi and a TV. Enjoy the hospitality of your host, who will make you coffee, offer you raki and answer any question you have. We look forward to giving you your best summer yet!",
    "mikri.checkin": "Check-in after 3:00 pm",
    "mikri.notinc": "No kitchen, washing machine, dryer or heating.",
    "mikri.guestfav": "Guest favourite · 19 reviews",
    "mikri.r1": "“Incredibly kind and sweet host. We loved our stay and would happily come back any time! Thank you for making it such a special trip. We really enjoyed the fresh fruit Pol's father offered us so enthusiastically when we got back from a day trip :)”",
    "mikri.r2": "“Amazing place! We had a wonderful time and want to come back.”",

    "host.nReviews": "reviews", "host.nRating": "rating", "host.nYears": "years hosting",
    "host.eyebrow": "Meet your host",
    "host.quote": "Coffee, raki, fresh fruit and a warm good morning: that's how guests describe the welcome in Himarë.",
    "host.lang": "Speaks Greek, English and Spanish", "host.resp": "100% response rate · replies within an hour",
    "host.born": "Born in the '90s · lives in Athens", "host.cohost": "Co-host: Damianos",
    "host.text": "On the ground, guests are often welcomed by Pol's father. Almost every review mentions him.",

    "ex.eyebrow": "Around Himarë", "ex.title": "Things to explore",
    "ex.1t": "Old town & castle", "ex.1": "The stone village on the hill above town, with narrow lanes, churches and views over the Ionian.",
    "ex.2t": "Livadhi beach", "ex.2": "A long pebble beach with crystal-clear water, just north of town.",
    "ex.3t": "Porto Palermo", "ex.3": "Ali Pasha's fortress on a small peninsula, south of Himarë.",
    "ex.4t": "Gjipe beach", "ex.4": "A secluded cove at the mouth of a canyon, to the north towards Dhërmi.",
    "ex.5t": "Everything on foot", "ex.5": "Himarë's beach, tavernas and shops are a few minutes' walk from both places.",
    "loc.title": "Himarë, Vlorë County, Albania", "loc.d1": "2 minutes from the centre", "loc.d2": "300 m from the main beach",
    "loc.open": "Open in maps", "loc.approx": "The map shows the approximate area. The exact address is shared after booking.",

    "faq.eyebrow": "Before you book", "faq.title": "Frequently asked questions",
    "faq.q1": "How many people can stay?", "faq.a1": "Casa Bella sleeps up to 4 (1 double and 2 single beds). Mikri Himara is a room for up to 2.",
    "faq.q2": "Is there parking?", "faq.a2": "Yes, both places have free parking on the premises.",
    "faq.q3": "Can I cook?", "faq.a3": "There's no kitchen. Casa Bella has a fridge, kettle, Nespresso machine and outdoor dining, and Himarë's tavernas are a few minutes' walk away.",
    "faq.q4": "Is it suitable for families with a baby?", "faq.a4": "Casa Bella has a cot with linen, blackout curtains and a big garden with swings.",
    "faq.q5": "What time is check-in?", "faq.a5": "At Mikri Himara check-in is after 3:00 pm. For Casa Bella, arrange it with the host through Airbnb; he usually replies within an hour.",
    "faq.q6": "Are pets allowed?", "faq.a6": "Pets are not allowed at Casa Bella.",
    "faq.q7": "How do I book and see prices?", "faq.a7": "Bookings are made through Airbnb. Tap “Book on Airbnb” and add your dates to see prices and availability.",

    "final.title": "Your summer in Himarë starts here", "final.casa": "Entire home · up to 4 guests", "final.mikri": "Room · up to 2 guests",
    "tab.overview": "Overview", "tab.amen": "Amenities", "tab.reviews": "Reviews",
    "dock.mikri": "Mikri", "dock.host": "Pol", "dock.area": "Area", "dock.faq": "FAQ",
    "foot.note": "Details, ratings and reviews come from the listings' Airbnb pages (November 2026). Bookings are made through Airbnb."
  };

  var nodes = $$("[data-i18n]");
  var el = {};
  nodes.forEach(function (n) { el[n.dataset.i18n] = n.hasAttribute("data-split") ? n.getAttribute("aria-label") : n.textContent; });
  var langBtn = $("#langToggle");

  function applyLang(l) {
    lang = l;
    var dict = l === "en" ? en : el;
    nodes.forEach(function (n) {
      var v = dict[n.dataset.i18n];
      if (v === undefined) return;
      n.textContent = v;
      if (n.hasAttribute("data-split")) split(n);
    });
    document.documentElement.lang = l;
    langBtn.textContent = l === "en" ? "EL" : "EN";
    $$("[data-gallery]").forEach(function (h) { if (h._labels) h._labels(); });
    $$(".amen").forEach(function (u) { if (u._label) u._label(); });
    $$("[data-count]").forEach(function (c) { if (c._done) c.textContent = fmt(parseFloat(c.dataset.count), +(c.dataset.dec || 0)); });
    if (currentProp) { var k = currentProp; currentProp = null; setPill(k); }
    try { localStorage.setItem("himare-lang", l); } catch (e) {}
  }
  langBtn.addEventListener("click", function () {
    var next = lang === "en" ? "el" : "en";
    vt(function () { applyLang(next); });
  });
  var saved = null;
  try { saved = localStorage.getItem("himare-lang"); } catch (e) {}
  if (saved === "en") applyLang("en");

  /* =========================================================
     Mobile: one property at a time (switch) + in-property tabs
     ========================================================= */
  var mobileMQ = window.matchMedia("(max-width: 760px)");
  var isMobile = function () { return mobileMQ.matches; };
  var anchor = $("#stay-anchor");
  var navH = function () { return nav.getBoundingClientRect().height; };

  function transition(fn) {
    vt(fn);
  }
  function scrollToStay() {
    var top = anchor.getBoundingClientRect().top + scrollY - navH();
    scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "instant" : "smooth" });
  }
  function setProp(p, opts) {
    opts = opts || {};
    var apply = function () {
      document.body.dataset.prop = p;
      $$(".pswitch button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.prop === p ? "true" : "false"); });
      var sec = p === "mikri" ? $("#mikri-himara") : $("#casa-bella");
      $$("[data-reveal]", sec).forEach(function (el) { el.classList.add("in"); });
      $$("[data-count]", sec).forEach(countUp);
      if (isMobile()) setPill(p);
    };
    if (opts.animate) transition(apply); else apply();
    if (opts.scroll) scrollToStay();
    if (opts.hash !== false) {
      try { history.replaceState(history.state, "", p === "mikri" ? "#mikri-himara" : location.pathname + location.search); } catch (e) {}
    }
  }
  $$(".pswitch button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (document.body.dataset.prop === b.dataset.prop) { scrollToStay(); return; }
      setProp(b.dataset.prop, { animate: true, scroll: true });
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
    });
  });

  // links to a property (nav, dock, hero button) switch instead of jumping
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href="#casa-bella"], a[href="#mikri-himara"], a[href="#choose"]');
    if (!a) return;
    e.preventDefault();
    var h = a.getAttribute("href");
    if (h === "#choose") { scrollToStay(); return; }
    var p = h === "#mikri-himara" ? "mikri" : "casa";
    if (document.body.dataset.prop !== p) setProp(p, { animate: true, scroll: true }); else scrollToStay();
  });

  // tabs inside each property
  $$(".property").forEach(function (sec) {
    var bar = $(".ptabs", sec);
    if (!bar) return;
    $$("button", bar).forEach(function (b) {
      b.addEventListener("click", function () {
        var tab = b.dataset.show;
        if (sec.dataset.activeTab === tab) return;
        sec.dataset.activeTab = tab;
        $$("button", bar).forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
        $$('[data-tab="' + tab + '"]', sec).forEach(function (el) {
          el.classList.add("in");
          $$("[data-count]", el).forEach(countUp);
          el.classList.toggle("tab-anim", false);
          void el.offsetWidth;
          el.classList.toggle("tab-anim", true);
        });
        var barTop = bar.getBoundingClientRect().top;
        var limit = navH() + $("#stay").getBoundingClientRect().height + 8;
        if (barTop < limit) scrollTo({ top: scrollY + barTop - limit, behavior: reduceMotion ? "instant" : "smooth" });
      });
    });
  });

  // deep link: /#mikri-himara opens the second place
  if (location.hash === "#mikri-himara") setProp("mikri", { hash: false });
  window.addEventListener("hashchange", function () {
    if (location.hash === "#mikri-himara") setProp("mikri", { animate: true, hash: false });
    if (location.hash === "#casa-bella") setProp("casa", { animate: true, hash: false });
  });
})();
