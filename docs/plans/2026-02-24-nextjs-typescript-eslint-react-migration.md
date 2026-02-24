# Next.js TypeScript + ESLint + React Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the current static loan calculator page into a full Next.js React TypeScript page with standard ESLint and verify production build.

**Architecture:** Keep App Router. Convert existing static HTML behavior into a single client component using React state/hooks, Chart.js via `react-chartjs-2`, and `html2canvas` for PNG export. Add standard TypeScript and Next ESLint configs.

**Tech Stack:** Next.js 14, React 18, TypeScript, ESLint (next/core-web-vitals + next/typescript), Chart.js, react-chartjs-2, html2canvas.

---

### Task 1: Project config migration
- Update `package.json` dependencies and scripts for TS + ESLint.
- Add `tsconfig.json`, `next-env.d.ts`, `.eslintrc.json`.
- Convert `app/layout.js` to `app/layout.tsx`.

### Task 2: Convert static page to React component
- Replace redirect page with full `app/page.tsx` client component.
- Port calculation logic, dark/light toggle, responsive UI, charts, and infographic PNG export.
- Move styling into `app/globals.css` and remove static HTML dependency.

### Task 3: Cleanup and verify
- Remove `public/loan-calculator.html`.
- Run `npm install` and `npm run build` to verify.
- Update `README.md` commands and structure.
