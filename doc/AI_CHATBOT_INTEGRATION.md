# How to Integrate an AI Chatbot – WhyNot Productions Homepage

Guide for adding an AI chatbot so visitors can chat directly on the site. The site is **static Astro on Netlify**; the chatbot can be a third-party widget (easiest) or a custom UI that talks to an AI API via a serverless function.

---

## 1. Overview

**Goal:** Let visitors have a text conversation with an AI (e.g. answer questions about you, courses, workshops, booking) without leaving the site.

**Options:**

| Approach | Effort | Control | Cost |
|----------|--------|---------|------|
| **Third-party chat widget** (Crisp, Intercom, Chatbase, etc.) | Low – add script + config | Less – their UI and logic | Free tier or subscription |
| **Custom chat UI + Netlify Function + AI API** (OpenAI, Anthropic) | Medium – build UI + one serverless endpoint | Full – your copy, model, and UX | Pay per API use |

Use a **widget** for the fastest path; use **custom** if you want your own design and full control over prompts and model.

---

## 2. Option A – Third-party AI chat widget

Many tools offer a script you embed; they host the AI and the chat UI.

### Steps (generic)

1. **Sign up** for a provider that offers an AI chatbot and website embed, for example:
   - [Crisp](https://crisp.chat/) – Chat + AI bots, embed script.
   - [Intercom](https://www.intercom.com/) – Product messaging + bots.
   - [Chatbase](https://www.chatbase.co/) – Train a bot on your content, embed.
   - [Botpress](https://botpress.com/) – Build flows or AI, embed or API.
   - [Tars](https://www.tars.io/) – Conversational bots, embed.
2. **Create your bot** in their dashboard (e.g. upload your site or FAQ, set answers, or connect an AI).
3. **Get the embed snippet** (usually a `<script>` tag and sometimes a site ID).
4. **Add the script to the site** so it loads on every page (e.g. in `Layout.astro` before `</body>`), and set any config (e.g. position, greeting).
5. **Never put API keys in the script** if the provider gives you a public "website ID" – use that. If they require a secret key for AI, it must stay on the server (see Option B).

### Where to put the embed in this project

- **File:** `systems/frontend/src/layouts/Layout.astro`
- **Place:** Inside `<body>`, after `<slot />`, before `</body>`.

Example (placeholder – replace with real snippet from your provider):

```html
<body class="dots">
  <slot />
  <!-- AI chat widget: replace with your provider's script -->
  <script is:inline src="https://your-provider.com/embed.js" data-website-id="YOUR_ID"></script>
</body>
```

Use `is:inline` in Astro so the script is not processed and runs in the browser as the provider expects. If the provider gives you a React/Web Component, you can mount it in a client-side Astro component instead.

### Checklist (widget)

- [ ] Choose provider and create bot (train on your pages / FAQ if supported).
- [ ] Get embed snippet; confirm no secret keys are exposed in the script.
- [ ] Add snippet in `Layout.astro` (or a dedicated partial included in the layout).
- [ ] Set `PUBLIC_*` or provider-specific env in Netlify only if the provider needs a non-secret site ID in the script.
- [ ] Test on dev and after deploy; check mobile and accessibility (focus, labels).

---

## 3. Option B – Custom chat UI + AI API (Netlify Function)

You build a small chat UI (e.g. floating button + message list) and send messages to a **Netlify Function** that calls an AI API (OpenAI, Anthropic, etc.). The API key stays in the function (server), never in the browser.

### High-level flow

1. Visitor types a message in your chat UI.
2. Frontend sends a **POST** to a Netlify Function (e.g. `/.netlify/functions/chat`).
3. The function calls the AI API with:
   - System prompt (e.g. "You are the assistant for WhyNot Productions. You help with …").
   - Conversation history (or last N messages).
   - User message.
4. AI responds; function returns the response to the frontend.
5. UI appends the reply to the conversation.

### Where things live

| Part | Location |
|------|----------|
| Chat UI (button, messages, input) | e.g. `systems/frontend/src/components/ChatWidget.astro` + client script (or small framework island). |
| API route (server) | `systems/frontend/netlify/functions/chat.ts` (or `chat.js`). |
| Env (API key) | Netlify: Site → Environment variables. Local: `.env` (gitignored). |
| Layout | Include the chat component in `Layout.astro` so it appears on all pages (or only selected ones). |

### Netlify Function example (Node)

Create **`systems/frontend/netlify/functions/chat.ts`** (or `.js`):

- Read `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) from `process.env`.
- Parse POST body: `{ messages: [{ role, content }, ...] }`.
- Call OpenAI `chat.completions.create` (or Anthropic equivalent) with a system prompt that describes you, courses, workshops, and booking (e.g. "Book at cal.com/whynotproductions").
- Return `{ reply: assistantMessage }` and set CORS headers so your frontend can call it.

Important:

- **Never** send the API key to the client. Only the serverless function uses it.
- Use **rate limiting** (e.g. by IP or session) to avoid abuse.
- Optionally **log or store** conversations only if you have a privacy/compliance plan.

### Frontend (Astro)

- Add a **Chat** component that:
  - Renders a floating button and a panel (messages list + input).
  - Uses **client-side JavaScript** (e.g. `<script>` in the component, or a small island with `client:load`) to:
    - POST user message to `/.netlify/functions/chat`.
    - Append user and assistant messages to the UI.
- Style the panel to match your site (e.g. same card style, red accent). Keep it accessible (keyboard, focus, labels).

### Env and security

- **Local:** `systems/frontend/.env` with `OPENAI_API_KEY=sk-...` (add `.env` to `.gitignore` if not already).
- **Netlify:** Site → Environment variables → add `OPENAI_API_KEY` (or the key your function uses). Do not expose it to the client.
- In the function, validate origin/Referer if you want to restrict calls to your domain.

### Checklist (custom)

- [ ] Create Netlify Function that reads API key from env and calls AI API with a fixed system prompt.
- [ ] Implement CORS and optional rate limiting.
- [ ] Build chat UI component; wire "Send" to POST and display replies.
- [ ] Include chat component in `Layout.astro` (or chosen pages).
- [ ] Add `OPENAI_API_KEY` (or equivalent) in Netlify env only; never in repo or client.
- [ ] Test locally with `netlify dev` (so functions run) and after deploy.

---

## 4. Recommendation for this project

- **Quick win:** Use **Option A** (e.g. Crisp or Chatbase) – embed script, train bot on your homepage/FAQ, add snippet in `Layout.astro`. No backend or API keys to manage.
- **Full control and your branding:** Use **Option B** – one Netlify Function + small chat component; system prompt can clearly describe Zerwiz, WhyNot Productions, courses, and Cal.com booking. Keep API key in Netlify env only.

---

## 5. Where to document after you integrate

- **Repo:** Add a short note in `systems/frontend/README.md` (e.g. "Chat widget: see `tools/doc/AI_CHATBOT_INTEGRATION.md`. Env: …").
- **Changelog:** In `docs/Project Management/CHANGELOG.md` add an entry when you add or change the chatbot (e.g. "Add AI chat widget (Crisp)" or "Add custom chat + Netlify Function for OpenAI").

---

*Update this doc when you add a specific provider or change the integration (e.g. new function path or env var names).*
