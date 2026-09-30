// Lingwa Explorers — shared behaviour: the mobile menu and the contact form.

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
})();
