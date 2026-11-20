import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a página do repositório serve o placar com arquivos locais e relativos", async () => {
  const page = new URL("../index.html", import.meta.url);
  const html = await readFile(page, "utf8");
  assert.match(html, /id="app"/);
  assert.doesNotMatch(html, /http-equiv="refresh"|location\.replace/);

  const sources = [...html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(sources.some((source) => source.endsWith(".js")));
  assert.ok(sources.some((source) => source.endsWith(".css")));
  const files = await Promise.all(sources.map((source) => readFile(new URL(source, page))));
  assert.ok(files.every((file) => file.length > 0));
});
