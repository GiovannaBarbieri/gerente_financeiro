import express from "express";
import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const watch = !process.argv.includes("--no-watch");
const app = express();
const port = Number(process.env.FRONTEND_PORT ?? 5173);
const assetVersion = Date.now();

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gerente Financeiro</title>
    <link rel="stylesheet" href="/assets/styles.css?v=${assetVersion}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/app.js?v=${assetVersion}"></script>
  </body>
</html>`;

const aliasPlugin = {
  name: "path-aliases",
  setup(build) {
    const aliases = {
      "@app/": "src/app/",
      "@features/": "src/features/",
      "@shared/": "src/shared/"
    };
    build.onResolve({ filter: /^@(app|features|shared)\// }, (args) => {
      const alias = Object.keys(aliases).find((key) => args.path.startsWith(key));
      if (!alias) return undefined;
      const resolved = path.resolve(args.path.replace(alias, aliases[alias]));
      const candidates = [resolved, `${resolved}.tsx`, `${resolved}.ts`, path.join(resolved, "index.tsx"), path.join(resolved, "index.ts")];
      return { path: candidates.find((candidate) => existsSync(candidate)) ?? resolved };
    });
  }
};

async function prepare() {
  await mkdir("dist/assets", { recursive: true });
  await writeFile("dist/index.html", html);
  await execFileAsync("cmd.exe", ["/d", "/s", "/c", "npx.cmd tailwindcss -i src/shared/styles/global.css -o dist/assets/styles.css"]);
  const context = await esbuild.context({
    entryPoints: ["src/app/main.tsx"],
    bundle: true,
    outfile: "dist/assets/app.js",
    format: "esm",
    jsx: "automatic",
    jsxImportSource: "react",
    sourcemap: true,
    plugins: [aliasPlugin]
  });

  if (watch) {
    await context.watch();
  } else {
    await context.rebuild();
    await context.dispose();
  }
}

await prepare();

app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.static("dist"));
app.get("*", (_req, res) => res.sendFile("index.html", { root: "dist" }));
app.listen(port, () => {
  console.log(`Frontend em http://localhost:${port}`);
});
