import { createHash, type Hash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

// Danner dist/sw.js ud fra build/serviceWorker.template.js ved build:
//  - påkrævede filer: alle filer i dist/assets (appens side "/" hentes altid af service workeren),
//  - øvrige filer: manifest, fonte og ikoner (gemmes, hvis det lykkes),
//  - cache-versionen: en hash af filernes navne og indhold (inkl. index.html), så hver deploy med
//    ændringer får en ny cache, og gamle filer (også fonte og ikoner) ryddes automatisk.
// Kører kun ved build; under udvikling registreres service workeren ikke.

export type ServiceWorkerPluginOptions = {
  /** Absolut sti til skabelonen. */
  templatePath: string;
};

const serviceWorkerFileName = "sw.js";
const appPageFile = "/index.html";
const optionalFixedUrls = ["/manifest.webmanifest"];
const publicFoldersToPrecache = ["fonts", "icons"];
const versionPlaceholder = "__CACHE_VERSION__";
const requiredPlaceholder = "/* REQUIRED_ASSET_URLS */ []";
const optionalPlaceholder = "/* OPTIONAL_URLS */ []";

function publicFileUrls(publicDir: string): string[] {
  const urls: string[] = [];
  for (const folder of publicFoldersToPrecache) {
    const folderPath = path.join(publicDir, folder);
    if (!existsSync(folderPath)) {
      continue;
    }
    for (const fileName of readdirSync(folderPath).sort()) {
      urls.push(`/${folder}/${fileName}`);
    }
  }
  return urls;
}

/** Filens indhold fra dist (eller public, hvis den ikke er kopieret endnu). */
function fileContent(url: string, outDir: string, publicDir: string): Buffer | undefined {
  const candidates = [path.join(outDir, url), path.join(publicDir, url)];
  const existing = candidates.find((candidate) => existsSync(candidate));
  return existing === undefined ? undefined : readFileSync(existing);
}

/** De filer, der findes. Navn og indhold lægges i hashen (cache-versionen). */
function existingUrls(
  urls: readonly string[],
  outDir: string,
  publicDir: string,
  hash: Hash,
): string[] {
  const found: string[] = [];
  for (const url of urls) {
    const content = fileContent(url, outDir, publicDir);
    if (content === undefined) {
      continue;
    }
    found.push(url);
    hash.update(url);
    hash.update(content);
  }
  return found;
}

export function serviceWorkerPlugin(options: ServiceWorkerPluginOptions): Plugin {
  let resolvedConfig: ResolvedConfig | undefined;

  return {
    name: "jobbuddy-service-worker",
    apply: "build",

    configResolved(config): void {
      resolvedConfig = config;
    },

    writeBundle(outputOptions, bundle): void {
      if (resolvedConfig === undefined) {
        return;
      }
      const outDir = outputOptions.dir ?? resolvedConfig.build.outDir;
      const publicDir = resolvedConfig.publicDir;

      const assetUrls = Object.keys(bundle)
        .filter((fileName) => fileName.startsWith("assets/"))
        .sort()
        .map((fileName) => `/${fileName}`);

      const hash = createHash("sha256");
      // index.html gemmes af service workeren som "/", men dens indhold indgår i versionen.
      existingUrls([appPageFile], outDir, publicDir, hash);
      const requiredUrls = existingUrls(assetUrls, outDir, publicDir, hash);
      const optionalUrls = existingUrls(
        [...optionalFixedUrls, ...publicFileUrls(publicDir)],
        outDir,
        publicDir,
        hash,
      );
      const cacheVersion = hash.digest("hex").slice(0, 16);

      const template = readFileSync(options.templatePath, "utf8");
      const serviceWorker = template
        .replace(versionPlaceholder, cacheVersion)
        .replace(requiredPlaceholder, JSON.stringify(requiredUrls))
        .replace(optionalPlaceholder, JSON.stringify(optionalUrls));
      writeFileSync(path.join(outDir, serviceWorkerFileName), serviceWorker);
    },
  };
}
