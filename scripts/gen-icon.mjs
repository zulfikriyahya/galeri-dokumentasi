import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

const svg = readFileSync("public/favicon.svg");

await sharp(svg).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(svg).resize(512).png().toFile("public/icons/icon-512.png");
await sharp(svg).resize(1200).png().toFile("public/og.png");

console.log("Icons successfully generated from favicon.svg!");