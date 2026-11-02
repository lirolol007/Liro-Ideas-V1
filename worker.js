// Cloudflare Worker: hält alle Geheimnisse (Passwort, API-Keys) außerhalb von GitHub.
// Secrets: APP_PASSWORD, ANTHROPIC_API_KEY, APIFY_TOKEN | Variable: ALLOWED_ORIGIN, optional MODEL

const SYSTEM = `Du bist ein TikTok-Stratege. Du bekommst eine Nische und eine Liste aktuell erfolgreicher TikToks (Caption, Hashtags, Views, Likes, Shares, Kommentare).
Erkenne Muster über alle Videos hinweg und leite daraus neue, eigenständige Videoideen ab. Keine Skripte, nur knappe Stichpunkte. Kopiere keine Videos.
Antworte NUR mit JSON, ohne Text drumherum, in diesem Format:
{"muster":["4-6 kurze Stichpunkte zu Themen, Hooks, Formaten und Wiederholungen bei den Erfolgreichen"],
"ideen":[{"titel":"kurz","hook":"erster Satz oder erste Szene in einem Stichpunkt","format":"z. B. Talking Head, POV, Liste, Vorher/Nachher","warum":"ein Stichpunkt, warum das funktionieren kann"}]}
Liefere genau 8 Ideen. Sprache: Deutsch.`;

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    const out = (d, s = 200) =>
      new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return out({ error: "Nicht erlaubt" }, 405);

    let b;
    try { b = await req.json(); } catch { return out({ error: "Ungültige Anfrage" }, 400); }
    if (!b.password || b.password !== env.APP_PASSWORD) return out({ error: "Falsches Passwort" }, 401);
    if (b.action === "login") return out({ ok: true });

    const niche = String(b.niche || "").trim().slice(0, 80);
    const count = Math.min(Math.max(parseInt(b.count) || 30, 10), 50);
    if (!niche) return out({ error: "Bitte eine Nische eingeben." }, 400);

    try {
      // 1) Erfolgreiche TikToks holen (Apify)
      const ap = await fetch(
        `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${env.APIFY_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchQueries: [niche], resultsPerPage: count, shouldDownloadVideos: false, shouldDownloadCovers: false }),
        }
      );
      if (!ap.ok) throw new Error("TikTok-Daten konnten nicht abgerufen werden.");
      const items = await ap.json();
      const vids = items
        .sort((x, y) => (y.playCount || 0) - (x.playCount || 0))
        .slice(0, count)
        .map((v) => ({
          caption: (v.text || "").slice(0, 200),
          tags: (v.hashtags || []).map((h) => h.name).slice(0, 6),
          views: v.playCount, likes: v.diggCount, shares: v.shareCount, comments: v.commentCount,
        }));
      if (!vids.length) throw new Error("Keine Videos zu dieser Nische gefunden.");

      // 2) Claude wertet aus
      const cl = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: env.MODEL || "claude-sonnet-5-5",
          max_tokens: 2500,
          system: SYSTEM,
          messages: [{ role: "user", content: `Nische: ${niche}\nVideos:\n${JSON.stringify(vids)}` }],
        }),
      });
      if (!cl.ok) throw new Error("Die Auswertung ist fehlgeschlagen.");
      const d = await cl.json();
      const txt = (d.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      return out(JSON.parse(txt));
    } catch (e) {
      return out({ error: e.message || "Unbekannter Fehler" }, 500);
    }
  },
};
