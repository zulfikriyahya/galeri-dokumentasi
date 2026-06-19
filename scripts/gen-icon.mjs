import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function draw(size) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    const r = size * 0.25;

    ctx.fillStyle = "#0969da";
    roundRect(ctx, 0, 0, size, size, size * 0.2);
    ctx.fill();

    const pad = size * 0.14;
    const gap = size * 0.06;
    const half = (size - pad * 2 - gap) / 2;

    const cells = [
        [pad, pad, half, half, 1],
        [pad + half + gap, pad, half, half, 0.7],
        [pad, pad + half + gap, half, half, 0.7],
        [pad + half + gap, pad + half + gap, half, half, 0.5],
    ];

    for (const [x, y, w, h, alpha] of cells) {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        roundRect(ctx, x, y, w, h, size * 0.06);
        ctx.fill();
    }

    return c.toBuffer("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

writeFileSync("public/icons/icon-192.png", draw(192));
writeFileSync("public/icons/icon-512.png", draw(512));
writeFileSync("public/og.png", draw(512));
console.log("Icons generated.");