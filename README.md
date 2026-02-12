# Hoja Quote App

A customer-facing quote app for the Hoja project.

## Run

```bash
npm install
npm run dev
```

Open:
- `/quote` for customer proposal view
- `/quote/line-items` for exact line item table
- `/quote/investment-appendix` for investment appendix with ROI scenarios and forecast-vs-realized comparison

## Build

```bash
npm run build
npm run preview
```

## Data model

All quote values are loaded from:

- `data/quote.hoja.powerbox.json`

No money values are hardcoded in the UI.

## PDF export

Use **Download PDF** in customer view. It opens browser print flow; save as PDF.

## Integrity check

In development mode, an integrity banner is shown. It validates computed totals against totals in JSON and reports PASS/MISMATCH.

