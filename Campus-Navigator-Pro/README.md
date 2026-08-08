# Campus Navigator Pro

GitHub-ready zero-cost MVP for the Campus Live Map / Digital Twin concept.

## What is included

- 3D interactive campus shell
- Building selection and entrance stage
- Floor map with room hotspots
- Room/lab/facility search
- Shortest-path graph routing
- Multi-floor route nodes
- Animated 3D route arrows
- Guided navigation panel
- Responsive desktop/mobile layout
- No paid API keys

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Replace with your real college

Edit the `buildings`, `facilities`, and graph data in:

```text
src/main.tsx
```

For a production version, move that data into JSON/PostgreSQL and generate the navigation graph from actual corridor/door/stair geometry.

## GitHub upload

```bash
git init
git add .
git commit -m "Initial Campus Digital Twin MVP"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

This export is intentionally self-contained and does not require environment variables or paid services.
