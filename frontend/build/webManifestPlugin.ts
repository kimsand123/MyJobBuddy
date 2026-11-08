import type { IndexHtmlTransformResult, Plugin } from "vite";

// PWA-manifestet dannes her, så appnavnet kun står ét sted (src/texts/da.ts).
// I dev serveres det af Vite, og ved build skrives det som dist/manifest.webmanifest.

export type WebManifestOptions = {
  name: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
};

const manifestFileName = "manifest.webmanifest";
const appNamePlaceholder = "%APP_NAME%";

function createManifestJson(options: WebManifestOptions): string {
  const manifest = {
    // Fast id, så en installeret app genkendes, selvom start_url ændres senere.
    id: "/",
    name: options.name,
    short_name: options.name,
    description: options.description,
    lang: "da",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return JSON.stringify(manifest, null, 2);
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function webManifestPlugin(options: WebManifestOptions): Plugin {
  const manifestJson = createManifestJson(options);

  return {
    name: "jobbuddy-web-manifest",

    // Navnet sættes ind i <title> og apple-mobile-web-app-title, og theme-color tilføjes,
    // så værdierne kun står ét sted (vite.config.ts og texts/da.ts).
    transformIndexHtml(html: string): IndexHtmlTransformResult {
      return {
        html: html.replaceAll(appNamePlaceholder, escapeHtml(options.name)),
        tags: [
          {
            tag: "meta",
            attrs: { name: "theme-color", content: options.themeColor },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server): void {
      server.middlewares.use("/" + manifestFileName, (_request, response) => {
        response.setHeader("Content-Type", "application/manifest+json");
        response.end(manifestJson);
      });
    },

    generateBundle(): void {
      this.emitFile({ type: "asset", fileName: manifestFileName, source: manifestJson });
    },
  };
}
