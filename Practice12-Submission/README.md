# Practice Work #12 - Smart Campus comparison

Open `REPORT.md` first. The code-based project is in `code-based/`; the local low-code prototype is in `low-code/`. `evidence/` contains command logs and a code-based baseline screenshot.

To run the code-based app, open a terminal in `code-based`, run `npm ci`, then `npm run dev`. To run its checks, use `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

To run the low-code form, open `low-code/standalone.html` directly in a browser. It embeds the configuration and engine so no local server is required. `index.html`, `config.json` and `engine.mjs` are the editable source version. Run its acceptance checks with `node low-code/test.mjs` from this folder.

The low-code implementation is a custom local visual configuration prototype. It is not published to a third-party builder. Screenshots of the code-based baseline and the locally running low-code prototype are in `evidence/`. The PDF also requests a public source repository; see `REPORT.md` for the current submission status. Do not submit this folder as a ZIP if following the PDF's final slide, which prohibits ZIP attachments.
