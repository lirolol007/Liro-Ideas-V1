# Liro-Creations – Einrichtung

Aufbau: **GitHub Pages** (Seite) + **Cloudflare Worker** (versteckt Passwort und API-Keys) + **Pages CMS** (Texte ändern).

## 1. Worker (Cloudflare, kostenlos)
1. Konto auf cloudflare.com → Workers & Pages → *Create Worker* → Code aus `worker/worker.js` einfügen → Deploy.
2. Unter *Settings → Variables and Secrets* anlegen:
   - Secret `APP_PASSWORD` – dein Login-Passwort
   - Secret `ANTHROPIC_API_KEY` – von console.anthropic.com
   - Secret `APIFY_TOKEN` – von apify.com (Account → Integrations)
   - Variable `ALLOWED_ORIGIN` = `https://creations.liro-socials.me`
3. Worker-URL kopieren und in `index.html` bei `const API = "..."` eintragen.

## 2. GitHub Pages
1. Neues **öffentliches** Repo, alle Dateien hochladen (keine Keys im Repo, die liegen nur im Worker).
2. Settings → Pages → Branch `main`, Ordner `/ (root)` → Custom domain `creations.liro-socials.me`, „Enforce HTTPS“ aktivieren.
3. Bei deinem Domain-Anbieter DNS-Eintrag anlegen: Typ `CNAME`, Name `creations`, Ziel `DEIN-GITHUB-NAME.github.io`.

## 3. Pages CMS
Auf app.pagescms.org mit GitHub anmelden, Repo auswählen. Unter „Seitentexte“ kannst du alle Texte ändern (`content/site.json`).

## Hinweise
- Die Seite ist öffentlich erreichbar, der Generator aber nur mit Passwort nutzbar. Ohne Passwort kann niemand deine API-Kosten verursachen.
- Modell ändern: Variable `MODEL` im Worker setzen.
- Falls Apify die Suche anders erwartet, den Actor „TikTok Scraper“ (clockworks) dort einmal testen und Eingabefelder in `worker.js` anpassen.
