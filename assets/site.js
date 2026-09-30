// Lingwa Explorers — shared behaviour: the mobile menu, the contact form, and
// the analytics consent banner.

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

  // ---- Analytics, only with consent ----
  // Google Analytics is not loaded at all until the visitor accepts (Consent
  // Mode "basic"). The choice is kept in localStorage; "Cookie settings" in the
  // footer reopens the banner. Leave GA_ID empty to switch all of this off.
  const GA_ID = "G-G9WCGM7QKZ";
  const KEY = "le-analytics-consent";
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch {} },
  };

  function loadAnalytics() {
    if (window.gtag) {
      gtag("consent", "update", { analytics_storage: "granted" });
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    gtag("js", new Date());
    gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(tag);
  }

  // Withdrawing consent: stop collection and remove the cookies GA set.
  function removeAnalytics() {
    if (window.gtag) gtag("consent", "update", { analytics_storage: "denied" });
    const host = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").map((c) => c.split("=")[0].trim())
      .filter((name) => name === "_ga" || name.startsWith("_ga_"))
      .forEach((name) => {
        for (const domain of ["", `; domain=${host}`, `; domain=.${host}`]) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
        }
      });
  }

  function showBanner() {
    if (document.querySelector(".consent")) return;
    const root = document.querySelector('link[rel="stylesheet"]').getAttribute("href").replace("assets/site.css", "");
    const box = document.createElement("div");
    box.className = "consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Analytics cookies");
    box.innerHTML = `
      <p><strong>Can we count your visit?</strong> We'd like to use Google Analytics to see how many people visit and which pages help. It uses cookies, so it only switches on if you say yes. <a href="${root}privacy/#website">Privacy policy</a></p>
      <div class="consent-buttons">
        <button class="btn small light" data-choice="denied">No thanks</button>
        <button class="btn small" data-choice="granted">Accept</button>
      </div>`;
    box.addEventListener("click", (e) => {
      const choice = e.target.closest("[data-choice]")?.dataset.choice;
      if (!choice) return;
      store.set(choice);
      choice === "granted" ? loadAnalytics() : removeAnalytics();
      box.remove();
    });
    document.body.appendChild(box);
  }

  const settings = document.querySelector(".cookie-settings");
  if (GA_ID) {
    const choice = store.get();
    if (choice === "granted") loadAnalytics();
    else if (choice !== "denied") showBanner();
    settings?.addEventListener("click", (e) => { e.preventDefault(); showBanner(); });
  } else if (settings) {
    settings.closest("li").remove();
  }
})();
