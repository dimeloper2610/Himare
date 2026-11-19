(function () {
  "use strict";

  /* ---------- Galleries ---------- */
  function range(n, skip) {
    var out = [];
    for (var i = 1; i <= n; i++) {
      if (skip && skip.indexOf(i) !== -1) continue;
      out.push((i < 10 ? "0" : "") + i + ".jpg");
    }
    return out;
  }
  var galleries = {
    "casa-bella": range(66),
    "mikri-himara": range(24, [12])
  };

  var lb = document.getElementById("lightbox");
  var lbImg = lb.querySelector("img");
  var lbCount = lb.querySelector(".lb-count");
  var current = { name: null, idx: 0 };

  function show() {
    var list = galleries[current.name];
    current.idx = (current.idx + list.length) % list.length;
    lbImg.src = "assets/img/" + current.name + "/" + list[current.idx];
    lbCount.textContent = (current.idx + 1) + " / " + list.length;
    // preload neighbour
    var next = new Image();
    next.src = "assets/img/" + current.name + "/" + list[(current.idx + 1) % list.length];
  }
  function open(name, idx) {
    current.name = name;
    current.idx = idx;
    show();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }
  function close() {
    lb.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    g.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-idx]");
      if (btn) open(g.dataset.gallery, parseInt(btn.dataset.idx, 10));
    });
  });
  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", function () { current.idx--; show(); });
  lb.querySelector(".lb-next").addEventListener("click", function () { current.idx++; show(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") { current.idx--; show(); }
    if (e.key === "ArrowRight") { current.idx++; show(); }
  });
  var touchX = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { current.idx += dx < 0 ? 1 : -1; show(); }
    touchX = null;
  });

  /* ---------- Language (Greek default, English) ---------- */
  var en = {
    "nav.casa": "Casa Bella",
    "nav.mikri": "Mikri Himara",
    "nav.host": "Your host",
    "nav.location": "Location",
    "hero.eyebrow": "Himarë · Albanian Riviera",
    "hero.title": "Garden, sea and family hospitality",
    "hero.lead": "Two places to stay in Himarë from Superhost Pol and his family, a few minutes' walk from the beach and the town centre.",
    "hero.cta1": "Casa Bella",
    "hero.cta2": "Mikri Himara",
    "stats.casa": "Casa Bella, 13 reviews",
    "stats.mikri": "Mikri Himara, 19 reviews",
    "stats.host": "4.93 ★ across 60 reviews",
    "stats.respTitle": "1 hour",
    "stats.resp": "response time, 100% response rate",
    "intro.fav": "Both places are Airbnb “Guest favourites”: among the most loved homes, based on ratings, reviews and reliability.",

    "casa.type": "Entire home · Himarë, Albania",
    "casa.sub": "a home with a secret garden",
    "casa.f1": "4 guests", "casa.f2": "1 bedroom", "casa.f3": "3 beds", "casa.f4": "1 bathroom", "casa.f5": "13 reviews",
    "gallery.all66": "All 66 photos",
    "gallery.all23": "All 23 photos",
    "h.highlights": "Highlights",
    "h.about": "About the place",
    "h.sleep": "Where you'll sleep",
    "h.amenities": "Amenities",
    "h.reviews": "What guests say",
    "casa.h1t": "Close to the beach and the centre",
    "casa.h1": "A quiet retreat within walking distance of the beach and the centre of Himarë.",
    "casa.h2t": "A lush garden with hammocks and swings",
    "casa.h2": "A spacious garden with hammocks, swings, outdoor dining and free parking.",
    "casa.h3t": "A warm welcome from the family",
    "casa.h3": "Guests mention Pol's father, who greets visitors with local treats and thoughtful care.",
    "casa.desc": "Casa Bella Himara is a cluster of bohemian homes two minutes from the centre, made for friends and families who want to unwind in a unique garden full of trees, old wells and touches of nature. Each home has its own courtyard with a modern seating area, free parking, WiFi, air conditioning and a coffee machine, and the whole interior is finished in Swedish wood. It brings nature and the sea together.",
    "casa.bedroom": "Bedroom",
    "casa.beds": "1 double bed, 2 single beds",
    "casa.notinc": "No kitchen, TV, dryer or heating. Pets are not allowed.",
    "casa.guestfav": "Guest favourite · 13 reviews, all five stars",
    "casa.r1": "“The family was extremely hospitable and offered even more than was advertised. Perfect location and an even more pleasant father. We'll gladly come back!”",
    "casa.r2": "“Pol's place was an amazing place to stay in Himarë. A little oasis of calm a few minutes from the centre. Pol's father is a real gentleman; he made our stay so relaxed. Wonderful people and a beautiful place.”",

    "am.outdoor": "Outdoors", "am.patio": "Patio or balcony", "am.hammock": "Hammock", "am.outdining": "Outdoor dining area", "am.kayak": "Kayak",
    "am.kitchen": "Kitchen & dining", "am.fridge": "Fridge", "am.kettle": "Kettle", "am.nespresso": "Nespresso machine", "am.coffee": "Coffee", "am.dining": "Dining table",
    "am.bedroom": "Bedroom & laundry", "am.washer": "Washing machine (free)", "am.essentials": "Essentials: towels, sheets, soap, toilet paper", "am.linen": "Bed linen", "am.pillows": "Extra pillows and blankets", "am.blackout": "Blackout curtains", "am.hangers": "Hangers and clothes storage", "am.rack": "Drying rack",
    "am.bath": "Bathroom", "am.hotwater": "Hot water", "am.hairdryer": "Hair dryer", "am.shampoo": "Shampoo, conditioner, body wash", "am.cleaning": "Cleaning products",
    "am.more": "Also", "am.ac": "Air conditioning", "am.parking": "Free parking on the premises", "am.crib": "Cot with linen", "am.greet": "Host greets you",
    "am.room": "Room", "am.tv": "TV", "am.lock": "Lock on bedroom door", "am.privbath": "Private bathroom",
    "am.outside": "Outside", "am.yard": "Courtyard and garden with seating",
    "am.stay": "Your stay", "am.fastout": "Quick checkout",

    "cat.clean": "Cleanliness", "cat.accuracy": "Accuracy", "cat.checkin": "Check-in", "cat.comm": "Communication", "cat.location": "Location", "cat.value": "Value",
    "cta.book": "Book on Airbnb",
    "cta.price": "Add your dates on Airbnb to see prices and availability.",
    "m.sep": "September 2026", "m.aug": "August 2026", "m.ch": "Switzerland",
    "tag.hosp": "Hospitality", "tag.loc": "Location", "tag.walk": "Walkable", "tag.out": "Outdoor space", "tag.clean": "Cleanliness", "tag.quiet": "Quiet", "tag.family": "Family", "tag.beach": "Beach", "tag.bath": "Bathroom",

    "mikri.type": "Private room · Himarë, Albania",
    "mikri.title": "Mikri Himara",
    "mikri.f1": "2 guests", "mikri.f2": "1 bed", "mikri.f3": "Private bathroom", "mikri.f4": "300 m from the sea", "mikri.f5": "19 reviews",
    "mikri.h1t": "Close to the beach",
    "mikri.h1": "A quiet spot near the beach and the old town, with shops and restaurants close by.",
    "mikri.h2t": "Garden with comfy seating",
    "mikri.h2": "A garden with comfortable outdoor seating, ideal for unwinding after a day on the coast.",
    "mikri.h3t": "Warm hosts",
    "mikri.h3": "Guests highlight the warm welcome from Pol and his father; many say they felt at home.",
    "mikri.desc": "Our rooms are fully renovated, with a private bathroom, a courtyard and free parking. The main beach is 300 metres away and you can walk everywhere. The rooms have air conditioning, Wi‑Fi and a TV. Enjoy the hospitality of your host, who will make you coffee, offer you raki and answer any question you have. We look forward to giving you your best summer yet!",
    "mikri.checkin": "Check-in after 3:00 pm",
    "mikri.max": "Up to 2 guests",
    "mikri.notinc": "No kitchen, washing machine, dryer or heating.",
    "mikri.guestfav": "Guest favourite · 19 reviews",
    "mikri.r1": "“Incredibly kind and sweet host. We loved our stay and would happily come back any time! Thank you for making it such a special trip. We really enjoyed the fresh fruit Pol's father offered us so enthusiastically when we got back from a day trip :)”",
    "mikri.r2": "“Amazing place! We had a wonderful time and want to come back.”",

    "host.eyebrow": "Meet your host",
    "host.years": "4 years hosting",
    "host.reviews": "60 reviews",
    "host.born": "Born in the '90s · lives in Athens",
    "host.lang": "Speaks Greek, English and Spanish",
    "host.resp": "100% response rate · replies within an hour",
    "host.cohost": "Co-host: Damianos",
    "host.text": "On the ground, guests are often welcomed by Pol's father, with coffee, raki, fresh fruit and local treats. Almost every review mentions him.",

    "loc.eyebrow": "Where you'll be",
    "loc.title": "Himarë, Vlorë County, Albania",
    "loc.text": "Himarë is a seaside town on the Albanian Riviera, with clear water, pebble beaches and an old castle on the hill. Both places sit in a quiet spot within walking distance of the main beach, restaurants and shops.",
    "loc.d1t": "Casa Bella", "loc.d1": "2 minutes from the centre",
    "loc.d2t": "Mikri Himara", "loc.d2": "300 m from the main beach",
    "loc.approx": "The map shows the approximate area. The exact address is shared after booking.",

    "final.title": "Your summer in Himarë starts here",
    "final.casa": "Entire home · up to 4 guests",
    "final.mikri": "Room · up to 2 guests",
    "foot.note": "Details, ratings and reviews come from the listings' Airbnb pages (November 2026). Bookings are made through Airbnb."
  };

  var nodes = document.querySelectorAll("[data-i18n]");
  var el = {};
  nodes.forEach(function (n) { el[n.dataset.i18n] = n.textContent; });
  var langBtn = document.getElementById("langToggle");

  function setLang(lang) {
    var dict = lang === "en" ? en : el;
    nodes.forEach(function (n) {
      var v = dict[n.dataset.i18n];
      if (v !== undefined) n.textContent = v;
    });
    document.documentElement.lang = lang;
    langBtn.textContent = lang === "en" ? "EL" : "EN";
    try { localStorage.setItem("himare-lang", lang); } catch (e) {}
  }
  langBtn.addEventListener("click", function () {
    setLang(document.documentElement.lang === "en" ? "el" : "en");
  });
  var saved = null;
  try { saved = localStorage.getItem("himare-lang"); } catch (e) {}
  if (saved === "en") setLang("en");
})();
