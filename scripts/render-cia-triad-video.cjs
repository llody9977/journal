#!/usr/bin/env node

// Render a six-phase CIA triad explainer as PNG frames.

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const width = 1280;
const height = 720;
const fps = 30;
const phaseLength = 12;
const phaseCount = 6;
const seconds = phaseLength * phaseCount;
const frameCount = fps * seconds;
const framesDir = process.argv[2];
const posterPath = process.argv[3];

if (!framesDir || !posterPath) {
  console.error('Usage: render-cia-triad-video.cjs <frames-dir> <poster-path>');
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
const appear = (time, at, duration = 0.5) => progress(time, at, at + duration);
const phaseOpacity = (time, index, feather = 0.6) => {
  const start = index * phaseLength - feather;
  const end = (index + 1) * phaseLength;
  return clamp((time - start) / feather) * clamp((end - time) / feather);
};

const phases = [
  { name: 'START WITH ONE RECORD', color: '#475569', tint: '#e2e8f0' },
  { name: 'CONFIDENTIALITY', color: '#2563eb', tint: '#dbeafe' },
  { name: 'INTEGRITY', color: '#d97706', tint: '#fef3c7' },
  { name: 'AVAILABILITY', color: '#16a34a', tint: '#dcfce7' },
  { name: 'COMPARE THE FAILURES', color: '#9333ea', tint: '#f3e8ff' },
  { name: 'MY CIA CHECKLIST', color: '#0f766e', tint: '#ccfbf1' },
];

function header(index, activity) {
  const phase = phases[index];
  return `
    <text x="70" y="78" class="title">One record, three different security promises</text>
    <text x="70" y="110" class="subtitle">I use the same appointment record to separate confidentiality, integrity and availability.</text>
    <text x="70" y="164" class="activity" fill="${phase.color}">${activity}</text>
    <line x1="70" y1="180" x2="1150" y2="180" stroke="${phase.color}" stroke-width="5" stroke-linecap="round"/>`;
}

function person(x, y, name, role, color, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <circle cx="${x}" cy="${y}" r="34" fill="${color}" opacity="0.16"/>
      <circle cx="${x}" cy="${y - 9}" r="12" fill="${color}"/>
      <path d="M${x - 22} ${y + 26} Q${x} ${y + 2} ${x + 22} ${y + 26}" fill="${color}"/>
      <text x="${x}" y="${y + 58}" text-anchor="middle" class="person-name">${name}</text>
      <text x="${x}" y="${y + 79}" text-anchor="middle" class="person-role">${role}</text>
    </g>`;
}

function recordCard(x, y, opacity = 1, timeValue = '10:00', stroke = '#cbd5e1', fill = '#ffffff') {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="360" height="190" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="360" height="48" rx="20" fill="#eff6ff"/>
      <path d="M${x} ${y + 30} H${x + 360} V${y + 48} H${x}Z" fill="#eff6ff"/>
      <text x="${x + 24}" y="${y + 31}" class="card-kicker">APPOINTMENT RECORD</text>
      <text x="${x + 24}" y="${y + 82}" class="card-label">Patient</text>
      <text x="${x + 165}" y="${y + 82}" class="card-value">Mei Tan</text>
      <text x="${x + 24}" y="${y + 121}" class="card-label">Date</text>
      <text x="${x + 165}" y="${y + 121}" class="card-value">7 August</text>
      <text x="${x + 24}" y="${y + 160}" class="card-label">Time</text>
      <text x="${x + 165}" y="${y + 160}" class="card-value">${timeValue}</text>
    </g>`;
}

function arrow(x1, y1, x2, y2, color, amount, dashed = false) {
  const p = clamp(amount);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  return `
    <line x1="${x1}" y1="${y1}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="5" stroke-linecap="round" ${dashed ? 'stroke-dasharray="10 10"' : ''}/>
    <circle cx="${x}" cy="${y}" r="8" fill="${color}" opacity="${p}"/>`;
}

function statusBadge(x, y, label, color, tint, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="220" height="48" rx="24" fill="${tint}" stroke="${color}" stroke-width="2"/>
      <circle cx="${x + 25}" cy="${y + 24}" r="8" fill="${color}"/>
      <text x="${x + 44}" y="${y + 30}" class="status" fill="${color}">${label}</text>
    </g>`;
}

function sceneRecord(time) {
  const index = 0;
  const local = time;
  return `
    <g opacity="${phaseOpacity(time, index)}">
      ${header(index, 'THE SAME INFORMATION WILL FACE THREE DIFFERENT TESTS')}
      ${person(190, 375, 'Mei', 'authorized user', '#16a34a', appear(local, 0.7))}
      ${recordCard(460, 280, appear(local, 1.5))}
      ${person(1090, 375, 'Mallory', 'not authorized', '#dc2626', appear(local, 2.3))}
      ${arrow(250, 375, 450, 375, '#16a34a', progress(local, 3.1, 4.3))}
      ${arrow(1030, 375, 830, 375, '#dc2626', progress(local, 4.2, 5.4), true)}
      <g opacity="${appear(local, 6.0)}">
        <rect x="220" y="535" width="840" height="82" rx="18" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="640" y="570" text-anchor="middle" class="definition">The CIA triad asks three separate questions about this one record.</text>
        <text x="640" y="598" text-anchor="middle" class="support">Who can read it? Is it still accurate? Can Mei get it when she needs it?</text>
      </g>
    </g>`;
}

function sceneConfidentiality(time) {
  const index = 1;
  const local = time - index * phaseLength;
  const blocked = appear(local, 4.2);
  return `
    <g opacity="${phaseOpacity(time, index)}">
      ${header(index, 'ONLY AUTHORIZED PARTIES SHOULD BE ABLE TO READ THE RECORD')}
      ${person(155, 370, 'Mallory', 'not authorized', '#dc2626', appear(local, 0.5))}
      ${arrow(220, 370, 480, 370, '#dc2626', progress(local, 1.2, 2.8), true)}
      <g opacity="${appear(local, 2.0)}">
        <path d="M510 305 L570 330 V395 Q570 445 510 470 Q450 445 450 395 V330Z" fill="#dbeafe" stroke="#2563eb" stroke-width="4"/>
        <rect x="486" y="366" width="48" height="42" rx="8" fill="#2563eb"/>
        <path d="M495 366 V350 A15 15 0 0 1 525 350 V366" fill="none" stroke="#2563eb" stroke-width="8"/>
      </g>
      ${statusBadge(400, 500, 'ACCESS DENIED', '#dc2626', '#fee2e2', blocked)}
      ${recordCard(750, 280, appear(local, 5.0))}
      ${person(1115, 370, 'Mei', 'authorized user', '#16a34a', appear(local, 5.8))}
      ${arrow(1055, 370, 1110 - 360, 370, '#16a34a', progress(local, 6.4, 7.7))}
      ${statusBadge(820, 500, 'READ ALLOWED', '#16a34a', '#dcfce7', appear(local, 7.8))}
      <text x="640" y="640" text-anchor="middle" class="scene-caption">Confidentiality controls disclosure: access control, encryption and least privilege.</text>
    </g>`;
}

function sceneIntegrity(time) {
  const index = 2;
  const local = time - index * phaseLength;
  const change = progress(local, 2.0, 3.6);
  return `
    <g opacity="${phaseOpacity(time, index)}">
      ${header(index, 'THE RECORD MUST REMAIN ACCURATE, COMPLETE AND UNALTERED')}
      ${recordCard(80, 292, appear(local, 0.5), '10:00', '#16a34a', '#f0fdf4')}
      <text x="260" y="515" text-anchor="middle" class="mini-label" fill="#16a34a">ORIGINAL · ACCEPTED</text>
      ${arrow(450, 385, 625, 385, '#dc2626', change, true)}
      <g opacity="${appear(local, 1.8)}">
        <text x="540" y="345" text-anchor="middle" class="attack-label">IMPROPER CHANGE</text>
        <text x="540" y="370" text-anchor="middle" class="support">10:00 → 16:00</text>
      </g>
      ${recordCard(640, 292, appear(local, 3.3), '16:00', '#dc2626', '#fef2f2')}
      <g opacity="${appear(local, 4.6)}">
        <rect x="1020" y="305" width="175" height="160" rx="20" fill="#fff7ed" stroke="#d97706" stroke-width="3"/>
        <text x="1107" y="345" text-anchor="middle" class="mini-label" fill="#b45309">VERIFY TAG</text>
        <text x="1107" y="387" text-anchor="middle" class="tag">expected ≠ received</text>
        <circle cx="1107" cy="426" r="22" fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>
        <path d="M1096 415 L1118 437 M1118 415 L1096 437" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>
      </g>
      ${statusBadge(820, 520, 'CHANGE REJECTED', '#dc2626', '#fee2e2', appear(local, 6.0))}
      <text x="640" y="640" text-anchor="middle" class="scene-caption">Integrity means I do not silently accept altered, incomplete or corrupted data.</text>
    </g>`;
}

function server(x, y, label, color, state, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="250" height="115" rx="18" fill="#0f172a" stroke="${color}" stroke-width="4"/>
      <text x="${x + 24}" y="${y + 39}" class="server-label">${label}</text>
      <circle cx="${x + 28}" cy="${y + 76}" r="8" fill="${color}"/>
      <text x="${x + 48}" y="${y + 82}" class="server-state" fill="${color}">${state}</text>
    </g>`;
}

function sceneAvailability(time) {
  const index = 3;
  const local = time - index * phaseLength;
  return `
    <g opacity="${phaseOpacity(time, index)}">
      ${header(index, 'AN AUTHORIZED USER MUST BE ABLE TO ACCESS IT WHEN NEEDED')}
      ${person(150, 385, 'Mei', 'authorized user', '#16a34a', appear(local, 0.4))}
      ${arrow(215, 370, 470, 330, '#16a34a', progress(local, 1.0, 2.4))}
      ${server(475, 275, 'PRIMARY SERVICE', '#ef4444', 'UNAVAILABLE', appear(local, 1.5))}
      <g opacity="${appear(local, 3.0)}">
        <path d="M600 405 C600 455 600 455 600 492" fill="none" stroke="#16a34a" stroke-width="5" stroke-dasharray="10 10"/>
        <polygon points="590,480 610,480 600,498" fill="#16a34a"/>
        <text x="625" y="460" class="support" fill="#15803d">automatic failover</text>
      </g>
      ${server(475, 495, 'STANDBY SERVICE', '#22c55e', 'READY', appear(local, 3.8))}
      ${arrow(725, 550, 905, 455, '#16a34a', progress(local, 5.0, 6.6))}
      ${recordCard(820, 280, appear(local, 6.0), '10:00', '#16a34a', '#f0fdf4')}
      ${statusBadge(890, 520, 'AVAILABLE NOW', '#16a34a', '#dcfce7', appear(local, 7.2))}
      <text x="640" y="660" text-anchor="middle" class="scene-caption">Availability is timely, reliable access—not whether an unauthorized person is allowed in.</text>
    </g>`;
}

function failureCard(x, color, letter, title, example, result, opacity) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="280" width="340" height="290" rx="24" fill="#ffffff" stroke="${color}" stroke-width="3"/>
      <circle cx="${x + 48}" cy="330" r="26" fill="${color}"/>
      <text x="${x + 48}" y="339" text-anchor="middle" class="letter">${letter}</text>
      <text x="${x + 88}" y="338" class="card-title">${title}</text>
      <line x1="${x + 28}" y1="365" x2="${x + 312}" y2="365" stroke="#e2e8f0" stroke-width="2"/>
      <text x="${x + 28}" y="410" class="card-question">${example}</text>
      <text x="${x + 28}" y="450" class="card-question">${result}</text>
      <rect x="${x + 28}" y="490" width="284" height="48" rx="14" fill="${color}" opacity="0.12"/>
      <text x="${x + 170}" y="520" text-anchor="middle" class="failure" fill="${color}">${letter} IS LOST</text>
    </g>`;
}

function sceneCompare(time) {
  const index = 4;
  const local = time - index * phaseLength;
  return `
    <g opacity="${phaseOpacity(time, index)}">
      ${header(index, 'THE CAUSE MAY OVERLAP, BUT THE FAILED PROPERTY IS DIFFERENT')}
      ${failureCard(70, '#2563eb', 'C', 'CONFIDENTIALITY', 'Mallory reads the record.', 'The data is disclosed.', appear(local, 0.6))}
      ${failureCard(470, '#d97706', 'I', 'INTEGRITY', '10:00 becomes 16:00.', 'Wrong data is accepted.', appear(local, 2.2))}
      ${failureCard(870, '#16a34a', 'A', 'AVAILABILITY', 'Mei requests the record.', 'The service cannot respond.', appear(local, 3.8))}
      <text x="640" y="640" text-anchor="middle" class="scene-caption">Leak, alteration and outage are three different failures, even when one incident causes several.</text>
    </g>`;
}

function checklistCard(x, color, letter, title, question, test, opacity) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="275" width="350" height="315" rx="24" fill="#ffffff" stroke="${color}" stroke-width="3"/>
      <circle cx="${x + 175}" cy="330" r="36" fill="${color}"/>
      <text x="${x + 175}" y="342" text-anchor="middle" class="big-letter">${letter}</text>
      <text x="${x + 175}" y="400" text-anchor="middle" class="card-title">${title}</text>
      <text x="${x + 175}" y="450" text-anchor="middle" class="check-question">${question}</text>
      <text x="${x + 175}" y="480" text-anchor="middle" class="check-question">${test}</text>
      <circle cx="${x + 175}" cy="535" r="22" fill="#dcfce7" stroke="#16a34a" stroke-width="3"/>
      <path d="M${x + 164} 535 L${x + 172} 543 L${x + 188} 525" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

function sceneChecklist(time) {
  const index = 5;
  const local = time - index * phaseLength;
  return `
    <g opacity="${phaseOpacity(time, index)}">
      ${header(index, 'I ASK ALL THREE QUESTIONS—PASSING ONE DOES NOT GUARANTEE THE OTHERS')}
      ${checklistCard(65, '#2563eb', 'C', 'CONFIDENTIALITY', 'Who can read it?', 'Only authorized parties.', appear(local, 0.5))}
      ${checklistCard(465, '#d97706', 'I', 'INTEGRITY', 'Is it accurate and complete?', 'No improper change.', appear(local, 1.8))}
      ${checklistCard(865, '#16a34a', 'A', 'AVAILABILITY', 'Can authorized users get it?', 'Accessible when needed.', appear(local, 3.1))}
      <text x="640" y="650" text-anchor="middle" class="scene-caption">My short version: private to the right people, correct and unchanged, reachable when required.</text>
    </g>`;
}

function frameSvg(time) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      .title { fill: #0f172a; font-size: 32px; font-weight: 800; }
      .subtitle { fill: #475569; font-size: 16px; }
      .letter, .big-letter { fill: #ffffff; font-weight: 900; }
      .activity { font-size: 15px; font-weight: 850; }
      .person-name { fill: #0f172a; font-size: 18px; font-weight: 800; }
      .person-role, .support { fill: #64748b; font-size: 14px; }
      .card-kicker { fill: #2563eb; font-size: 13px; font-weight: 850; letter-spacing: 1px; }
      .card-label { fill: #64748b; font-size: 15px; }
      .card-value { fill: #0f172a; font-size: 18px; font-weight: 750; }
      .definition { fill: #0f172a; font-size: 21px; font-weight: 800; }
      .scene-caption { fill: #0f172a; font-size: 18px; font-weight: 780; }
      .status { font-size: 14px; font-weight: 850; }
      .mini-label, .attack-label { font-size: 13px; font-weight: 850; letter-spacing: 0.8px; }
      .attack-label { fill: #dc2626; }
      .tag { fill: #9a3412; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
      .server-label { fill: #f8fafc; font-size: 15px; font-weight: 800; }
      .server-state { font-size: 14px; font-weight: 850; }
      .letter { font-size: 24px; }
      .big-letter { font-size: 34px; }
      .card-title { fill: #0f172a; font-size: 18px; font-weight: 850; }
      .card-question { fill: #475569; font-size: 16px; }
      .failure { font-size: 15px; font-weight: 900; letter-spacing: 1px; }
      .check-question { fill: #475569; font-size: 15px; }
    </style>
    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="24" y="22" width="1232" height="676" rx="28" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    ${sceneRecord(time)}
    ${sceneConfidentiality(time)}
    ${sceneIntegrity(time)}
    ${sceneAvailability(time)}
    ${sceneCompare(time)}
    ${sceneChecklist(time)}
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

  await sharp(Buffer.from(frameSvg(70))).png({ compressionLevel: 9 }).toFile(posterPath);
  process.stdout.write(`Poster written to ${posterPath}\n`);
})();
