#!/usr/bin/env node

// Render a worked AES-256-GCM example as PNG frames.
// Requires `sharp` on NODE_PATH. Encode the frames separately with ffmpeg:
//
//   NODE_PATH=/path/to/node_modules node scripts/render-symmetric-flow-video.cjs \
//     /tmp/journal-symmetric-frames assets/video/symmetric-flow-poster.png
//   ffmpeg -framerate 30 -i /tmp/journal-symmetric-frames/frame-%04d.png \
//     -c:v libx264 -crf 21 -pix_fmt yuv420p -movflags +faststart -an \
//     assets/video/symmetric-flow.mp4
//   ffmpeg -framerate 30 -i /tmp/journal-symmetric-frames/frame-%04d.png \
//     -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -pix_fmt yuv420p -an \
//     assets/video/symmetric-flow.webm

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const width = 1280;
const height = 720;
const fps = 30;
const seconds = 48;
const frameCount = fps * seconds;
const framesDir = process.argv[2];
const posterPath = process.argv[3];

if (!framesDir || !posterPath) {
  console.error("Usage: render-symmetric-flow-video.cjs <frames-dir> <poster-path>");
  process.exit(1);
}

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(posterPath), { recursive: true });

const demo = {
  plaintext: "Meet me at 7 AM",
  aad: "type=meeting;v=1",
  keyHex: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
  nonceHex: "cafebabefacedbaddecaf888",
};

function runDemo() {
  const key = Buffer.from(demo.keyHex, "hex");
  const nonce = Buffer.from(demo.nonceHex, "hex");
  const aad = Buffer.from(demo.aad, "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(demo.plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  const recovered = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  if (recovered !== demo.plaintext) throw new Error("AES-GCM round trip failed");

  const tampered = Buffer.from(ciphertext);
  tampered[0] ^= 0x01;
  let tamperRejected = false;
  try {
    const check = crypto.createDecipheriv("aes-256-gcm", key, nonce);
    check.setAAD(aad);
    check.setAuthTag(tag);
    Buffer.concat([check.update(tampered), check.final()]);
  } catch {
    tamperRejected = true;
  }
  if (!tamperRejected) throw new Error("Tampered ciphertext was not rejected");

  return {
    ciphertextHex: ciphertext.toString("hex"),
    tamperedHex: tampered.toString("hex"),
    tagHex: tag.toString("hex"),
  };
}

const result = runDemo();
const keyLine1 = demo.keyHex.slice(0, 32);
const keyLine2 = demo.keyHex.slice(32);

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const progress = (time, start, end) => smooth((time - start) / (end - start));
const lerp = (start, end, amount) => start + (end - start) * amount;
const sceneOpacity = (time, start, end, feather = 0.35) =>
  clamp((time - start) / feather) * clamp((end - time) / feather);
const appear = (time, at, duration = 0.35) => progress(time, at, at + duration);
const blink = (time, start) => 0.55 + 0.45 * Math.sin((time - start) * Math.PI * 4);

function keyIcon(x, y, opacity = 1, scale = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}">
      <circle cx="0" cy="0" r="16" fill="none" stroke="#b45309" stroke-width="8"/>
      <path d="M14 -4 H58 V8 H48 V20 H36 V8 H14 Z" fill="#f59e0b"/>
      <circle cx="0" cy="0" r="6" fill="#fff7ed"/>
    </g>`;
}

function card(x, y, w, h, title, body, colour = "#2563eb", opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="${w}" height="48" rx="18" fill="${colour}"/>
      <rect x="${x}" y="${y + 30}" width="${w}" height="18" fill="${colour}"/>
      <text x="${x + 22}" y="${y + 31}" class="card-title">${title}</text>
      ${body}
    </g>`;
}

function codeRow(x, y, label, value, note, opacity = 1, colour = "#0f172a") {
  return `
    <g opacity="${opacity}">
      <text x="${x}" y="${y}" class="code-label">${label}</text>
      <text x="${x + 138}" y="${y}" class="code-value" fill="${colour}">${value}</text>
      ${note ? `<text x="${x + 138}" y="${y + 21}" class="code-note">${note}</text>` : ""}
    </g>`;
}

function packet(x, y, opacity = 1, scale = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}">
      <rect x="-320" y="-58" width="640" height="116" rx="18" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="-320" y="-58" width="160" height="116" rx="18" fill="#eff6ff"/>
      <rect x="-178" y="-58" width="170" height="116" fill="#f0fdf4"/>
      <rect x="-8" y="-58" width="200" height="116" fill="#fff1f2"/>
      <rect x="192" y="-58" width="128" height="116" rx="18" fill="#fff7ed"/>
      <path d="M-160 -58 V58 M-8 -58 V58 M192 -58 V58" stroke="#cbd5e1" stroke-width="2"/>
      <text x="-240" y="-25" text-anchor="middle" class="field-title">NONCE · 12 B</text>
      <text x="-240" y="5" text-anchor="middle" class="field-value">cafebabe</text>
      <text x="-240" y="27" text-anchor="middle" class="field-value">…caf888</text>
      <text x="-93" y="-25" text-anchor="middle" class="field-title">AAD · 16 B</text>
      <text x="-93" y="8" text-anchor="middle" class="field-value">type=meeting</text>
      <text x="-93" y="30" text-anchor="middle" class="field-value">v=1</text>
      <text x="92" y="-25" text-anchor="middle" class="field-title">CIPHERTEXT · 15 B</text>
      <text x="92" y="5" text-anchor="middle" class="field-value">c7c6c5528a17</text>
      <text x="92" y="27" text-anchor="middle" class="field-value">…7dea5b5cc4</text>
      <text x="256" y="-25" text-anchor="middle" class="field-title">TAG · 16 B</text>
      <text x="256" y="5" text-anchor="middle" class="field-value">26511e45</text>
      <text x="256" y="27" text-anchor="middle" class="field-value">…2470bd</text>
    </g>`;
}

function timeline(active) {
  const labels = ["SHARE K", "INPUTS", "ENCRYPT", "SEND", "VERIFY", "TAMPER"];
  return labels.map((label, index) => {
    const x = 70 + index * 195;
    const selected = index === active;
    return `
      <g>
        <rect x="${x}" y="156" width="166" height="34" rx="17" fill="${selected ? "#1d4ed8" : "#eef2f7"}"/>
        <circle cx="${x + 18}" cy="173" r="11" fill="${selected ? "#ffffff" : "#cbd5e1"}"/>
        <text x="${x + 18}" y="178" text-anchor="middle" class="step-number" fill="${selected ? "#1d4ed8" : "#64748b"}">${index + 1}</text>
        <text x="${x + 37}" y="178" class="step-label" fill="${selected ? "#ffffff" : "#64748b"}">${label}</text>
      </g>`;
  }).join("");
}

function sceneShareKey(time) {
  const opacity = sceneOpacity(time, -0.35, 4);
  const move = progress(time, 0.8, 2.7);
  const movingX = lerp(375, 880, move);
  const receiverKey = appear(time, 2.6);
  return `
    <g opacity="${opacity}">
      ${card(70, 238, 350, 250, "SENDER · BEFORE MESSAGING", `
        ${keyIcon(118, 323, 1, 0.72)}
        <text x="174" y="316" class="body-strong">Secret key K</text>
        <text x="100" y="365" class="mono">${keyLine1}</text>
        <text x="100" y="390" class="mono">${keyLine2}</text>
        <text x="100" y="434" class="body-note">32 bytes = 256 bits</text>
      `)}
      ${card(860, 238, 350, 250, "RECEIVER · BEFORE MESSAGING", `
        ${keyIcon(908, 323, receiverKey, 0.72)}
        <text x="964" y="316" class="body-strong" opacity="${receiverKey}">Same secret key K</text>
        <text x="890" y="365" class="mono" opacity="${receiverKey}">${keyLine1}</text>
        <text x="890" y="390" class="mono" opacity="${receiverKey}">${keyLine2}</text>
        <text x="890" y="434" class="body-note" opacity="${receiverKey}">stored securely at this end</text>
      `)}
      <path d="M430 342 H850" stroke="#f59e0b" stroke-width="4" stroke-dasharray="9 10"/>
      <rect x="500" y="270" width="280" height="48" rx="24" fill="#fff7ed" stroke="#fed7aa"/>
      <text x="640" y="290" text-anchor="middle" class="oob-title">OUT-OF-BAND KEY SHARING</text>
      <text x="640" y="307" text-anchor="middle" class="oob-note">KMS / secure provisioning / in person</text>
      ${keyIcon(movingX, 342, 1, 0.62)}
      <text x="640" y="548" text-anchor="middle" class="scene-caption">K is shared before the message is sent, over a separate trusted path.</text>
      <text x="640" y="580" text-anchor="middle" class="scene-note">The normal network packet will never contain K.</text>
    </g>`;
}

function sceneInputs(time) {
  const opacity = sceneOpacity(time, 3.65, 8);
  const local = time - 4;
  return `
    <g opacity="${opacity}">
      ${card(60, 226, 730, 342, "SENDER · CONCRETE INPUTS", `
        ${codeRow(92, 307, "plaintext", `&quot;${demo.plaintext}&quot;`, "15 UTF-8 bytes", appear(local, 0.25))}
        ${codeRow(92, 372, "key K", keyLine1, "000102…1e1f · 32 bytes · secret", appear(local, 0.85), "#92400e")}
        ${codeRow(92, 437, "nonce", demo.nonceHex, "12 bytes · must be unique for this K · not secret", appear(local, 1.45), "#1d4ed8")}
        ${codeRow(92, 502, "AAD", demo.aad, "authenticated but remains readable", appear(local, 2.05), "#15803d")}
      `)}
      <path d="M810 395 H845" stroke="#94a3b8" stroke-width="4"/>
      <path d="M845 395 L830 386 V404 Z" fill="#94a3b8"/>
      <g opacity="${appear(local, 2.45)}">
        <rect x="850" y="286" width="360" height="220" rx="22" fill="#1e40af"/>
        <text x="1030" y="340" text-anchor="middle" class="engine-title">AES-256-GCM</text>
        <text x="1030" y="376" text-anchor="middle" class="engine-code">encrypt(K, nonce, plaintext, AAD)</text>
        <path d="M930 415 H1130" stroke="#93c5fd" stroke-width="3" stroke-dasharray="8 8"/>
        <text x="1030" y="454" text-anchor="middle" class="engine-note">one operation: encrypt + authenticate</text>
      </g>
      <text x="640" y="610" text-anchor="middle" class="scene-note">Fixed demo values make the output reproducible; production nonces must not repeat under the same key.</text>
    </g>`;
}

function sceneEncrypt(time) {
  const opacity = sceneOpacity(time, 7.65, 12);
  const local = time - 8;
  const outputOpacity = appear(local, 1.1);
  const tagOpacity = appear(local, 1.9);
  return `
    <g opacity="${opacity}">
      <rect x="95" y="226" width="1090" height="82" rx="18" fill="#0f172a"/>
      <text x="640" y="278" text-anchor="middle" class="formula">ciphertext, tag = AES-256-GCM.encrypt(K, nonce, plaintext, AAD)</text>
      ${card(95, 340, 520, 212, "CONFIDENTIAL OUTPUT", `
        <text x="125" y="420" class="output-label">ciphertext · 15 bytes</text>
        <text x="125" y="460" class="output-hex" opacity="${outputOpacity}">${result.ciphertextHex}</text>
        <text x="125" y="506" class="body-note" opacity="${outputOpacity}">This hides &quot;${demo.plaintext}&quot;.</text>
      `, "#9f1239")}
      ${card(665, 340, 520, 212, "AUTHENTICATION OUTPUT", `
        <text x="695" y="420" class="output-label">tag · 16 bytes / 128 bits</text>
        <text x="695" y="460" class="output-hex" opacity="${tagOpacity}">${result.tagHex}</text>
        <text x="695" y="498" class="body-note" opacity="${tagOpacity}">The tag binds nonce + AAD + ciphertext to K.</text>
        <text x="695" y="522" class="body-note" opacity="${tagOpacity}">Without K, an attacker cannot forge a valid replacement.</text>
      `, "#b45309")}
      <text x="640" y="610" text-anchor="middle" class="scene-caption">Ciphertext provides confidentiality. The tag provides integrity and shared-key authenticity.</text>
    </g>`;
}

function sceneSend(time) {
  const opacity = sceneOpacity(time, 11.65, 16);
  const local = time - 12;
  const packetMove = progress(local, 0.5, 2.5);
  const packetX = lerp(455, 825, packetMove);
  return `
    <g opacity="${opacity}">
      <text x="90" y="260" class="endpoint-title">SENDER</text>
      <text x="1190" y="260" text-anchor="end" class="endpoint-title">RECEIVER</text>
      <path d="M110 382 H1170" stroke="#fda4af" stroke-width="7" stroke-linecap="round"/>
      <path d="M1170 382 L1148 369 V395 Z" fill="#fb7185"/>
      <text x="640" y="330" text-anchor="middle" class="network-title">UNTRUSTED NETWORK</text>
      ${packet(packetX, 382, 1, 0.78)}
      <g opacity="${appear(local, 1.2)}">
        <rect x="468" y="500" width="344" height="52" rx="26" fill="#fef2f2" stroke="#fecaca"/>
        ${keyIcon(510, 526, 1, 0.45)}
        <path d="M492 504 L538 548" stroke="#dc2626" stroke-width="6"/>
        <text x="565" y="533" class="not-sent">KEY K IS NOT IN THE PACKET</text>
      </g>
      <text x="640" y="610" text-anchor="middle" class="scene-caption">The nonce and AAD may be public. The tag lets the receiver detect any change.</text>
    </g>`;
}

function sceneVerify(time) {
  const opacity = sceneOpacity(time, 15.65, 20);
  const local = time - 16;
  const compare = appear(local, 1.25);
  const reveal = appear(local, 2.35);
  return `
    <g opacity="${opacity}">
      ${card(60, 222, 520, 328, "RECEIVER · VERIFY BEFORE USE", `
        ${codeRow(90, 304, "has", "same key K", "received earlier out-of-band", 1, "#92400e")}
        ${codeRow(90, 369, "gets", "nonce + AAD", "sent openly with the packet", appear(local, 0.35), "#1d4ed8")}
        ${codeRow(90, 434, "gets", "ciphertext + tag", "from the untrusted network", appear(local, 0.7), "#9f1239")}
        <text x="90" y="508" class="mono" opacity="${appear(local, 1)}">decrypt(K, nonce, ciphertext, tag, AAD)</text>
      `)}
      ${card(630, 222, 590, 328, "AES-GCM AUTHENTICATION CHECK", `
        <text x="666" y="314" class="compare-label">received tag</text>
        <text x="820" y="314" class="compare-hex">${result.tagHex}</text>
        <text x="666" y="365" class="compare-label">calculated under K</text>
        <text x="820" y="365" class="compare-hex" opacity="${compare}">${result.tagHex}</text>
        <path d="M680 403 H1165" stroke="#dcfce7" stroke-width="34" stroke-linecap="round" opacity="${compare}"/>
        <text x="922" y="410" text-anchor="middle" class="match" opacity="${compare}">TAGS MATCH ✓</text>
        <text x="666" y="465" class="body-note" opacity="${compare}">Only now should the application accept the plaintext:</text>
        <rect x="666" y="482" width="508" height="48" rx="12" fill="#eff6ff" opacity="${reveal}"/>
        <text x="920" y="514" text-anchor="middle" class="revealed" opacity="${reveal}">&quot;${demo.plaintext}&quot;</text>
      `, "#15803d")}
      <text x="640" y="610" text-anchor="middle" class="scene-caption">A successful tag check means the protected data was not altered and a holder of K created it.</text>
    </g>`;
}

function sceneTamper(time) {
  const opacity = sceneOpacity(time, 19.65, 24.35);
  const local = time - 20;
  const change = appear(local, 0.55);
  const fail = appear(local, 1.4);
  const warning = local > 1.4 ? blink(local, 1.4) : 0;
  return `
    <g opacity="${opacity}">
      ${card(70, 225, 540, 278, "ATTACKER FLIPS ONE CIPHERTEXT BIT", `
        <text x="105" y="316" class="compare-label">original</text>
        <text x="220" y="316" class="compare-hex">${result.ciphertextHex}</text>
        <text x="105" y="372" class="compare-label">tampered</text>
        <text x="220" y="372" class="compare-hex" opacity="${change}">${result.tamperedHex}</text>
        <rect x="216" y="389" width="110" height="34" rx="17" fill="#fef2f2" opacity="${change}"/>
        <text x="271" y="412" text-anchor="middle" class="changed" opacity="${change}">c7 → c6</text>
        <text x="105" y="466" class="body-note" opacity="${change}">The attacker cannot calculate a matching new tag without K.</text>
      `, "#9f1239")}
      ${card(670, 225, 540, 278, "RECEIVER REJECTS IT", `
        <rect x="710" y="305" width="460" height="76" rx="14" fill="#fef2f2" opacity="${fail}"/>
        <text x="940" y="337" text-anchor="middle" class="failure" opacity="${fail * warning}">AUTHENTICATION FAILED</text>
        <text x="940" y="363" text-anchor="middle" class="failure-code" opacity="${fail}">decipher.final() throws</text>
        <text x="710" y="425" class="reject" opacity="${fail}">✕ discard packet</text>
        <text x="940" y="425" class="reject" opacity="${fail}">✕ accept no plaintext</text>
        <text x="710" y="466" class="body-note" opacity="${fail}">Wrong ciphertext, tag, AAD, nonce or key → verification fails.</text>
      `, "#dc2626")}
      <text x="640" y="558" text-anchor="middle" class="scene-caption">This is authentication in AES-GCM: tampering is detected before the message is trusted.</text>
      <text x="640" y="596" text-anchor="middle" class="scene-note">Because K is shared, the tag proves “a holder of K”, not which specific holder sent it.</text>
      <text x="640" y="628" text-anchor="middle" class="scene-note">Use digital signatures when individual sender attribution is required.</text>
    </g>`;
}

function frameSvg(time) {
  const active = Math.min(5, Math.floor(time / 4));
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      .mono, .code-value, .output-hex, .compare-hex, .engine-code, .formula, .failure-code, .field-value { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .eyebrow { fill: #2563eb; font-size: 15px; font-weight: 750; letter-spacing: 2.6px; }
      .title { fill: #0f172a; font-size: 33px; font-weight: 780; }
      .subtitle { fill: #475569; font-size: 17px; }
      .step-number { font-size: 12px; font-weight: 800; }
      .step-label { font-size: 12px; font-weight: 800; letter-spacing: 0.7px; }
      .card-title { fill: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 0.8px; }
      .body-strong { fill: #0f172a; font-size: 18px; font-weight: 750; }
      .body-note, .code-note { fill: #64748b; font-size: 14px; }
      .mono { fill: #334155; font-size: 15px; }
      .oob-title { fill: #92400e; font-size: 14px; font-weight: 800; letter-spacing: 1px; }
      .oob-note { fill: #b45309; font-size: 12px; }
      .scene-caption { fill: #0f172a; font-size: 21px; font-weight: 760; }
      .scene-note { fill: #64748b; font-size: 16px; }
      .code-label { fill: #64748b; font-size: 15px; font-weight: 700; }
      .code-value { font-size: 16px; font-weight: 700; }
      .engine-title { fill: #ffffff; font-size: 27px; font-weight: 800; }
      .engine-code { fill: #dbeafe; font-size: 14px; }
      .engine-note { fill: #bfdbfe; font-size: 15px; }
      .formula { fill: #e2e8f0; font-size: 18px; }
      .output-label { fill: #475569; font-size: 15px; font-weight: 750; }
      .output-hex { fill: #0f172a; font-size: 17px; font-weight: 750; }
      .endpoint-title { fill: #1e3a8a; font-size: 20px; font-weight: 800; }
      .network-title { fill: #9f1239; font-size: 15px; font-weight: 800; letter-spacing: 1.5px; }
      .not-sent { fill: #b91c1c; font-size: 14px; font-weight: 800; }
      .field-title { fill: #475569; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; }
      .field-value { fill: #0f172a; font-size: 13px; font-weight: 700; }
      .compare-label { fill: #64748b; font-size: 14px; font-weight: 750; }
      .compare-hex { fill: #0f172a; font-size: 14px; font-weight: 700; }
      .match { fill: #15803d; font-size: 18px; font-weight: 850; letter-spacing: 1px; }
      .revealed { fill: #1e40af; font-size: 22px; font-weight: 800; }
      .changed { fill: #b91c1c; font-size: 16px; font-weight: 850; }
      .failure { fill: #b91c1c; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
      .failure-code { fill: #991b1b; font-size: 14px; }
      .reject { fill: #b91c1c; font-size: 16px; font-weight: 800; }
    </style>

    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="24" y="22" width="1232" height="676" rx="28" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    <text x="70" y="66" class="eyebrow">WORKED IMPLEMENTATION · AES-256-GCM</text>
    <text x="70" y="106" class="title">Sending “${demo.plaintext}” securely</text>
    <text x="70" y="134" class="subtitle">One exact encryption run: key sharing, ciphertext, authentication tag, verification and tamper rejection.</text>
    ${timeline(active)}
    ${sceneShareKey(time)}
    ${sceneInputs(time)}
    ${sceneEncrypt(time)}
    ${sceneSend(time)}
    ${sceneVerify(time)}
    ${sceneTamper(time)}
    <text x="1210" y="674" text-anchor="end" class="code-note">Fixed values are for learning, not production reuse.</text>
  </svg>`;
}

async function renderFrame(index) {
  // The underlying six-stage animation is 24 seconds; render it at half speed.
  const time = index / fps / 2;
  const filename = path.join(framesDir, `frame-${String(index).padStart(4, "0")}.png`);
  await sharp(Buffer.from(frameSvg(time))).png({ compressionLevel: 9 }).toFile(filename);
}

(async () => {
  const concurrency = 8;
  for (let start = 0; start < frameCount; start += concurrency) {
    const batch = [];
    for (let index = start; index < Math.min(start + concurrency, frameCount); index += 1) {
      batch.push(renderFrame(index));
    }
    await Promise.all(batch);
    if (start % 120 === 0) process.stdout.write(`Rendered ${Math.min(start + concurrency, frameCount)}/${frameCount} frames\n`);
  }

  await sharp(Buffer.from(frameSvg(18.8))).png({ compressionLevel: 9 }).toFile(posterPath);
  process.stdout.write(`Poster written to ${posterPath}\n`);
})();
