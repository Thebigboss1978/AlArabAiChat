/**
 * AlArab777.js – 1‑file Node app (Express + static UI + Ollama chat proxy)
 * 
 * Usage:
 *   1. npm install
 *   2. node AlArab777.js
 *   3. Open http://localhost:5173 in your browser (or 5000 if you prefer)
 *
 *  - The UI (HTML+JS+CSS) is embedded inside this file.
 *  - /api/chat forwards prompt to Ollama (default: gpt-oss-20b, change DEFAULT_MODEL)
 *
 * Author: AlArab777 (based on your UI + server)
 * Date: 2025‑09‑16
 */

import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

/* -------------------------
   1. Configuration
---------------------------*/
const DEFAULT_MODEL = "gpt-oss-20b";   // <-- change to whatever you have
const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";
const UI_PORT          = 5173;          // port to serve the web UI
const API_PORT         = 5000;          // port for /api/chat (if you want separate)

const PORT = process.env.PORT || UI_PORT; // the server will listen on this port

/* -------------------------
   2. HTML + CSS + Vanilla JS
   (the entire UI that you supplied earlier)
---------------------------*/
const UI_HTML = /*html*/ `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>AlArab777 AI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- ------------- styles ------------- -->
    <style id="style" ></style>
    <!-- ------------- scripts ------------- -->
    <script type="module" src="/client/main.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

/* ------------- embed client ------------- */
const CLIENT_DIR = new Map([
  [
    "/client/main.js",
    /*js*/ `import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import App from "./App.js";

render(() => <App />, document.getElementById("root"));`,
  ],
  [
    "/client/App.js",
    /*js*/ `import { createSignal } from "solid-js";

function App() {
  const [input, setInput] = createSignal("");
  const [messages, setMessages] = createSignal([]);

  const sendMessage = async () => {
    const userMsg = input();
    if (!userMsg.trim()) return;
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMsg }),
    });

    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { user: userMsg, bot: data.reply ?? "Error" },
    ]);
  };

  return (
    <div class="p-6 font-sans space-y-3">
      <h1 class="text-3xl font-bold mb-4 text-center">
        ⚡ AlArab777 AI ⚡
      </h1>

      <div class="space-y-2 mb-6">
        {messages().map((msg, i) => (
          <div key={i}>
            <p class="text-blue-600"><b>أنت:</b> {msg.user}</p>
            <p class="text-green-600"><b>الذكاء:</b> {msg.bot}</p>
          </div>
        ))}
      </div>

      <div class="flex gap-2">
        <input
          class="border p-2 flex-grow rounded"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="اكتب رسالتك هنا..."
        />
        <button
          class="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={sendMessage}
        >
          أرسل
        </button>
      </div>
    </div>
  );
}

export default App;`,
  ],
]);

/* ------------- bundled CSS – replicate your original CSS ---------- */
const EMBEDDED_CSS = /*css*/ `
:root{--bg:#0a0a0a;--bg-soft:#0f0f0f;--panel:#111214;--card:#0b0c0e;--gold:#f2c94c;--gold2:#facc15;--emerald:#34d399;--red:#ef4444;--cyan:#22d3ee;--muted:#9ca3af;--glow:0 0 0.6rem rgba(250, 204, 21, 0.65),0 0 1.2rem rgba(250, 204, 21, 0.35);--glow-green:0 0 0.6rem rgba(52, 211, 153, .6),0 0 1.2rem rgba(52, 211, 153, .35);--ring: 1px solid rgba(255,255,255,.08);--radius: 20px;--blur: 20px;--grid-gap: clamp(.6rem, 1.5vmin, 1.4rem);--card-size: clamp(92px, 16vmin, 160px);--pad: clamp(8px, 1.5vmin, 16px);}
*{box-sizing:border-box}html,body{height:100%;margin:0;background:var(--bg);color:white;overflow:hidden;font-family:ui-rounded, system-ui, -apple-system, Segoe UI, Arial, sans-serif;}
/* … (trimmed) – paste the whole style block from your original file here … */
body{margin:0;background:var(--bg);color:white;overflow:hidden;font-family:ui-rounded, system-ui, -apple-system, Segoe UI, Arial, sans-serif;}
`; /* Add full CSS from your file in a real build */

/* -------------------------
   3. Initialize server
---------------------------*/
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve the embedded CSS when requested
app.get("/style.css", (req, res) => {
  res.setHeader("Content-Type", "text/css");
  res.send(EMBEDDED_CSS);
});

// Serve the main HTML (index.html)
app.get("/", (req, res) => {
  // Replace <style> placeholder to inject CSS path
  const html = UI_HTML.replace(
    '<style id="style" ></style>',
    `<link rel="stylesheet" href="/style.css">`
  );
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// Serve the client JS assets
app.use("/", (req, res, next) => {
  if (CLIENT_DIR.has(req.path)) {
    res.setHeader("Content-Type", getMime(req.path));
    res.send(CLIENT_DIR.get(req.path));
  } else {
    next();
  }
});

/* -------------------------
   4. /api/chat – forwards to Ollama
---------------------------*/
app.post("/api/chat", async (req, res) => {
  const { prompt, model } = req.body;
  const useModel = model || DEFAULT_MODEL;
  let ollamaResponse;

  try {
    ollamaResponse = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: useModel,
        prompt,
        stream: false, // we just need the complete response
      }),
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      console.error("Ollama error:", errText);
      return res
        .status(500)
        .json({ error: "Ollama API error", details: errText });
    }

    const body = await ollamaResponse.json();
    // Ollama returns `{ model, response, done, ... }`
    const reply = body.response ?? "No response";
    res.json({ reply });
  } catch (e) {
    console.error("Error contacting Ollama:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------------
   5. Helper – Mime types for our tiny asset map
---------------------------*/
function getMime(path) {
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".html")) return "text/html";
  return "application/octet-stream";
}

/* -------------------------
   6. Start listening
---------------------------*/
app.listen(PORT, () => {
  console.log(
    `🚀 AlArab777 app running – UI: http://localhost:${PORT} | /api/chat available`
  );
});
