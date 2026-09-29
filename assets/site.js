// Lingwa Explorers — shared behaviour: the mobile menu, the tappable beach
// scene on the home page, the word chips, and the contact form.

(() => {
  // ---- Mobile menu ----
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---- Words: the same names and recordings the game uses ----
  const WORDS = {
    crab: ["Crab", "Granċ"],
    "beach-ball": ["Beach Ball", "Ballun tal-Baħar"],
    "sand-castle": ["Sand Castle", "Torri tar-Ramel"],
    bucket: ["Bucket", "Barmil"],
    starfish: ["Starfish", "Stilla tal-Baħar"],
    shell: ["Shell", "Arzella"],
    sun: ["Sun", "Xemx"],
    island: ["Island", "Gżira"],
    cloud: ["Cloud", "Sħaba"],
    boat: ["Boat", "Dgħajsa"],
    octopus: ["Octopus", "Qarnita"],
    fish: ["Fish", "Ħuta"],
    jellyfish: ["Jellyfish", "Brama"],
    dolphin: ["Dolphin", "Delfin"],
    shark: ["Shark", "Kelb il-Baħar"],
    coral: ["Coral", "Korall"],
    umbrella: ["Umbrella", "Umbrella"],
  };

  // Resolve paths from this script, so pages work at any depth or base URL.
  const BASE = new URL(".", document.currentScript.src).href;
  let lang = "mt";
  let current = null; // the audio element playing now
  const audioPath = (key, l) => `${BASE}audio/${key}-${l === "mt" ? "mt" : "en"}.mp3`;

  function play(src) {
    if (current) current.pause();
    current = new Audio(src);
    current.play().catch(() => {}); // no sound is fine; the word still shows
    return current;
  }

  // ---- Hero scene ----
  const hero = document.querySelector(".hero");
  if (hero) {
    const card = hero.querySelector(".word");
    const big = card.querySelector("b");
    const small = card.querySelector("span");
    const hint = hero.querySelector(".hint");
    const langBtn = hero.querySelector(".lang");
    const langLabel = hero.querySelector(".lang-label");
    let shown = null;
    let hideTimer;

    const render = (key) => {
      const [en, mt] = WORDS[key];
      big.textContent = lang === "mt" ? mt : en;
      small.textContent = lang === "mt" ? `${en} in English` : `${mt} in Maltese`;
    };

    hero.querySelectorAll(".thing").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.word;
        hero.querySelectorAll(".thing.on").forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        const img = btn.querySelector("img");
        img.classList.remove("pop"); void img.offsetWidth; img.classList.add("pop");
        shown = key;
        render(key);
        card.classList.add("show");
        hint && hint.classList.add("gone");
        play(audioPath(key, lang));
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          card.classList.remove("show");
          btn.classList.remove("on");
        }, 3500);
      });
    });

    langBtn.addEventListener("click", () => {
      lang = lang === "mt" ? "en" : "mt";
      langBtn.dataset.lang = lang;
      langBtn.setAttribute("aria-label", lang === "mt" ? "Language: Maltese. Switch to English" : "Language: English. Switch to Maltese");
      if (langLabel) langLabel.textContent = lang === "mt" ? "MALTI" : "ENGLISH";
      if (shown && card.classList.contains("show")) {
        render(shown);
        play(audioPath(shown, lang));
      }
    });
  }

  // ---- Word chips: Maltese first, then English ----
  document.querySelectorAll(".pair[data-word]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".pair.on").forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
      const a = play(audioPath(chip.dataset.word, "mt"));
      a.addEventListener("ended", () => { if (current === a) play(audioPath(chip.dataset.word, "en")); });
    });
  });

  // ---- Contact form ----
  const form = document.querySelector("form.form");
  if (form) {
    const status = form.querySelector(".status");
    const setTopic = () => { form.dataset.topic = (form.querySelector("input[name=topic]:checked") || {}).value || ""; };
    const wanted = new URLSearchParams(location.search).get("topic");
    if (wanted) {
      const radio = form.querySelector(`input[name=topic][value="${CSS.escape(wanted)}"]`);
      if (radio) radio.checked = true;
    }
    if (new URLSearchParams(location.search).get("sent") === "1") {
      status.className = "status ok";
      status.textContent = "Thank you! Your message is on its way, and we'll reply by email.";
    }
    setTopic();
    form.addEventListener("change", setTopic);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      button.textContent = "Sending…";
      status.className = "status";
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Something went wrong.");
        form.reset();
        setTopic();
        status.className = "status ok";
        status.textContent = "Thank you! Your message is on its way, and we'll reply by email.";
      } catch (err) {
        status.className = "status err";
        status.textContent = `${err.message} You can also email hello@lingwaexplorers.com directly.`;
      } finally {
        button.disabled = false;
        button.textContent = "Send message";
      }
    });
  }
})();
