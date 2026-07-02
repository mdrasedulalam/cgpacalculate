# 🎓 CGPA Calculator

A free, fast, and private CGPA/GPA calculator built for Business Administration students on a 4.00 grading scale. No sign-up, no backend, no data collection — everything runs entirely in your browser.

**[▶ Live Demo](#)** — *(replace this link with your GitHub Pages URL after deployment — see below)*

![screenshot placeholder](assets/screenshots/preview.png)
*(Add a real screenshot of the light mode UI at `assets/screenshots/preview.png` and the dark mode UI at `assets/screenshots/preview-dark.png`, then update the paths above.)*

---

## ✨ Features

- **Semester GPA & cumulative CGPA** — enter this semester's courses, and optionally add your previous CGPA + completed credits to instantly see your updated cumulative CGPA.
- **Signature CGPA gauge** — an animated dial visualizes your result the moment you calculate.
- **Add/remove courses on the fly** with automatic row renumbering.
- **Real-time validation** with clear, per-field error messages — no silent failures.
- **Light & dark mode**, remembered across visits, with no flash-of-wrong-theme on load.
- **Autosave** — your course list is saved to your browser's local storage as you type, so accidental refreshes don't lose your work. Nothing is ever sent to a server.
- **Copy summary to clipboard** and **print / save as PDF** for your records.
- **Fully responsive** — a clean card layout on phones, a full table on tablets and desktops.
- **Accessible** — semantic HTML, visible keyboard focus states, `aria-live` announcements, and `prefers-reduced-motion` support.
- **Zero dependencies** — plain HTML, CSS, and JavaScript. Loads instantly, works offline once cached.

---

## 📐 Grading scale

| Grade | Points | Grade | Points |
|-------|--------|-------|--------|
| A+    | 4.00   | B     | 3.00   |
| A     | 3.75   | B−    | 2.75   |
| A−    | 3.50   | C+    | 2.50   |
| B+    | 3.25   | C     | 2.25   |
|       |        | D     | 2.00   |
|       |        | F     | 0.00   |

Need a different scale? See [Customizing the grading scale](#customizing-the-grading-scale) below.

---

## 📁 Project structure

```
cgpa-calculator/
├── index.html              # Page structure & content
├── css/
│   └── style.css           # All styling (light/dark themes, layout, print styles)
├── js/
│   └── script.js           # Calculator logic, validation, gauge, theme, autosave
├── assets/
│   ├── favicon.svg         # Browser tab icon
│   └── screenshots/        # Put README screenshots here
├── README.md
└── LICENSE
```

---

## 🚀 Getting started locally

You don't need Node, a build tool, or any dependencies.

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/cgpa-calculator.git
   cd cgpa-calculator
   ```
2. **Open it**
   - Easiest: double-click `index.html` to open it in your browser, or
   - Recommended (avoids browser quirks with local files): serve it with any static server, e.g.
     ```bash
     python3 -m http.server 8000
     # then visit http://localhost:8000
     ```

That's it — there's nothing to install or build.

---

## 🌐 Deploying to GitHub Pages

1. Push this project to a GitHub repository (public or private, Pages works with both on paid plans; public repos get Pages for free).
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BBA CGPA Calculator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cgpa-calculator.git
   git push -u origin main
   ```
2. On GitHub, open your repository → **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the **`main`** branch and the **`/ (root)`** folder, then **Save**.
5. Wait a minute or two, then GitHub will publish your site at:
   ```
   https://<your-username>.github.io/cgpa-calculator/
   ```
6. Update the **Live Demo** link at the top of this README with that URL.

No further configuration is required — the project uses only relative paths, so it works correctly in a GitHub Pages subdirectory.

---

## 📖 Usage guide

1. **Enter your courses.** For each row, type the course name, its credit hours (0.5–6.0), and select the letter grade you received.
2. **Add more rows** with the **Add course** button as needed; remove a row with the **✕** icon (the last remaining row is cleared instead of deleted).
3. *(Optional)* Open **“Include previous CGPA”** and enter your previous CGPA and total completed credits to see your updated **cumulative CGPA** alongside this semester's GPA.
4. Click **Calculate CGPA** (or press **Enter** while inside the table, or **Ctrl/Cmd + Enter** anywhere).
5. Review your **Semester GPA**, **quality points**, and **transcript table** in the results panel. Use the copy icon to copy a text summary, or the print icon to save a PDF.
6. Use **Reset all** to clear everything and start fresh.

Your entries are saved automatically in your browser, so you can safely close the tab and come back later — use **Reset all** to clear that saved data.

---

## 🎨 Customizing

### Customizing the grading scale
Open `js/script.js` and edit the `GRADE_MAP` object near the top of the file:

```js
var GRADE_MAP = {
  'A+': 4.00, 'A': 3.75, 'A-': 3.50,
  'B+': 3.25, 'B': 3.00, 'B-': 2.75,
  'C+': 2.50, 'C': 2.25,
  'D': 2.00, 'F': 0.00
};
```
Add, remove, or rename grades and their grade-point values as needed — the dropdown and calculations update automatically.

### Customizing colors & fonts
All colors, spacing, and fonts are defined as CSS custom properties at the top of `css/style.css` under `:root` (light theme) and `[data-theme="dark"]` (dark theme). Change a value once and it updates everywhere.

---

## 🖥️ Browser support

Works in all current versions of Chrome, Edge, Firefox, and Safari, on desktop and mobile. Uses modern (but broadly supported) CSS such as `color-mix()` and `:has()` for minor visual polish — the calculator remains fully functional even in browsers that don't support them.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-improvement`.
3. Make your changes, keeping the project dependency-free (plain HTML/CSS/JS).
4. Test in both light and dark mode, and at mobile/tablet/desktop widths.
5. Commit and push, then open a pull request describing your change.

Bug reports and feature requests are just as welcome — please open an issue with clear steps to reproduce (for bugs) or the use case (for features).

---

## 📄 License

Released under the [MIT License](LICENSE) — free to use, modify, and distribute, including for your own department or university.

---

## 💡 Ideas for further enhancement

Not implemented here to keep the app simple, but natural next steps if you want to extend it:
- A **course history log** across multiple semesters, stored locally, with a small chart of CGPA trend over time.
- **Export to CSV/Excel** of the transcript table for record-keeping.
- **Target CGPA planner** — “what grade do I need in my remaining courses to reach a CGPA of X?”
- **Installable PWA** support (offline caching + “Add to Home Screen”) via a small manifest and service worker.
- **i18n** — translate the UI for non-English-speaking student bodies.
