// The site is static files; this Worker only runs for requests no file
// matches. It handles POST /api/contact by emailing the message through
// Cloudflare Email Routing, and hands everything else back to the assets
// (which serve 404.html).
//
// CONTACT_TO is a secret set in the Cloudflare dashboard, so the destination
// mailbox is not in this public repository. It must be a verified
// destination address in Email Routing.

import { EmailMessage } from "cloudflare:email";

const FROM = "website@lingwaexplorers.com";
const TOPICS = {
  beta: "Beta tester sign-up",
  feedback: "Feedback",
  question: "Question",
  other: "Message",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return contact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function contact(request, env) {
  const wantsJson = (request.headers.get("Accept") || "").includes("application/json");
  const reply = (status, error) =>
    wantsJson
      ? Response.json(error ? { error } : { ok: true }, { status })
      : error
        ? new Response(`${error} You can also email hello@lingwaexplorers.com.`, { status })
        : Response.redirect(new URL("/contact/?sent=1", request.url), 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(400, "That didn't look like a form.");
  }
  const field = (name, max) => String(form.get(name) || "").trim().slice(0, max);

  // Bots fill in every field; people never see this one.
  if (field("website", 200)) return reply(200);

  const name = oneLine(field("name", 100));
  const email = oneLine(field("email", 200));
  const message = field("message", 5000);
  const topic = TOPICS[field("topic", 20)] ? field("topic", 20) : "other";

  if (!name || !message) return reply(400, "Please fill in your name and a message.");
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) return reply(400, "Please check your email address.");
  if (!env.CONTACT_TO || !env.CONTACT) return reply(503, "The contact form isn't set up yet.");

  const subject = `[lingwaexplorers.com] ${TOPICS[topic]} from ${name}`;
  const body = [
    `${TOPICS[topic]} from the website contact form.`,
    "",
    `Name:  ${name}`,
    `Email: ${email}`,
    `Topic: ${TOPICS[topic]}`,
    "",
    message,
    "",
    "--",
    "Reply to this email to answer them directly.",
  ].join("\r\n");

  const raw = [
    `From: "Lingwa Explorers website" <${FROM}>`,
    `To: <${env.CONTACT_TO}>`,
    `Reply-To: ${encodeWord(name)} <${email}>`,
    `Subject: ${/^[\x20-\x7e]*$/.test(subject) ? subject : `=?UTF-8?B?${base64(subject)}?=`}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@lingwaexplorers.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(body).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");

  try {
    await env.CONTACT.send(new EmailMessage(FROM, env.CONTACT_TO, raw));
  } catch (err) {
    console.error("contact send failed", err);
    return reply(502, "Sorry, the message couldn't be sent.");
  }
  return reply(200);
}

// Header values must not carry line breaks, or a sender could add headers.
const oneLine = (s) => s.replace(/[\r\n]+/g, " ");

const base64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

// A display name for Reply-To: quoted if plain ASCII, otherwise an RFC 2047
// encoded-word, so names like "Ġorġ" survive.
const encodeWord = (s) => (/^[\x20-\x7e]*$/.test(s) && !/["\\]/.test(s) ? `"${s}"` : `=?UTF-8?B?${base64(s)}?=`);
