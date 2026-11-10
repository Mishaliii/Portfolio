export const SITE_URL: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://mishal-portfolio.pages.dev";
