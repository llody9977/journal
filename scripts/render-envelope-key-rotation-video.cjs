#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const width = 1280;
const height = 720;
const fps = 24;
const sceneDuration = 14;
const sceneCount = 10;
const duration = sceneDuration * sceneCount;
const frameCount = fps * duration;
const framesDir = process.argv[2];
const posterPath = process.argv[3];

if (!framesDir || !posterPath) {
  console.error('Usage: render-envelope-key-rotation-video.cjs <frames-dir> <poster-path>');
  process.exit(1);
}

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(posterPath), { recursive: true });

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const progress = (time, start, end) => smooth((time - start) / (end - start));
const appear = (time, at, span = 0.7) => progress(time, at, at + span);
const sceneOpacity = (time, index, feather = 0.7) => {
  const start = index * sceneDuration - feather;
  const end = (index + 1) * sceneDuration;
  return clamp((time - start) / feather) * clamp((end - time) / feather);
};

function header(label, summary, color = '#2563eb') {
  return `
    <text x="70" y="62" class="eyebrow">ENVELOPE ENCRYPTION · KEY LIFECYCLE</text>
    <text x="70" y="102" class="title">DEK, KEK, CMEK and key rotation</text>
    <text x="70" y="132" class="subtitle">${summary}</text>
    <text x="70" y="180" class="section" fill="${color}">${label}</text>
    <line x1="70" y1="196" x2="1210" y2="196" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
}

function card(x, y, w, h, title, color = '#2563eb', opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="${w}" height="48" rx="20" fill="${color}"/>
      <path d="M${x} ${y + 28} H${x + w} V${y + 48} H${x}Z" fill="${color}"/>
      <text x="${x + 22}" y="${y + 31}" class="card-title">${title}</text>
    </g>`;
}

function keyIcon(x, y, color, label, note, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <circle cx="${x}" cy="${y}" r="21" fill="#ffffff" stroke="${color}" stroke-width="8"/>
      <circle cx="${x}" cy="${y}" r="7" fill="${color}" opacity="0.22"/>
      <path d="M${x + 18} ${y - 7} H${x + 83} V${y + 7} H${x + 68} V${y + 22} H${x + 51} V${y + 7} H${x + 18}Z" fill="${color}"/>
      <text x="${x + 42}" y="${y + 52}" text-anchor="middle" class="key-label" fill="${color}">${label}</text>
      ${note ? `<text x="${x + 42}" y="${y + 73}" text-anchor="middle" class="key-note">${note}</text>` : ''}
    </g>`;
}

function arrow(x1, y1, x2, y2, color, amount = 1, dashed = false) {
  const p = clamp(amount);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  return `
    <g opacity="${p}">
      <line x1="${x1}" y1="${y1}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="5" stroke-linecap="round" ${dashed ? 'stroke-dasharray="10 10"' : ''}/>
      <circle cx="${x}" cy="${y}" r="7" fill="${color}"/>
    </g>`;
}

function labelPill(x, y, w, text, color, tint, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="40" rx="20" fill="${tint}" stroke="${color}" stroke-width="2"/>
      <text x="${x + w / 2}" y="${y + 26}" text-anchor="middle" class="pill" fill="${color}">${text}</text>
    </g>`;
}

function dataBlock(x, y, title, line1, line2, color = '#0f766e', opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="300" height="142" rx="18" fill="#ffffff" stroke="${color}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="300" height="42" rx="18" fill="${color}" opacity="0.12"/>
      <path d="M${x} ${y + 24} H${x + 300} V${y + 42} H${x}Z" fill="${color}" opacity="0.12"/>
      <text x="${x + 20}" y="${y + 28}" class="data-title" fill="${color}">${title}</text>
      <text x="${x + 20}" y="${y + 80}" class="mono">${line1}</text>
      <text x="${x + 20}" y="${y + 110}" class="mono">${line2}</text>
    </g>`;
}

function envelope(x, y, keyVersion, dataName, opacity = 1, wrappedColor = '#7c3aed') {
  const ciphertext = dataName.includes('NEW') ? '4c b1 08 … 52' : '9f 3a 71 … c8';
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="430" height="164" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="430" height="42" rx="18" fill="#f1f5f9"/>
      <path d="M${x} ${y + 24} H${x + 430} V${y + 42} H${x}Z" fill="#f1f5f9"/>
      <text x="${x + 20}" y="${y + 28}" class="data-title" fill="#334155">STORED ENVELOPE · ${dataName}</text>
      <rect x="${x + 18}" y="${y + 62}" width="238" height="76" rx="12" fill="#ecfeff" stroke="#5eead4"/>
      <text x="${x + 137}" y="${y + 92}" text-anchor="middle" class="field-title">DATA CIPHERTEXT</text>
      <text x="${x + 137}" y="${y + 118}" text-anchor="middle" class="mono">${ciphertext}</text>
      <rect x="${x + 272}" y="${y + 62}" width="140" height="76" rx="12" fill="#f5f3ff" stroke="${wrappedColor}"/>
      <text x="${x + 342}" y="${y + 91}" text-anchor="middle" class="field-title">WRAPPED DEK</text>
      <text x="${x + 342}" y="${y + 117}" text-anchor="middle" class="mono">key=${keyVersion}</text>
    </g>`;
}

function kmsBox(x, y, w, h, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="#0f172a" stroke="#475569" stroke-width="3"/>
      <text x="${x + w / 2}" y="${y + 38}" text-anchor="middle" class="kms-title">CUSTOMER-CONTROLLED KMS / HSM</text>
    </g>`;
}

function sceneHierarchy(time) {
  const local = time;
  return `
    <g opacity="${sceneOpacity(time, 0)}">
      ${header('ONE DATA OBJECT, TWO KEY LAYERS', 'The DEK protects data. The KEK protects the DEK. CMEK describes who controls the KEK.', '#0f766e')}
      ${dataBlock(70, 278, 'PLAINTEXT DATA', 'journal.db', 'balance = $1,250', '#0f766e', appear(local, 0.7))}
      ${keyIcon(455, 350, '#0891b2', 'DEK', 'symmetric data key', appear(local, 2.0))}
      ${arrow(380, 350, 438, 350, '#0891b2', progress(local, 2.5, 3.8))}
      ${dataBlock(600, 278, 'ENCRYPTED DATA', 'ciphertext + tag', 'safe to store', '#2563eb', appear(local, 4.0))}
      ${arrow(535, 350, 590, 350, '#0891b2', progress(local, 4.0, 5.2))}
      ${keyIcon(1010, 350, '#7c3aed', 'KEK', 'wraps only the DEK', appear(local, 5.5))}
      <path d="M1010 402 C980 490 760 490 505 423" fill="none" stroke="#7c3aed" stroke-width="5" stroke-dasharray="10 10" opacity="${appear(local, 6.5)}"/>
      ${labelPill(892, 500, 285, 'CMEK = CUSTOMER CONTROL', '#7c3aed', '#f5f3ff', appear(local, 7.8))}
      <text x="640" y="610" text-anchor="middle" class="caption">CMEK is not a third encryption algorithm. It is the customer-controlled key resource used as the KEK.</text>
      <text x="640" y="646" text-anchor="middle" class="note">The bulk data remains encrypted with the symmetric DEK.</text>
    </g>`;
}

function sceneDek(time) {
  const local = time - sceneDuration;
  return `
    <g opacity="${sceneOpacity(time, 1)}">
      ${header('THE SYMMETRIC DEK DOES THE BULK WORK', 'One random data-encryption key is used by a fast symmetric cipher for the actual bytes.', '#0891b2')}
      ${card(70, 244, 360, 320, 'INPUT', '#0f766e')}
      <text x="105" y="325" class="body-strong">20 GB virtual disk</text>
      <text x="105" y="365" class="body">millions of blocks</text>
      <text x="105" y="405" class="body">continuous reads and writes</text>
      <text x="105" y="470" class="body-emphasis" fill="#0f766e">needs speed + low latency</text>
      ${keyIcon(535, 385, '#0891b2', 'DEK', 'same secret encrypts/decrypts', appear(local, 1.5))}
      ${arrow(440, 385, 515, 385, '#0891b2', progress(local, 1.7, 3.0))}
      ${card(705, 244, 500, 320, 'SYMMETRIC DATA ENCRYPTION', '#0891b2', appear(local, 3.0))}
      <text x="740" y="325" class="body-strong">AES-256-GCM / AES-XTS</text>
      <text x="740" y="365" class="body">chosen for the storage design</text>
      <text x="740" y="420" class="body-emphasis" fill="#0891b2">DEK encrypts the data</text>
      <text x="740" y="460" class="body-emphasis" fill="#0891b2">DEK decrypts the data</text>
      <text x="740" y="515" class="body">The KEK is not used on every block.</text>
      <text x="640" y="626" text-anchor="middle" class="caption">This is why disk, file and database encryption keep using symmetric keys.</text>
    </g>`;
}

function sceneSymmetricKek(time) {
  const local = time - sceneDuration * 2;
  return `
    <g opacity="${sceneOpacity(time, 2)}">
      ${header('COMMON DESIGN: A SYMMETRIC CMEK ACTS AS THE KEK', 'The KMS uses the customer-managed key to wrap and unwrap a small DEK—not the bulk data.', '#7c3aed')}
      ${kmsBox(70, 245, 490, 330)}
      ${keyIcon(255, 355, '#7c3aed', 'CMEK / KEK', 'symmetric key in KMS', appear(local, 0.8))}
      ${labelPill(155, 474, 320, 'RAW KEK DOES NOT LEAVE KMS', '#c4b5fd', '#2e1065', appear(local, 2.0))}
      ${keyIcon(660, 338, '#0891b2', 'DEK', '32 random bytes', appear(local, 2.8))}
      ${arrow(650, 405, 535, 405, '#7c3aed', progress(local, 3.0, 4.4))}
      ${arrow(535, 455, 650, 455, '#0891b2', progress(local, 5.0, 6.3))}
      <text x="600" y="389" text-anchor="middle" class="arrow-label">wrap(DEK)</text>
      <text x="600" y="490" text-anchor="middle" class="arrow-label">wrapped DEK</text>
      ${envelope(775, 280, 'cmek/v1', 'journal.db', appear(local, 6.2))}
      <text x="640" y="630" text-anchor="middle" class="caption">AWS EBS and Google CMEK-integrated services use this symmetric key hierarchy.</text>
    </g>`;
}

function sceneAsymmetricKek(time) {
  const local = time - sceneDuration * 3;
  return `
    <g opacity="${sceneOpacity(time, 3)}">
      ${header('ASYMMETRIC KEY AT THE WRAPPING LAYER', 'The public key can protect a DEK outside KMS; only the KMS-held private key can recover it.', '#b45309')}
      ${card(70, 248, 340, 300, 'OUTSIDE THE KMS', '#b45309')}
      ${keyIcon(160, 345, '#d97706', 'PUBLIC KEY', 'safe to distribute', appear(local, 0.8))}
      <text x="105" y="470" class="body">encrypt / wrap a small DEK</text>
      <text x="105" y="505" class="body">no private key or KMS credential</text>
      ${arrow(420, 398, 610, 398, '#d97706', progress(local, 2.5, 4.2))}
      ${labelPill(435, 330, 160, 'WRAPPED DEK', '#b45309', '#fff7ed', appear(local, 3.0))}
      ${kmsBox(630, 248, 575, 300, appear(local, 4.2))}
      ${keyIcon(800, 360, '#b45309', 'PRIVATE KEY', 'non-exportable', appear(local, 4.8))}
      <text x="930" y="330" class="body-light">unwrap(DEK)</text>
      <text x="930" y="370" class="body-light">return DEK to trusted runtime</text>
      <text x="930" y="430" class="body-light">private key stays inside</text>
      <text x="930" y="470" class="body-light">KMS / HSM boundary</text>
      <text x="640" y="615" text-anchor="middle" class="caption">Azure Managed Disks can use an RSA customer-managed key to wrap the symmetric DEK.</text>
      <text x="640" y="649" text-anchor="middle" class="note">RSA still does not encrypt the disk data itself.</text>
    </g>`;
}

function sceneCustody(time) {
  const local = time - sceneDuration * 4;
  return `
    <g opacity="${sceneOpacity(time, 4)}">
      ${header('GRANT KEY USE—DO NOT TRANSFER THE CMEK', 'A dedicated service identity gets narrow cryptographic permission while the raw CMEK stays in its boundary.', '#16a34a')}
      ${card(65, 250, 330, 300, 'VENDOR SERVICE', '#2563eb')}
      <circle cx="150" cy="355" r="34" fill="#dbeafe"/>
      <circle cx="150" cy="344" r="12" fill="#2563eb"/>
      <path d="M124 389 Q150 355 176 389" fill="#2563eb"/>
      <text x="205" y="347" class="body-strong">service identity</text>
      <text x="205" y="383" class="mono">vendor-prod-42</text>
      <text x="100" y="465" class="body">needs wrap / unwrap only</text>
      ${arrow(405, 385, 620, 385, '#16a34a', progress(local, 1.8, 3.6))}
      ${labelPill(425, 315, 175, 'IAM GRANT', '#15803d', '#dcfce7', appear(local, 2.3))}
      ${kmsBox(640, 250, 565, 300, appear(local, 3.4))}
      ${keyIcon(825, 360, '#7c3aed', 'CMEK', 'customer lifecycle control', appear(local, 4.4))}
      <text x="965" y="335" class="body-light">allowed:</text>
      <text x="965" y="370" class="mono-light">wrap / unwrap</text>
      <text x="965" y="420" class="body-light">not allowed:</text>
      <text x="965" y="455" class="mono-light">export / delete / policy</text>
      <path d="M470 505 H595" stroke="#dc2626" stroke-width="5"/>
      <text x="532" y="496" text-anchor="middle" class="danger">NO RAW KEY COPY</text>
      <text x="640" y="620" text-anchor="middle" class="caption">Non-extractability stops copying the key; least privilege limits how the vendor can use it.</text>
    </g>`;
}

function sceneBeforeRotation(time) {
  const local = time - sceneDuration * 5;
  return `
    <g opacity="${sceneOpacity(time, 5)}">
      ${header('BEFORE ROTATION: VERSION 1 PROTECTS THE WRAPPED DEK', 'The stored envelope records which logical key and version can unwrap its DEK.', '#7c3aed')}
      ${kmsBox(70, 252, 410, 300)}
      <text x="275" y="330" text-anchor="middle" class="kms-subtitle">CMEK · logical key “journal”</text>
      ${labelPill(145, 365, 260, 'V1 · PRIMARY', '#c4b5fd', '#4c1d95', appear(local, 1.0))}
      <text x="275" y="445" text-anchor="middle" class="body-light">used for new wrap operations</text>
      <text x="275" y="485" text-anchor="middle" class="body-light">available for unwrap</text>
      ${envelope(675, 270, 'journal/v1', 'OLD DATA A', appear(local, 2.8))}
      ${keyIcon(555, 360, '#0891b2', 'DEK-A', 'encrypts old data', appear(local, 2.0))}
      ${arrow(650, 440, 480, 440, '#7c3aed', progress(local, 3.2, 4.8))}
      <text x="570" y="475" text-anchor="middle" class="arrow-label">wrapped under v1</text>
      <text x="640" y="620" text-anchor="middle" class="caption">The data ciphertext depends on DEK-A. The wrapped DEK depends on CMEK version 1.</text>
    </g>`;
}

function sceneRotate(time) {
  const local = time - sceneDuration * 6;
  return `
    <g opacity="${sceneOpacity(time, 6)}">
      ${header('ROTATE: VERSION 2 BECOMES PRIMARY FOR NEW WRITES', 'Rotation adds new KEK material. It does not automatically change old data or old wrapped DEKs.', '#2563eb')}
      ${kmsBox(60, 245, 500, 340)}
      <text x="310" y="323" text-anchor="middle" class="kms-subtitle">same logical CMEK · “journal”</text>
      ${labelPill(110, 360, 190, 'V1 · DECRYPT', '#cbd5e1', '#334155', appear(local, 0.8))}
      ${labelPill(320, 360, 190, 'V2 · PRIMARY', '#60a5fa', '#1e3a8a', appear(local, 2.0))}
      <text x="205" y="438" text-anchor="middle" class="body-light">kept enabled</text>
      <text x="205" y="470" text-anchor="middle" class="body-light">for old unwraps</text>
      <text x="415" y="438" text-anchor="middle" class="body-light">new wrap operations</text>
      <text x="415" y="470" text-anchor="middle" class="body-light">use v2</text>
      ${envelope(700, 250, 'journal/v1', 'OLD DATA A', 1, '#64748b')}
      ${envelope(700, 440, 'journal/v2', 'NEW DATA B', appear(local, 3.6), '#2563eb')}
      <text x="640" y="636" text-anchor="middle" class="caption">Old data remains readable because version 1 is retained for decrypt/unwrap.</text>
    </g>`;
}

function sceneReadOld(time) {
  const local = time - sceneDuration * 7;
  return `
    <g opacity="${sceneOpacity(time, 7)}">
      ${header('READ OLD DATA AFTER ROTATION', 'The envelope points to version 1, so KMS uses the old key material to recover DEK-A.', '#16a34a')}
      ${envelope(65, 270, 'journal/v1', 'OLD DATA A', 1, '#64748b')}
      ${arrow(505, 352, 650, 352, '#64748b', progress(local, 1.0, 2.8))}
      ${kmsBox(665, 245, 540, 330, appear(local, 2.5))}
      ${labelPill(715, 325, 190, 'V1 · ENABLED', '#cbd5e1', '#334155', appear(local, 3.2))}
      ${labelPill(935, 325, 190, 'V2 · PRIMARY', '#60a5fa', '#1e3a8a', appear(local, 3.2))}
      <text x="935" y="425" text-anchor="middle" class="body-light">KMS selects v1</text>
      <text x="935" y="462" text-anchor="middle" class="body-light">unwraps DEK-A</text>
      ${arrow(665, 500, 505, 500, '#0891b2', progress(local, 5.0, 6.5))}
      ${labelPill(500, 480, 150, 'DEK-A', '#0891b2', '#cffafe', appear(local, 5.5))}
      <text x="285" y="520" text-anchor="middle" class="body-emphasis" fill="#15803d" opacity="${appear(local, 7.0)}">DEK-A decrypts the old ciphertext ✓</text>
      <text x="640" y="620" text-anchor="middle" class="caption">AWS selects old backing material automatically; versioned systems retain or store the version reference.</text>
    </g>`;
}

function comparisonRow(y, title, changes, stays, color, opacity) {
  return `
    <g opacity="${opacity}">
      <rect x="80" y="${y}" width="1120" height="92" rx="16" fill="#ffffff" stroke="${color}" stroke-width="2"/>
      <rect x="80" y="${y}" width="235" height="92" rx="16" fill="${color}" opacity="0.14"/>
      <path d="M295 ${y} H315 V${y + 92} H295Z" fill="${color}" opacity="0.14"/>
      <text x="108" y="${y + 38}" class="row-title" fill="${color}">${title}</text>
      <text x="108" y="${y + 64}" class="row-note">what the operation means</text>
      <text x="350" y="${y + 35}" class="row-label">CHANGES</text>
      <text x="350" y="${y + 64}" class="body">${changes}</text>
      <text x="780" y="${y + 35}" class="row-label">STAYS THE SAME</text>
      <text x="780" y="${y + 64}" class="body">${stays}</text>
    </g>`;
}

function sceneMigration(time) {
  const local = time - sceneDuration * 8;
  return `
    <g opacity="${sceneOpacity(time, 8)}">
      ${header('ROTATE, REWRAP AND RE-ENCRYPT ARE DIFFERENT', 'I need to name the operation because each one changes a different layer.', '#b45309')}
      ${comparisonRow(245, 'ROTATE KEK', 'new KEK version for future wraps', 'old wrapped DEKs + data ciphertext', '#7c3aed', appear(local, 0.6))}
      ${comparisonRow(360, 'REWRAP DEK', 'wrapped DEK moves from v1 to v2', 'same DEK + same data ciphertext', '#2563eb', appear(local, 2.2))}
      ${comparisonRow(475, 'RE-ENCRYPT DATA', 'new DEK + rewritten data ciphertext', 'business plaintext and policy intent', '#b45309', appear(local, 3.8))}
      <text x="640" y="620" text-anchor="middle" class="caption">Rewrapping is usually much cheaper than decrypting and rewriting every byte of data.</text>
      <text x="640" y="652" text-anchor="middle" class="note">Rotation alone does not remove dependence on version 1.</text>
    </g>`;
}

function checklistItem(y, text, detail, color, opacity) {
  return `
    <g opacity="${opacity}">
      <circle cx="105" cy="${y}" r="17" fill="${color}"/>
      <path d="M97 ${y} L103 ${y + 7} L115 ${y - 8}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="140" y="${y - 2}" class="check-title">${text}</text>
      <text x="140" y="${y + 24}" class="check-note">${detail}</text>
    </g>`;
}

function sceneRetire(time) {
  const local = time - sceneDuration * 9;
  return `
    <g opacity="${sceneOpacity(time, 9)}">
      ${header('RETIRE AN OLD VERSION ONLY AFTER DEPENDENCIES ARE GONE', 'Destroying version 1 early can make every DEK still wrapped by it unrecoverable.', '#dc2626')}
      ${checklistItem(275, 'Inventory every reference to version 1', 'wrapped DEKs, ciphertext metadata, snapshots, backups and replicas', '#2563eb', appear(local, 0.5))}
      ${checklistItem(350, 'Rewrap or re-encrypt what must remain readable', 'verify that version 2 can recover the required data', '#2563eb', appear(local, 1.8))}
      ${checklistItem(425, 'Disable version 1 and observe before destroying it', 'a reversible failure test is safer than immediate permanent deletion', '#b45309', appear(local, 3.1))}
      ${checklistItem(500, 'Destroy only after retention and recovery checks pass', 'deletion is a data-destruction decision, not routine housekeeping', '#16a34a', appear(local, 4.4))}
      <g opacity="${appear(local, 6.0)}">
        <rect x="750" y="250" width="430" height="270" rx="24" fill="#fef2f2" stroke="#dc2626" stroke-width="3"/>
        <text x="965" y="302" text-anchor="middle" class="danger-title">DESTROY V1 TOO EARLY</text>
        <text x="965" y="360" text-anchor="middle" class="mono">wrapped DEK-A → v1</text>
        <path d="M835 390 H1095" stroke="#dc2626" stroke-width="6"/>
        <text x="965" y="435" text-anchor="middle" class="danger-title">DEK-A CANNOT BE RECOVERED</text>
        <text x="965" y="478" text-anchor="middle" class="danger">old data becomes unavailable</text>
      </g>
      <text x="640" y="626" text-anchor="middle" class="caption">My rule: keep old versions decrypt-capable until migration and retention evidence says they are no longer needed.</text>
    </g>`;
}

function frameSvg(time) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      .mono, .mono-light { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .eyebrow { fill: #2563eb; font-size: 15px; font-weight: 800; letter-spacing: 2.4px; }
      .title { fill: #0f172a; font-size: 32px; font-weight: 800; }
      .subtitle { fill: #475569; font-size: 16px; }
      .section { font-size: 16px; font-weight: 850; }
      .card-title { fill: #ffffff; font-size: 15px; font-weight: 850; letter-spacing: 0.8px; }
      .key-label { font-size: 16px; font-weight: 900; }
      .key-note { fill: #64748b; font-size: 13px; }
      .pill { font-size: 13px; font-weight: 850; letter-spacing: 0.5px; }
      .data-title, .field-title { font-size: 13px; font-weight: 850; letter-spacing: 0.7px; }
      .mono { fill: #334155; font-size: 14px; }
      .mono-light { fill: #dbeafe; font-size: 14px; }
      .kms-title { fill: #94a3b8; font-size: 14px; font-weight: 850; letter-spacing: 1px; }
      .kms-subtitle { fill: #e2e8f0; font-size: 18px; font-weight: 800; }
      .body { fill: #475569; font-size: 16px; }
      .body-light { fill: #e2e8f0; font-size: 15px; }
      .body-strong { fill: #0f172a; font-size: 20px; font-weight: 800; }
      .body-emphasis { font-size: 17px; font-weight: 800; }
      .arrow-label { fill: #64748b; font-size: 13px; font-weight: 750; }
      .caption { fill: #0f172a; font-size: 18px; font-weight: 800; }
      .note { fill: #64748b; font-size: 15px; }
      .danger { fill: #b91c1c; font-size: 14px; font-weight: 850; }
      .danger-title { fill: #b91c1c; font-size: 17px; font-weight: 900; letter-spacing: 0.7px; }
      .row-title { font-size: 17px; font-weight: 900; }
      .row-note { fill: #64748b; font-size: 12px; }
      .row-label { fill: #64748b; font-size: 12px; font-weight: 850; letter-spacing: 1px; }
      .check-title { fill: #0f172a; font-size: 17px; font-weight: 850; }
      .check-note { fill: #64748b; font-size: 14px; }
    </style>
    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="24" y="22" width="1232" height="676" rx="28" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    ${sceneHierarchy(time)}
    ${sceneDek(time)}
    ${sceneSymmetricKek(time)}
    ${sceneAsymmetricKek(time)}
    ${sceneCustody(time)}
    ${sceneBeforeRotation(time)}
    ${sceneRotate(time)}
    ${sceneReadOld(time)}
    ${sceneMigration(time)}
    ${sceneRetire(time)}
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
    if (start % 240 === 0) process.stdout.write(`Rendered ${Math.min(start + concurrency, frameCount)}/${frameCount} frames\n`);
  }

  await sharp(Buffer.from(frameSvg(105))).png({ compressionLevel: 9 }).toFile(posterPath);
  process.stdout.write(`Poster written to ${posterPath}\n`);
})();
