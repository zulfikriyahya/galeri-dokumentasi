import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function generateSVG(size) {
    const r = size * 0.2;
    const pad = size * 0.14;
    const gap = size * 0.06;
    const half = (size - pad * 2 - gap) / 2;
    const innerR = size * 0.06;

    return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="#0969da" />
        
        <rect x="${pad}" y="${pad}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,1)" />
        <rect x="${pad + half + gap}" y="${pad}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,0.7)" />
        <rect x="${pad}" y="${pad + half + gap}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,0.7)" />
        <rect x="${pad + half + gap}" y="${pad + half + gap}" width="${half}" height="${half}" rx="${innerR}" fill="rgba(255,255,255,0.5)" />
    </svg>
    `;
}

async function createIcons() {
    const svg192 = Buffer.from(generateSVG(192));
    const svg512 = Buffer.from(generateSVG(512));

    await sharp(svg192).png().toFile("public/icons/icon-192.png");
    await sharp(svg512).png().toFile("public/icons/icon-512.png");
    await sharp(svg512).png().toFile("public/og.png");

    console.log("Icons successfully generated via sharp!");
}

createIcons().catch(console.error);
