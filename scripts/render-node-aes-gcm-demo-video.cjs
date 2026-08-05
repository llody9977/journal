#!/usr/bin/env node

// Render the complete, reproducible Node.js AES-256-GCM demo as PNG frames.
// The code pages are read directly from the downloadable scripts so the video
// cannot silently drift away from the runnable source.

const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

const width = 1280;
const height = 720;
const fps = 30;
const seconds = 90;
const sceneLength = 10;
const sceneCount = 9;
const frameCount = fps * seconds;
const framesDir = process.argv[2];
const posterPath = process.argv[3];

if (!framesDir || !posterPath) {
  console.error('Usage: render-node-aes-gcm-demo-video.cjs <frames-dir> <poster-path>');
  process.exit(1);
}

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(posterPath), { recursive: true });

const repoRoot = path.resolve(__dirname, '..');
const encryptPath = path.join(repoRoot, 'assets/downloads/node-aes-gcm-demo/encrypt.js');
const decryptPath = path.join(repoRoot, 'assets/downloads/node-aes-gcm-demo/decrypt.js');
const encryptLines = fs.readFileSync(encryptPath, 'utf8').trimEnd().split('\n');
const decryptLines = fs.readFileSync(decryptPath, 'utf8').trimEnd().split('\n');
const sourceLineCount = encryptLines.length + decryptLines.length;

function readHexField(lines, label) {
  const prefix = `${label}:`;
  const line = lines.find((candidate) => candidate.startsWith(prefix));
  const value = line?.slice(prefix.length).trim();
  if (!value || !/^[0-9a-f]+$/.test(value)) {
    throw new Error(`Missing ${label} in captured encrypt.js output`);
  }
  return value;
}

function executeDemo() {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-node-video-'));
  const plaintext = Buffer.from('private journal entry\n', 'utf8');
  const env = {
    ...process.env,
    FILE_ENCRYPTION_PASSPHRASE: crypto.randomBytes(32).toString('base64url'),
  };

  try {
    fs.writeFileSync(path.join(runDir, 'secret.txt'), plaintext);
    const encryptOutput = execFileSync(process.execPath, [encryptPath], {
      cwd: runDir,
      env,
      encoding: 'utf8',
    }).trimEnd().split('\n');
    const packed = fs.readFileSync(path.join(runDir, 'secret.txt.enc'));
    const decryptOutput = execFileSync(process.execPath, [decryptPath], {
      cwd: runDir,
      env,
      encoding: 'utf8',
    }).trimEnd().split('\n');
    const recovered = fs.readFileSync(path.join(runDir, 'secret-decrypted.txt'));

    if (!recovered.equals(plaintext)) throw new Error('Captured round trip mismatch');
    if (packed.length !== 66) throw new Error(`Expected 66 packed bytes, received ${packed.length}`);

    const captured = {
      encryptOutput,
      decryptOutput,
      saltHex: readHexField(encryptOutput, 'salt'),
      nonceHex: readHexField(encryptOutput, 'nonce'),
      tagHex: readHexField(encryptOutput, 'tag'),
      ciphertextHex: readHexField(encryptOutput, 'ciphertext'),
    };

    if (packed.subarray(0, 16).toString('hex') !== captured.saltHex) throw new Error('Captured salt mismatch');
    if (packed.subarray(16, 28).toString('hex') !== captured.nonceHex) throw new Error('Captured nonce mismatch');
    if (packed.subarray(28, 44).toString('hex') !== captured.tagHex) throw new Error('Captured tag mismatch');
    if (packed.subarray(44).toString('hex') !== captured.ciphertextHex) throw new Error('Captured ciphertext mismatch');
    return captured;
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
}

const captured = executeDemo();

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const progress = (time, start, end) => smooth((time - start) / (end - start));
const appear = (time, at, duration = 0.45) => progress(time, at, at + duration);
const sceneOpacity = (time, index, feather = 0.55) => {
  const start = index * sceneLength - feather;
  const end = (index + 1) * sceneLength;
  return clamp((time - start) / feather) * clamp((end - time) / feather);
};
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function typed(value, amount) {
  return value.slice(0, Math.floor(value.length * clamp(amount)));
}

function colourForStep(step) {
  if (step === 1) return '#7c3aed';
  if (step <= 4) return '#2563eb';
  if (step === 5) return '#0891b2';
  if (step === 6) return '#d97706';
  if (step <= 8) return '#9333ea';
  return '#16a34a';
}

function header(step, label) {
  const colour = colourForStep(step);
  return `
    <text x="70" y="64" class="eyebrow">PRACTICAL DEMO · COMPLETE REPRODUCIBLE SOURCE</text>
    <text x="70" y="104" class="title">Node.js AES-256-GCM file encryption</text>
    <text x="70" y="132" class="subtitle">All ${sourceLineCount} source lines, the exact command and its complete captured output.</text>
    <text x="70" y="180" class="step-name" fill="${colour}">${label}</text>
    <line x1="70" y1="196" x2="1150" y2="196" stroke="${colour}" stroke-width="5" stroke-linecap="round"/>`;
}

function windowChrome(x, y, w, h, title) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#111827"/>
    <circle cx="${x + 23}" cy="${y + 22}" r="6" fill="#fb7185"/>
    <circle cx="${x + 43}" cy="${y + 22}" r="6" fill="#fbbf24"/>
    <circle cx="${x + 63}" cy="${y + 22}" r="6" fill="#4ade80"/>
    <text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" class="window-title">${title}</text>`;
}

function terminalLine(x, y, content, kind = 'command', opacity = 1) {
  const colour = kind === 'command' ? '#f8fafc' : kind === 'success' ? '#86efac' : kind === 'label' ? '#93c5fd' : '#cbd5e1';
  return `<text x="${x}" y="${y}" class="terminal" fill="${colour}" opacity="${opacity}">${escapeXml(content)}</text>`;
}

function codePage(file, lines, firstLine, lastLine, localTime, title) {
  const selected = lines.slice(firstLine - 1, lastLine);
  const activeOffset = Math.min(selected.length - 1, Math.max(0, Math.floor(localTime / (sceneLength / selected.length))));
  const rendered = selected.map((line, offset) => {
    const lineNumber = firstLine + offset;
    const y = 286 + offset * 23;
    const active = offset === activeOffset;
    const isComment = line.trimStart().startsWith('//');
    return `
      <g>
        <rect x="74" y="${y - 19}" width="1132" height="23" rx="6" fill="#1e3a8a" opacity="${active ? 0.78 : 0}"/>
        <text x="92" y="${y}" class="line-number">${lineNumber}</text>
        <text x="132" y="${y}" class="code" fill="${active ? '#ffffff' : isComment ? '#86efac' : '#cbd5e1'}">${escapeXml(line || ' ')}</text>
      </g>`;
  }).join('');
  return `
    ${windowChrome(55, 240, 1170, 422, title)}
    ${rendered}
    <text x="1188" y="644" text-anchor="end" class="page-count">${file} · lines ${firstLine}–${lastLine} of ${lines.length}</text>`;
}

function sceneSetup(time) {
  const local = time;
  const opacity = sceneOpacity(time, 0);
  const command = "$ printf 'Passphrase: '; read -rs FILE_ENCRYPTION_PASSPHRASE";
  return `
    <g opacity="${opacity}">
      ${header(1, 'CREATE THE 22-BYTE PLAINTEXT FILE')}
      ${windowChrome(75, 244, 1130, 356, 'Terminal · configure key and input')}
      ${terminalLine(115, 304, typed(command, progress(local, 0.4, 2.4)), 'command')}
      ${terminalLine(115, 348, 'Passphrase: ••••••••••••••••', 'output', appear(local, 2.5))}
      ${terminalLine(115, 400, "$ printf '\\n'; export FILE_ENCRYPTION_PASSPHRASE", 'command', appear(local, 3.4))}
      ${terminalLine(115, 464, "$ printf 'private journal entry\\n' > secret.txt", 'command', appear(local, 4.8))}
      ${terminalLine(115, 516, '$ wc -c secret.txt', 'command', appear(local, 6.0))}
      ${terminalLine(115, 558, '22 secret.txt', 'output', appear(local, 6.8))}
      <g opacity="${appear(local, 7.3)}">
        <rect x="825" y="367" width="330" height="56" rx="14" fill="#ede9fe" stroke="#c4b5fd"/>
        <text x="990" y="391" text-anchor="middle" class="annotation-title">READ → SHELL VARIABLE</text>
        <text x="990" y="411" text-anchor="middle" class="annotation-copy">EXPORT → AVAILABLE TO NODE</text>
      </g>
      <text x="640" y="652" text-anchor="middle" class="scene-caption">read stores the hidden input; export passes that stored value to both Node processes.</text>
    </g>`;
}

function sceneEncryptCode(time, sceneIndex, firstLine, lastLine, label) {
  const local = time - sceneIndex * sceneLength;
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header(sceneIndex + 1, label)}
      ${codePage('encrypt.js', encryptLines, firstLine, lastLine, local, 'encrypt.js · complete source')}
    </g>`;
}

function sceneRun(time) {
  const sceneIndex = 4;
  const local = time - sceneIndex * sceneLength;
  const opacity = sceneOpacity(time, sceneIndex);
  const rows = [
    ...captured.encryptOutput.map((row) => [row, row.startsWith('wrote:') ? 'success' : 'label']),
  ];
  return `
    <g opacity="${opacity}">
      ${header(5, 'RUN ENCRYPT.JS AND CAPTURE EVERY OUTPUT LINE')}
      ${windowChrome(75, 244, 1130, 380, 'Terminal · execute file encryption')}
      ${terminalLine(115, 306, '$ node assets/downloads/node-aes-gcm-demo/encrypt.js', 'command')}
      ${rows.map(([row, kind], index) => terminalLine(115, 366 + index * 48, row, kind, appear(local, 0.9 + index * 1.0))).join('')}
      <text x="640" y="670" text-anchor="middle" class="scene-caption">This output comes from executing the same encrypt.js file shown in the previous section.</text>
    </g>`;
}

function scenePack(time) {
  const sceneIndex = 5;
  const local = time - sceneIndex * sceneLength;
  const opacity = sceneOpacity(time, sceneIndex);
  const segments = [
    { x: 95, w: 262, colour: '#dbeafe', name: 'SALT', bytes: '16 bytes', range: 'offset 0–15' },
    { x: 357, w: 196, colour: '#dcfce7', name: 'NONCE', bytes: '12 bytes', range: 'offset 16–27' },
    { x: 553, w: 262, colour: '#ffedd5', name: 'TAG', bytes: '16 bytes', range: 'offset 28–43' },
    { x: 815, w: 360, colour: '#ffe4e6', name: 'CIPHERTEXT', bytes: '22 bytes', range: 'offset 44–65' },
  ];
  return `
    <g opacity="${opacity}">
      ${header(6, 'INSPECT THE 66-BYTE PACKED FILE')}
      <text x="640" y="262" text-anchor="middle" class="section-title">secret.txt.enc = salt || nonce || tag || ciphertext</text>
      ${segments.map((segment, index) => `
        <g opacity="${appear(local, 0.8 + index * 1.2)}">
          <rect x="${segment.x}" y="316" width="${segment.w}" height="170" fill="${segment.colour}" stroke="#cbd5e1" stroke-width="2"/>
          <text x="${segment.x + segment.w / 2}" y="362" text-anchor="middle" class="segment-title">${segment.name}</text>
          <text x="${segment.x + segment.w / 2}" y="410" text-anchor="middle" class="segment-bytes">${segment.bytes}</text>
          <text x="${segment.x + segment.w / 2}" y="450" text-anchor="middle" class="segment-range">${segment.range}</text>
        </g>`).join('')}
      <text x="640" y="546" text-anchor="middle" class="body-note">16 + 12 + 16 + 22 = 66 bytes. The passphrase and derived AES key are not stored here.</text>
      <text x="640" y="620" text-anchor="middle" class="scene-caption">decrypt.js uses these exact offsets to split the packed file back into fields.</text>
    </g>`;
}

function sceneDecryptCode(time, sceneIndex, firstLine, lastLine, label) {
  const local = time - sceneIndex * sceneLength;
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header(sceneIndex + 1, label)}
      ${codePage('decrypt.js', decryptLines, firstLine, lastLine, local, 'decrypt.js · complete source')}
    </g>`;
}

function sceneVerify(time) {
  const sceneIndex = 8;
  const local = time - sceneIndex * sceneLength;
  const opacity = sceneOpacity(time, sceneIndex);
  const success = appear(local, 5.5);
  return `
    <g opacity="${opacity}">
      ${header(9, 'RUN DECRYPT.JS AND PROVE THE ROUND TRIP')}
      ${windowChrome(85, 240, 1110, 402, 'Terminal · verify authentication and recovered file')}
      ${terminalLine(125, 304, '$ node assets/downloads/node-aes-gcm-demo/decrypt.js', 'command')}
      ${terminalLine(125, 356, captured.decryptOutput[0], 'success', appear(local, 1.0))}
      ${terminalLine(125, 404, captured.decryptOutput[1], 'output', appear(local, 2.0))}
      ${terminalLine(125, 468, '$ diff secret.txt secret-decrypted.txt', 'command', appear(local, 3.0))}
      ${terminalLine(125, 520, '$ echo $?', 'command', appear(local, 4.0))}
      ${terminalLine(250, 520, '0', 'success', appear(local, 4.8))}
      <g opacity="${success}">
        <circle cx="1035" cy="452" r="68" fill="#052e16" stroke="#22c55e" stroke-width="4"/>
        <path d="M1001 452 L1026 477 L1072 424" fill="none" stroke="#4ade80" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="1035" y="550" text-anchor="middle" class="success-title">IDENTICAL</text>
      </g>
      <text x="640" y="668" text-anchor="middle" class="scene-caption">Complete source + successful tag verification + exit code 0 proves the round trip.</text>
    </g>`;
}

function frameSvg(time) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      .terminal, .code, .line-number { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .eyebrow { fill: #2563eb; font-size: 15px; font-weight: 750; letter-spacing: 2.5px; }
      .title { fill: #0f172a; font-size: 32px; font-weight: 790; }
      .subtitle { fill: #475569; font-size: 16px; }
      .step-name { fill: #0f172a; font-size: 15px; font-weight: 760; }
      .window-title { fill: #94a3b8; font-size: 13px; font-weight: 700; }
      .terminal { font-size: 16px; }
      .line-number { fill: #64748b; font-size: 12px; }
      .code { font-size: 13.5px; }
      .page-count { fill: #64748b; font-size: 12px; }
      .scene-caption { fill: #0f172a; font-size: 19px; font-weight: 760; }
      .section-title { fill: #0f172a; font-size: 22px; font-weight: 800; }
      .body-note { fill: #64748b; font-size: 15px; }
      .segment-title { fill: #334155; font-size: 16px; font-weight: 850; letter-spacing: 1px; }
      .segment-bytes { fill: #0f172a; font-size: 20px; font-weight: 800; }
      .segment-range { fill: #64748b; font-size: 14px; }
      .success-title { fill: #4ade80; font-size: 19px; font-weight: 900; letter-spacing: 1px; }
      .annotation-title { fill: #6d28d9; font-size: 13px; font-weight: 850; }
      .annotation-copy { fill: #7c3aed; font-size: 12px; font-weight: 700; }
    </style>
    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="24" y="22" width="1232" height="676" rx="28" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    ${sceneSetup(time)}
    ${sceneEncryptCode(time, 1, 1, 10, 'ENCRYPT.JS · LINES 1–10')}
    ${sceneEncryptCode(time, 2, 11, 20, 'ENCRYPT.JS · LINES 11–20')}
    ${sceneEncryptCode(time, 3, 21, encryptLines.length, `ENCRYPT.JS · LINES 21–${encryptLines.length}`)}
    ${sceneRun(time)}
    ${scenePack(time)}
    ${sceneDecryptCode(time, 6, 1, 14, 'DECRYPT.JS · LINES 1–14')}
    ${sceneDecryptCode(time, 7, 15, decryptLines.length, `DECRYPT.JS · LINES 15–${decryptLines.length}`)}
    ${sceneVerify(time)}
  </svg>`;
}

async function renderFrame(index) {
  const time = index / fps;
  const filename = path.join(framesDir, `frame-${String(index).padStart(4, '0')}.png`);
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
    if (start % 300 === 0) process.stdout.write(`Rendered ${Math.min(start + concurrency, frameCount)}/${frameCount} frames\n`);
  }

  await sharp(Buffer.from(frameSvg(87))).png({ compressionLevel: 9 }).toFile(posterPath);
  process.stdout.write(`Poster written to ${posterPath}\n`);
})();
