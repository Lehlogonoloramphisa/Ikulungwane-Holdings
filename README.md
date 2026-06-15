# Ikulungwane React Site

This is a standalone React + Vite version of the Ikulungwane Holdings website.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Local Data

Public pages, contact forms, bookings, and admin CRUD screens use browser `localStorage` through `src/api/localClient.js`.

Data entered in the admin area is stored in the current browser only. Clearing site data will reset the local content.
