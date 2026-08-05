#!/usr/bin/env node

const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

const width = 1280;
const height = 720;
const fps = 24;
const sceneDuration = 14;
const sceneCount = 14;
const duration = sceneDuration * sceneCount;
const frameCount = fps * duration;
const framesDir = process.argv[2];
const posterPath = process.argv[3];

if (!framesDir || !posterPath) {
  console.error('Usage: render-node-aes-gcm-demo-video.cjs <frames-dir> <poster-path>');
  process.exit(1);
}

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(posterPath), { recursive: true });

const repoRoot = path.resolve(__dirname, '..');
const demoRoot = path.join(repoRoot, 'assets/downloads/node-aes-gcm-demo');
const generateKekPath = path.join(demoRoot, 'generate-kek.js');
const encryptPath = path.join(demoRoot, 'encrypt.js');
const decryptPath = path.join(demoRoot, 'decrypt.js');
const generateKekLines = fs.readFileSync(generateKekPath, 'utf8').trimEnd().split('\n');
const encryptLines = fs.readFileSync(encryptPath, 'utf8').trimEnd().split('\n');
const decryptLines = fs.readFileSync(decryptPath, 'utf8').trimEnd().split('\n');
const sourceLineCount = generateKekLines.length + encryptLines.length + decryptLines.length;

function readField(lines, label, pattern) {
  const prefix = `${label}:`;
  const line = lines.find((candidate) => candidate.startsWith(prefix));
  const value = line?.slice(prefix.length).trim();
  if (!value || !pattern.test(value)) {
    throw new Error(`Missing ${label} in captured encrypt.js output`);
  }
  return value;
}

function executeDemo() {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-node-envelope-video-'));
  const plaintext = Buffer.from('private journal entry\n', 'utf8');
  const encodedKek = execFileSync(process.execPath, [generateKekPath], { encoding: 'utf8' });
  const env = { ...process.env, FILE_KEK_BASE64: encodedKek };

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
    if (packed.length !== 94) throw new Error(`Expected 94 packed bytes, received ${packed.length}`);

    const captured = {
      encryptOutput,
      decryptOutput,
      format: readField(encryptOutput, 'format', /^JRN1$/),
      wrappedKeyHex: readField(encryptOutput, 'wrapped key', /^[0-9a-f]{80}$/),
      nonceHex: readField(encryptOutput, 'nonce', /^[0-9a-f]{24}$/),
      tagHex: readField(encryptOutput, 'tag', /^[0-9a-f]{32}$/),
      ciphertextHex: readField(encryptOutput, 'ciphertext', /^[0-9a-f]{44}$/),
    };

    if (packed.subarray(0, 4).toString() !== captured.format) throw new Error('Captured format mismatch');
    if (packed.subarray(4, 44).toString('hex') !== captured.wrappedKeyHex) throw new Error('Captured wrapped key mismatch');
    if (packed.subarray(44, 56).toString('hex') !== captured.nonceHex) throw new Error('Captured nonce mismatch');
    if (packed.subarray(56, 72).toString('hex') !== captured.tagHex) throw new Error('Captured tag mismatch');
    if (packed.subarray(72).toString('hex') !== captured.ciphertextHex) throw new Error('Captured ciphertext mismatch');

    const tampered = Buffer.from(packed);
    tampered[tampered.length - 1] ^= 1;
    fs.writeFileSync(path.join(runDir, 'secret.txt.enc'), tampered);
    fs.unlinkSync(path.join(runDir, 'secret-decrypted.txt'));
    const tamperRun = spawnSync(process.execPath, [decryptPath], {
      cwd: runDir,
      env,
      encoding: 'utf8',
    });
    if (tamperRun.status === 0) throw new Error('Tampered ciphertext was accepted');
    if (fs.existsSync(path.join(runDir, 'secret-decrypted.txt'))) throw new Error('Tampered plaintext was written');
    captured.tamperOutput = tamperRun.stderr.trim();
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
const appear = (time, at, span = 0.6) => progress(time, at, at + span);
const sceneOpacity = (time, index, feather = 0.7) => {
  const start = index * sceneDuration - feather;
  const end = (index + 1) * sceneDuration;
  return clamp((time - start) / feather) * clamp((end - time) / feather);
};
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function header(label, colour = '#2563eb') {
  return `
    <text x="70" y="62" class="eyebrow">PRACTICAL DEMO · ENVELOPE ENCRYPTION</text>
    <text x="70" y="102" class="title">Node.js AES-256-GCM file encryption</text>
    <text x="70" y="132" class="subtitle">All ${sourceLineCount} source lines and output captured from the same runnable files.</text>
    <text x="70" y="180" class="section-name" fill="${colour}">${escapeXml(label)}</text>
    <line x1="70" y1="196" x2="1210" y2="196" stroke="${colour}" stroke-width="5" stroke-linecap="round"/>`;
}

function windowChrome(x, y, w, h, title) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#111827"/>
    <circle cx="${x + 23}" cy="${y + 22}" r="6" fill="#fb7185"/>
    <circle cx="${x + 43}" cy="${y + 22}" r="6" fill="#fbbf24"/>
    <circle cx="${x + 63}" cy="${y + 22}" r="6" fill="#4ade80"/>
    <text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" class="window-title">${escapeXml(title)}</text>`;
}

function terminalLine(x, y, content, kind = 'command', opacity = 1) {
  const colour = kind === 'command' ? '#f8fafc' : kind === 'success' ? '#86efac' : kind === 'label' ? '#93c5fd' : kind === 'error' ? '#fda4af' : '#cbd5e1';
  return `<text x="${x}" y="${y}" class="terminal" fill="${colour}" opacity="${opacity}">${escapeXml(content)}</text>`;
}

function codePage(file, lines, firstLine, lastLine, localTime, title) {
  const selected = lines.slice(firstLine - 1, lastLine);
  const activeOffset = Math.min(selected.length - 1, Math.max(0, Math.floor(localTime / (sceneDuration / selected.length))));
  const rendered = selected.map((line, offset) => {
    const lineNumber = firstLine + offset;
    const y = 286 + offset * 29;
    const active = offset === activeOffset;
    return `
      <g>
        <rect x="74" y="${y - 21}" width="1132" height="27" rx="6" fill="#1e3a8a" opacity="${active ? 0.78 : 0}"/>
        <text x="92" y="${y}" class="line-number">${lineNumber}</text>
        <text x="132" y="${y}" class="code" fill="${active ? '#ffffff' : '#cbd5e1'}">${escapeXml(line || ' ')}</text>
      </g>`;
  }).join('');
  return `
    ${windowChrome(55, 240, 1170, 422, title)}
    ${rendered}
    <text x="1188" y="644" text-anchor="end" class="page-count">${file} · lines ${firstLine}–${lastLine} of ${lines.length}</text>`;
}

function sceneSetup(time) {
  const local = time;
  return `
    <g opacity="${sceneOpacity(time, 0)}">
      ${header('CREATE A LOCAL KEK AND THE PLAINTEXT INPUT', '#7c3aed')}
      ${windowChrome(70, 238, 1140, 385, 'generate-kek.js and Terminal')}
      ${generateKekLines.map((line, index) => terminalLine(105, 292 + index * 27, `${String(index + 1).padStart(2)}  ${line}`, 'label', appear(local, 0.5 + index * 0.45))).join('')}
      ${terminalLine(105, 458, '$ export FILE_KEK_BASE64="$(node assets/downloads/node-aes-gcm-demo/generate-kek.js)"', 'command', appear(local, 4.5))}
      ${terminalLine(105, 504, "$ printf 'private journal entry\\n' > secret.txt", 'command', appear(local, 6.2))}
      ${terminalLine(105, 550, '$ wc -c secret.txt', 'command', appear(local, 7.8))}
      ${terminalLine(105, 586, '22 secret.txt', 'output', appear(local, 8.8))}
      <text x="640" y="670" text-anchor="middle" class="scene-caption">The environment KEK is a local KMS stand-in; the source and encrypted file do not contain it.</text>
    </g>`;
}

function sceneArchitecture(time) {
  const local = time - sceneDuration;
  const boxes = [
    { x: 80, y: 294, w: 210, title: 'CSPRNG', body: 'fresh 256-bit DEK' },
    { x: 355, y: 294, w: 240, title: 'AES-256-GCM', body: 'encrypt file once' },
    { x: 660, y: 294, w: 230, title: 'AES KEY WRAP', body: 'KEK protects DEK' },
    { x: 955, y: 294, w: 240, title: 'ENVELOPE', body: 'store wrapped key + data' },
  ];
  return `
    <g opacity="${sceneOpacity(time, 1)}">
      ${header('THE PRODUCTION PATTERN: ONE FRESH DATA KEY PER FILE', '#0f766e')}
      ${boxes.map((box, index) => `
        <g opacity="${appear(local, 0.8 + index * 1.5)}">
          <rect x="${box.x}" y="${box.y}" width="${box.w}" height="142" rx="18" fill="#ecfeff" stroke="#5eead4" stroke-width="2"/>
          <text x="${box.x + box.w / 2}" y="${box.y + 52}" text-anchor="middle" class="box-title">${box.title}</text>
          <text x="${box.x + box.w / 2}" y="${box.y + 94}" text-anchor="middle" class="box-copy">${box.body}</text>
        </g>
        ${index < boxes.length - 1 ? `<path d="M${box.x + box.w + 10} 365 H${boxes[index + 1].x - 12}" stroke="#0f766e" stroke-width="4" marker-end="url(#arrow)" opacity="${appear(local, 1.8 + index * 1.5)}"/>` : ''}`).join('')}
      <rect x="356" y="494" width="534" height="72" rx="18" fill="#eff6ff" stroke="#93c5fd"/>
      <text x="623" y="523" text-anchor="middle" class="annotation-title">NONCE RULE BY CONSTRUCTION</text>
      <text x="623" y="550" text-anchor="middle" class="annotation-copy">one GCM encryption under each DEK → no same-key nonce reuse</text>
      <text x="640" y="650" text-anchor="middle" class="scene-caption">A real KMS performs the generate/wrap or unwrap operation without exporting the KEK.</text>
    </g>`;
}

function sceneCode(time, sceneIndex, file, lines, firstLine, lastLine, label, colour) {
  const local = time - sceneIndex * sceneDuration;
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header(label, colour)}
      ${codePage(file, lines, firstLine, lastLine, local, `${file} · complete runnable source`)}
    </g>`;
}

function sceneRun(time) {
  const sceneIndex = 6;
  const local = time - sceneIndex * sceneDuration;
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header('RUN ENCRYPT.JS AND CAPTURE ITS OUTPUT', '#0891b2')}
      ${windowChrome(70, 238, 1140, 410, 'Terminal · envelope encryption')}
      ${terminalLine(105, 295, '$ node assets/downloads/node-aes-gcm-demo/encrypt.js', 'command')}
      ${captured.encryptOutput.map((row, index) => terminalLine(105, 352 + index * 44, row, row.startsWith('wrote:') ? 'success' : 'label', appear(local, 1 + index * 1.1))).join('')}
      <text x="640" y="682" text-anchor="middle" class="scene-caption">The wrapped key, nonce, tag and ciphertext are generated by this captured run.</text>
    </g>`;
}

function sceneEnvelope(time) {
  const sceneIndex = 7;
  const local = time - sceneIndex * sceneDuration;
  const segments = [
    { x: 70, w: 120, colour: '#ede9fe', name: 'JRN1', bytes: '4 bytes', range: '0–3' },
    { x: 190, w: 360, colour: '#dbeafe', name: 'WRAPPED DEK', bytes: '40 bytes', range: '4–43' },
    { x: 550, w: 180, colour: '#dcfce7', name: 'NONCE', bytes: '12 bytes', range: '44–55' },
    { x: 730, w: 220, colour: '#ffedd5', name: 'TAG', bytes: '16 bytes', range: '56–71' },
    { x: 950, w: 260, colour: '#ffe4e6', name: 'CIPHERTEXT', bytes: '22 bytes', range: '72–93' },
  ];
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header('INSPECT THE 94-BYTE ENVELOPE', '#d97706')}
      <text x="640" y="257" text-anchor="middle" class="section-title">format || wrapped DEK || nonce || tag || ciphertext</text>
      ${segments.map((segment, index) => `
        <g opacity="${appear(local, 0.8 + index * 1.25)}">
          <rect x="${segment.x}" y="310" width="${segment.w}" height="170" fill="${segment.colour}" stroke="#cbd5e1" stroke-width="2"/>
          <text x="${segment.x + segment.w / 2}" y="356" text-anchor="middle" class="segment-title">${segment.name}</text>
          <text x="${segment.x + segment.w / 2}" y="405" text-anchor="middle" class="segment-bytes">${segment.bytes}</text>
          <text x="${segment.x + segment.w / 2}" y="447" text-anchor="middle" class="segment-range">offset ${segment.range}</text>
        </g>`).join('')}
      <text x="640" y="548" text-anchor="middle" class="body-note">4 + 40 + 12 + 16 + 22 = 94 bytes</text>
      <text x="640" y="590" text-anchor="middle" class="body-note">JRN1 + wrapped DEK + nonce are Additional Authenticated Data.</text>
      <text x="640" y="622" text-anchor="middle" class="body-note">AES-KW's fixed A6… initial value is not the GCM nonce.</text>
      <text x="640" y="674" text-anchor="middle" class="scene-caption">The envelope stores what decryption needs, except the KEK that authorizes unwrapping.</text>
    </g>`;
}

function sceneVerify(time) {
  const sceneIndex = 12;
  const local = time - sceneIndex * sceneDuration;
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header('UNWRAP, AUTHENTICATE, DECRYPT AND COMPARE', '#16a34a')}
      ${windowChrome(80, 238, 1120, 405, 'Terminal · successful decryption')}
      ${terminalLine(120, 304, '$ node assets/downloads/node-aes-gcm-demo/decrypt.js', 'command')}
      ${terminalLine(120, 362, captured.decryptOutput[0], 'success', appear(local, 1.2))}
      ${terminalLine(120, 410, captured.decryptOutput[1], 'output', appear(local, 2.4))}
      ${terminalLine(120, 476, '$ diff secret.txt secret-decrypted.txt', 'command', appear(local, 4.0))}
      ${terminalLine(120, 528, '$ echo $?', 'command', appear(local, 5.4))}
      ${terminalLine(245, 528, '0', 'success', appear(local, 6.3))}
      <g opacity="${appear(local, 7.2)}">
        <circle cx="1025" cy="455" r="68" fill="#052e16" stroke="#22c55e" stroke-width="4"/>
        <path d="M991 455 L1016 480 L1062 427" fill="none" stroke="#4ade80" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="1025" y="552" text-anchor="middle" class="success-title">IDENTICAL</text>
      </g>
      <text x="640" y="680" text-anchor="middle" class="scene-caption">Plaintext is written only after decipher.final() verifies the GCM tag.</text>
    </g>`;
}

function sceneTamper(time) {
  const sceneIndex = 13;
  const local = time - sceneIndex * sceneDuration;
  return `
    <g opacity="${sceneOpacity(time, sceneIndex)}">
      ${header('CHANGE ONE CIPHERTEXT BIT AND VERIFY FAILURE', '#dc2626')}
      ${windowChrome(70, 238, 1140, 410, 'Terminal · tamper test')}
      ${terminalLine(105, 294, '$ mv secret-decrypted.txt verified-copy.txt', 'command')}
      ${terminalLine(105, 340, '$ node -e "const fs=require(\'node:fs\'); \\', 'command', appear(local, 1.0))}
      ${terminalLine(105, 378, '> const p=fs.readFileSync(\'secret.txt.enc\'); p[p.length-1]^=1; \\', 'command', appear(local, 1.8))}
      ${terminalLine(105, 416, '> fs.writeFileSync(\'secret.txt.enc\',p)"', 'command', appear(local, 2.6))}
      ${terminalLine(105, 470, '$ node assets/downloads/node-aes-gcm-demo/decrypt.js', 'command', appear(local, 4.0))}
      ${terminalLine(105, 518, captured.tamperOutput, 'error', appear(local, 5.3))}
      ${terminalLine(105, 572, '$ test ! -e secret-decrypted.txt; echo $?', 'command', appear(local, 6.8))}
      ${terminalLine(470, 572, '0', 'success', appear(local, 7.8))}
      <text x="640" y="674" text-anchor="middle" class="scene-caption">The changed envelope is rejected and no unauthenticated plaintext file is created.</text>
    </g>`;
}

function frameSvg(time) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0f766e"/></marker></defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      .terminal, .code, .line-number { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .eyebrow { fill: #2563eb; font-size: 15px; font-weight: 750; letter-spacing: 2.5px; }
      .title { fill: #0f172a; font-size: 32px; font-weight: 790; }
      .subtitle { fill: #475569; font-size: 16px; }
      .section-name { font-size: 16px; font-weight: 800; }
      .window-title { fill: #94a3b8; font-size: 13px; font-weight: 700; }
      .terminal { font-size: 14px; }
      .line-number { fill: #64748b; font-size: 12px; }
      .code { font-size: 13px; }
      .page-count { fill: #64748b; font-size: 12px; }
      .scene-caption { fill: #0f172a; font-size: 18px; font-weight: 760; }
      .section-title { fill: #0f172a; font-size: 22px; font-weight: 800; }
      .body-note { fill: #64748b; font-size: 16px; }
      .box-title { fill: #0f766e; font-size: 17px; font-weight: 850; }
      .box-copy { fill: #334155; font-size: 15px; }
      .segment-title { fill: #334155; font-size: 15px; font-weight: 850; letter-spacing: 0.7px; }
      .segment-bytes { fill: #0f172a; font-size: 19px; font-weight: 800; }
      .segment-range { fill: #64748b; font-size: 13px; }
      .success-title { fill: #4ade80; font-size: 19px; font-weight: 900; letter-spacing: 1px; }
      .annotation-title { fill: #1d4ed8; font-size: 14px; font-weight: 850; }
      .annotation-copy { fill: #334155; font-size: 15px; font-weight: 700; }
    </style>
    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="24" y="22" width="1232" height="676" rx="28" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    ${sceneSetup(time)}
    ${sceneArchitecture(time)}
    ${sceneCode(time, 2, 'encrypt.js', encryptLines, 1, 11, 'ENCRYPT.JS · LOAD AND VALIDATE THE KEK', '#2563eb')}
    ${sceneCode(time, 3, 'encrypt.js', encryptLines, 12, 22, 'ENCRYPT.JS · GENERATE THE PER-FILE DEK AND NONCE', '#2563eb')}
    ${sceneCode(time, 4, 'encrypt.js', encryptLines, 23, 33, 'ENCRYPT.JS · WRAP THE DEK AND ENCRYPT WITH AAD', '#2563eb')}
    ${sceneCode(time, 5, 'encrypt.js', encryptLines, 34, encryptLines.length, 'ENCRYPT.JS · PACK, WRITE AND CLEAR KEYS', '#2563eb')}
    ${sceneRun(time)}
    ${sceneEnvelope(time)}
    ${sceneCode(time, 8, 'decrypt.js', decryptLines, 1, 12, 'DECRYPT.JS · LOAD THE LOCAL KEK', '#9333ea')}
    ${sceneCode(time, 9, 'decrypt.js', decryptLines, 13, 24, 'DECRYPT.JS · VALIDATE AND PARSE THE ENVELOPE', '#9333ea')}
    ${sceneCode(time, 10, 'decrypt.js', decryptLines, 25, 36, 'DECRYPT.JS · UNWRAP THE PER-FILE DEK', '#9333ea')}
    ${sceneCode(time, 11, 'decrypt.js', decryptLines, 37, decryptLines.length, 'DECRYPT.JS · VERIFY BEFORE WRITING PLAINTEXT', '#9333ea')}
    ${sceneVerify(time)}
    ${sceneTamper(time)}
  </svg>`;
}

async function renderFrame(index) {
  const time = index / fps;
  const filename = path.join(framesDir, `frame-${String(index).padStart(4, '0')}.png`);
  await sharp(Buffer.from(frameSvg(time))).png({ compressionLevel: 9 }).toFile(filename);
}

(async () => {
  if (process.env.PREVIEW_TIME) {
    const previewTime = Number(process.env.PREVIEW_TIME);
    if (!Number.isFinite(previewTime) || previewTime < 0 || previewTime >= duration) {
      throw new Error(`PREVIEW_TIME must be between 0 and ${duration}`);
    }
    await sharp(Buffer.from(frameSvg(previewTime))).png({ compressionLevel: 9 }).toFile(posterPath);
    process.stdout.write(`Preview written to ${posterPath}\n`);
    return;
  }

  const concurrency = 8;
  for (let start = 0; start < frameCount; start += concurrency) {
    const batch = [];
    for (let index = start; index < Math.min(start + concurrency, frameCount); index += 1) {
      batch.push(renderFrame(index));
    }
    await Promise.all(batch);
    if (start % 300 === 0) process.stdout.write(`Rendered ${Math.min(start + concurrency, frameCount)}/${frameCount} frames\n`);
  }

  await sharp(Buffer.from(frameSvg(178))).png({ compressionLevel: 9 }).toFile(posterPath);
  process.stdout.write(`Poster written to ${posterPath}\n`);
})();
