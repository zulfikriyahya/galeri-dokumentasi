import { mkdirSync, readFileSync, writeFileSync } from "fs";
import pngToIco from "png-to-ico";
import sharp from "sharp";
mkdirSync("public/icons", { recursive: true });
const svg = readFileSync("public/favicon.svg");
await sharp(svg).resize(16).png().toFile("public/icons/favicon-16.png");
await sharp(svg).resize(32).png().toFile("public/icons/favicon-32.png");
await sharp(svg).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(svg).resize(512).png().toFile("public/icons/icon-512.png");
await sharp(svg).resize(1200).png().toFile("public/og.png");
try {
  const buf = await pngToIco(["public/icons/favicon-16.png", "public/icons/favicon-32.png"]);
  writeFileSync("public/favicon.ico", buf);
  console.log("✓ Icons and favicon.ico successfully generated from favicon.svg!");
} catch (error) {
  console.error("❌ Failed to generate favicon.ico:", error);
}
