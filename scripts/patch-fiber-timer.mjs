import fs from "node:fs/promises";
import { createFiberTimer } from "./fiber-timer.mjs";
const root = new URL("../node_modules/@react-three/fiber/", import.meta.url);
const pkg = JSON.parse(await fs.readFile(new URL("package.json", root), "utf8"));
if (pkg.version !== "9.7.0")
  throw new Error("Reassess the R3F Timer bridge before using a different renderer version.");
let patched = 0;
for (const file of await fs.readdir(new URL("dist/", root))) {
  if (!/^events-.*\.(js|mjs)$/.test(file)) continue;
  const path = new URL("dist/" + file, root),
    source = await fs.readFile(path, "utf8");
  const next = source.replace(
    /new (THREE(?:__namespace)?)\.Clock\(\)/g,
    (_, namespace) => "(" + createFiberTimer.toString() + ")(" + namespace + ".Timer)",
  );
  if (next !== source) {
    await fs.writeFile(path, next);
    patched++;
  }
}
console.log("R3F 9.7 Timer compatibility: " + patched + " renderer bundles updated.");
