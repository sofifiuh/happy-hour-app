// Two builds share this code. The preview build uses hash URLs and relative
// asset paths so it runs from any folder; the alittlehang.com build
// (VITE_ROUTER=browser) uses real paths, so every venue keeps its existing
// crawlable address at /spots/<id>.html.
export const BROWSER_ROUTER = import.meta.env.VITE_ROUTER === "browser";

export const asset = (file: string) => (/^https?:/.test(file) ? file : import.meta.env.BASE_URL + file);

export const spotPath = (id: string) => `/spots/${id}.html`;

export const absoluteUrl = (path: string) =>
  BROWSER_ROUTER ? `${location.origin}${path}` : `${location.origin}${location.pathname}#${path}`;

export function queryParams() {
  return new URLSearchParams(BROWSER_ROUTER ? location.search : (location.hash.split("?")[1] ?? ""));
}
