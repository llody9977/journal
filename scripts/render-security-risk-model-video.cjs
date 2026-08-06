#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const width = 1280;
const height = 720;
const fps = 24;
const sceneDuration = 14;
const sceneCount = 8;
const duration = sceneDuration * sceneCount;
const frameCount = fps * duration;
const framesDir = process.argv[2];
const posterPath = process.argv[3];

if (!framesDir || !posterPath) {
  console.error('Usage: render-security-risk-model-video.cjs <frames-dir> <poster-path>');
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
const appear = (time, at, span = 0.65) => progress(time, at, at + span);
const sceneOpacity = (time, index, feather = 0.7) => {
  const start = index * sceneDuration - feather;
  const end = (index + 1) * sceneDuration;
  return clamp((time - start) / feather) * clamp((end - time) / feather);
};

function header(label, summary, color = '#2563eb') {
  return `
    <text x="70" y="62" class="eyebrow">SECURITY RISK · ONE CLINIC SCENARIO</text>
    <text x="70" y="102" class="title">From something valuable to residual risk</text>
    <text x="70" y="133" class="subtitle">${summary}</text>
    <text x="70" y="180" class="section" fill="${color}">${label}</text>
    <line x1="70" y1="196" x2="1210" y2="196" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
}

function card(x, y, w, h, title, color, opacity = 1, fill = '#ffffff') {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${fill}" stroke="${color}" stroke-width="2.5"/>
      <rect x="${x}" y="${y}" width="${w}" height="48" rx="20" fill="${color}"/>
      <path d="M${x} ${y + 28} H${x + w} V${y + 48} H${x}Z" fill="${color}"/>
      <text x="${x + 22}" y="${y + 31}" class="card-title">${title}</text>
    </g>`;
}

function pill(x, y, w, label, color, tint, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="42" rx="21" fill="${tint}" stroke="${color}" stroke-width="2"/>
      <text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" class="pill" fill="${color}">${label}</text>
    </g>`;
}

function arrow(x1, y1, x2, y2, color, amount = 1, dashed = false) {
  const p = clamp(amount);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const ax = x - Math.cos(angle) * 15;
  const ay = y - Math.sin(angle) * 15;
  const px = Math.sin(angle) * 8;
  const py = -Math.cos(angle) * 8;
  return `
    <g opacity="${p}">
      <line x1="${x1}" y1="${y1}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="5" stroke-linecap="round" ${dashed ? 'stroke-dasharray="10 10"' : ''}/>
      <polygon points="${x},${y} ${ax + px},${ay + py} ${ax - px},${ay - py}" fill="${color}"/>
    </g>`;
}

function person(x, y, name, role, color, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <circle cx="${x}" cy="${y}" r="39" fill="${color}" opacity="0.14"/>
      <circle cx="${x}" cy="${y - 10}" r="13" fill="${color}"/>
      <path d="M${x - 24} ${y + 27} Q${x} ${y + 1} ${x + 24} ${y + 27}" fill="${color}"/>
      <text x="${x}" y="${y + 65}" text-anchor="middle" class="person-name">${name}</text>
      <text x="${x}" y="${y + 87}" text-anchor="middle" class="person-role">${role}</text>
    </g>`;
}

function appointment(x, y, opacity = 1, state = 'CONFIRMED') {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="360" height="190" rx="20" fill="#ffffff" stroke="#0f766e" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="360" height="48" rx="20" fill="#ccfbf1"/>
      <path d="M${x} ${y + 28} H${x + 360} V${y + 48} H${x}Z" fill="#ccfbf1"/>
      <text x="${x + 22}" y="${y + 31}" class="data-title" fill="#0f766e">CLINIC APPOINTMENT</text>
      <text x="${x + 24}" y="${y + 86}" class="field-label">Patient</text>
      <text x="${x + 150}" y="${y + 86}" class="field-value">Mei Tan</text>
      <text x="${x + 24}" y="${y + 126}" class="field-label">Time</text>
      <text x="${x + 150}" y="${y + 126}" class="field-value">7 Aug · 10:00</text>
      <text x="${x + 24}" y="${y + 166}" class="field-label">Status</text>
      <text x="${x + 150}" y="${y + 166}" class="field-value" fill="#15803d">${state}</text>
    </g>`;
}

function server(x, y, label, state, color, opacity = 1, w = 300) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="150" rx="22" fill="#0f172a" stroke="${color}" stroke-width="4"/>
      <text x="${x + 24}" y="${y + 40}" class="server-label">${label}</text>
      <rect x="${x + 24}" y="${y + 63}" width="${w - 48}" height="18" rx="9" fill="#334155"/>
      <rect x="${x + 24}" y="${y + 63}" width="${(w - 48) * (state === 'OVERLOADED' ? 1 : 0.32)}" height="18" rx="9" fill="${color}"/>
      <circle cx="${x + 30}" cy="${y + 112}" r="8" fill="${color}"/>
      <text x="${x + 50}" y="${y + 119}" class="server-state" fill="${color}">${state}</text>
    </g>`;
}

function bot(x, y, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x - 25}" y="${y - 22}" width="50" height="44" rx="10" fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>
      <circle cx="${x - 10}" cy="${y - 2}" r="5" fill="#dc2626"/>
      <circle cx="${x + 10}" cy="${y - 2}" r="5" fill="#dc2626"/>
      <path d="M${x - 12} ${y + 10} H${x + 12}" stroke="#dc2626" stroke-width="3"/>
      <path d="M${x} ${y - 22} V${y - 33}" stroke="#dc2626" stroke-width="3"/>
      <circle cx="${x}" cy="${y - 37}" r="4" fill="#dc2626"/>
    </g>`;
}

function check(x, y, color, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <circle cx="${x}" cy="${y}" r="18" fill="${color}"/>
      <path d="M${x - 8} ${y} L${x - 2} ${y + 7} L${x + 10} ${y - 8}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

function sceneAsset(time) {
  const local = time;
  return `
    <g opacity="${sceneOpacity(time, 0)}">
      ${header('START WITH THE ASSET', 'An asset is the person, information, service or trust that matters to me.', '#0f766e')}
      ${person(170, 375, 'Mei', 'needs her appointment', '#0f766e', appear(local, 0.5))}
      ${appointment(405, 275, appear(local, 1.4))}
      ${server(845, 295, 'BOOKING SERVICE', 'HEALTHY', '#22c55e', appear(local, 2.4))}
      ${arrow(230, 375, 395, 375, '#0f766e', progress(local, 3.0, 4.2))}
      ${arrow(765, 375, 835, 375, '#0f766e', progress(local, 4.0, 5.0))}
      ${pill(390, 520, 500, 'ASSET = SOMETHING I VALUE', '#0f766e', '#ccfbf1', appear(local, 5.4))}
      <text x="640" y="610" text-anchor="middle" class="caption">Here I value the appointment data, the booking service and the patient's ability to use them.</text>
      <text x="640" y="646" text-anchor="middle" class="note">I cannot assess security until I know what harm I am trying to prevent.</text>
    </g>`;
}

function sceneThreat(time) {
  const local = time - sceneDuration;
  return `
    <g opacity="${sceneOpacity(time, 1)}">
      ${header('A THREAT EVENT CAN CAUSE HARM', 'The event may be malicious, accidental or environmental. Here it is a denial-of-service attack.', '#dc2626')}
      ${bot(130, 305, appear(local, 0.5))}
      ${bot(130, 395, appear(local, 0.9))}
      ${bot(230, 350, appear(local, 1.3))}
      ${bot(230, 440, appear(local, 1.7))}
      ${arrow(285, 340, 760, 350, '#dc2626', progress(local, 2.0, 4.2))}
      ${arrow(285, 400, 760, 390, '#dc2626', progress(local, 2.5, 4.7))}
      ${server(790, 300, 'BOOKING SERVICE', 'HEALTHY', '#22c55e', appear(local, 1.0), 390)}
      ${pill(350, 245, 310, '12,000 REQUESTS / SECOND', '#dc2626', '#fee2e2', appear(local, 3.1))}
      ${pill(430, 520, 420, 'THREAT EVENT = DoS TRAFFIC', '#dc2626', '#fee2e2', appear(local, 5.2))}
      <text x="640" y="610" text-anchor="middle" class="caption">The threat is the harmful event—not the server weakness and not the resulting outage.</text>
    </g>`;
}

function sceneVulnerability(time) {
  const local = time - sceneDuration * 2;
  return `
    <g opacity="${sceneOpacity(time, 2)}">
      ${header('THE THREAT REACHES A VULNERABILITY', 'A vulnerability is the weakness that makes the harmful outcome possible or easier.', '#d97706')}
      ${server(95, 295, 'ONLY SERVER', 'OVERLOADED', '#ef4444', appear(local, 0.5), 360)}
      <text x="275" y="478" text-anchor="middle" class="body-strong">capacity: 500 requests / second</text>
      ${arrow(485, 372, 690, 372, '#dc2626', progress(local, 1.8, 3.5))}
      <g opacity="${appear(local, 2.5)}">
        <path d="M610 315 L660 335 V385 Q660 430 610 450 Q560 430 560 385 V335Z" fill="#fff7ed" stroke="#d97706" stroke-width="4"/>
        <path d="M585 385 L635 345 M588 346 L632 386" stroke="#d97706" stroke-width="6" stroke-linecap="round"/>
      </g>
      ${card(735, 260, 470, 300, 'REACHABLE WEAKNESS', '#d97706', appear(local, 3.7), '#fffbeb')}
      <text x="775" y="345" class="body-strong">One undersized server</text>
      <text x="775" y="390" class="body">No rate limit</text>
      <text x="775" y="435" class="body">No extra capacity</text>
      <text x="775" y="480" class="body">No failover path</text>
      ${pill(780, 500, 380, 'VULNERABILITY = WEAKNESS', '#b45309', '#fef3c7', appear(local, 5.5))}
      <text x="640" y="628" text-anchor="middle" class="caption">A weakness alone is not the full risk. I still need a relevant threat and a meaningful consequence.</text>
    </g>`;
}

function sceneImpact(time) {
  const local = time - sceneDuration * 3;
  return `
    <g opacity="${sceneOpacity(time, 3)}">
      ${header('IMPACT IS THE HARM THAT FOLLOWS', 'Technical failure matters because it affects people, operations, money, safety or trust.', '#7c3aed')}
      ${server(70, 290, 'BOOKING SERVICE', 'UNAVAILABLE', '#ef4444', appear(local, 0.5), 330)}
      ${arrow(415, 365, 580, 365, '#dc2626', progress(local, 1.2, 2.6), true)}
      <g opacity="${appear(local, 2.0)}">
        <circle cx="530" cy="365" r="26" fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>
        <path d="M518 353 L542 377 M542 353 L518 377" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>
      </g>
      ${person(690, 345, 'Mei', 'cannot retrieve booking', '#7c3aed', appear(local, 2.8))}
      ${person(915, 345, 'Reception', 'cannot create bookings', '#7c3aed', appear(local, 3.6))}
      ${card(1040, 275, 175, 235, 'HARM', '#7c3aed', appear(local, 4.4), '#faf5ff')}
      <text x="1065" y="350" class="small-body">missed care</text>
      <text x="1065" y="390" class="small-body">delays</text>
      <text x="1065" y="430" class="small-body">manual work</text>
      <text x="1065" y="470" class="small-body">lost trust</text>
      ${pill(420, 535, 440, 'IMPACT = RESULTING HARM', '#7c3aed', '#f3e8ff', appear(local, 5.7))}
      <text x="640" y="628" text-anchor="middle" class="caption">“The server is down” describes the event. Impact explains why that event matters.</text>
    </g>`;
}

function sceneRisk(time) {
  const local = time - sceneDuration * 4;
  return `
    <g opacity="${sceneOpacity(time, 4)}">
      ${header('RISK IS MY ASSESSMENT OF THE WHOLE SCENARIO', 'I consider how likely the harmful event is and how serious its impact would be.', '#2563eb')}
      ${card(70, 260, 330, 270, 'LIKELIHOOD', '#2563eb', appear(local, 0.5), '#eff6ff')}
      <text x="105" y="345" class="body-strong">Can the threat reach it?</text>
      <text x="105" y="390" class="body">Public service</text>
      <text x="105" y="430" class="body">Known capacity gap</text>
      ${pill(115, 465, 240, 'PLAUSIBLE', '#1d4ed8', '#dbeafe', appear(local, 2.1))}
      ${card(475, 260, 330, 270, 'IMPACT', '#7c3aed', appear(local, 1.2), '#faf5ff')}
      <text x="510" y="345" class="body-strong">What harm would follow?</text>
      <text x="510" y="390" class="body">Patients lose access</text>
      <text x="510" y="430" class="body">Clinic operations stop</text>
      ${pill(520, 465, 240, 'SERIOUS', '#7c3aed', '#f3e8ff', appear(local, 2.8))}
      ${arrow(820, 395, 920, 395, '#2563eb', progress(local, 3.4, 4.7))}
      ${card(940, 260, 270, 270, 'INITIAL RISK', '#dc2626', appear(local, 4.5), '#fef2f2')}
      <text x="1075" y="370" text-anchor="middle" class="risk-high">HIGH</text>
      <text x="1075" y="415" text-anchor="middle" class="small-body">illustrative rating</text>
      ${pill(405, 565, 470, 'LIKELIHOOD + IMPACT INFORM RISK', '#2563eb', '#dbeafe', appear(local, 6.0))}
      <text x="640" y="646" text-anchor="middle" class="note">This is a judgment supported by evidence—not a universal multiplication formula.</text>
    </g>`;
}

function controlRow(y, color, title, effect, opacity) {
  return `
    <g opacity="${opacity}">
      ${check(105, y, color)}
      <text x="140" y="${y + 6}" class="control-title">${title}</text>
      <text x="445" y="${y + 6}" class="control-effect">${effect}</text>
    </g>`;
}

function sceneControls(time) {
  const local = time - sceneDuration * 5;
  return `
    <g opacity="${sceneOpacity(time, 5)}">
      ${header('CONTROLS CHANGE THE RISK', 'One barrier is rarely enough. I prevent, detect, respond and recover.', '#16a34a')}
      ${card(65, 245, 770, 345, 'DEFENSE IN DEPTH', '#16a34a')}
      ${controlRow(330, '#16a34a', 'Rate limiting', 'filters abusive request bursts', appear(local, 0.6))}
      ${controlRow(390, '#16a34a', 'Extra capacity', 'raises the outage threshold', appear(local, 1.6))}
      ${controlRow(450, '#d97706', 'Monitoring + response', 'shortens time to detect and contain', appear(local, 2.6))}
      ${controlRow(510, '#2563eb', 'Failover', 'keeps service available during failure', appear(local, 3.6))}
      ${server(900, 265, 'PRIMARY', 'HEALTHY', '#22c55e', appear(local, 1.2), 300)}
      ${server(900, 455, 'STANDBY', 'READY', '#60a5fa', appear(local, 3.8), 300)}
      ${arrow(1050, 425, 1050, 445, '#2563eb', progress(local, 4.4, 5.3), true)}
      ${pill(850, 625, 380, 'CONTROL ≠ ZERO RISK', '#15803d', '#dcfce7', appear(local, 5.6))}
      <text x="420" y="645" text-anchor="middle" class="caption">Controls can reduce the chance of harm, limit its severity or help me recover faster.</text>
    </g>`;
}

function sceneResidual(time) {
  const local = time - sceneDuration * 6;
  return `
    <g opacity="${sceneOpacity(time, 6)}">
      ${header('THE SAME THREAT NOW HAS A DIFFERENT OUTCOME', 'Controls lower risk, but I still record what remains and decide whether it is acceptable.', '#0f766e')}
      ${bot(105, 345, appear(local, 0.4))}
      ${bot(105, 425, appear(local, 0.8))}
      ${arrow(150, 385, 360, 385, '#dc2626', progress(local, 1.1, 2.5))}
      ${pill(205, 300, 180, 'RATE LIMITED', '#15803d', '#dcfce7', appear(local, 2.0))}
      ${server(400, 260, 'PRIMARY', 'OVERLOADED', '#ef4444', appear(local, 1.4), 310)}
      ${arrow(555, 420, 555, 445, '#2563eb', progress(local, 3.0, 4.1), true)}
      ${server(400, 455, 'STANDBY', 'HEALTHY', '#22c55e', appear(local, 3.8), 310)}
      ${arrow(725, 525, 850, 485, '#16a34a', progress(local, 4.6, 5.7))}
      ${person(930, 435, 'Mei', 'booking still available', '#0f766e', appear(local, 5.4))}
      ${card(1030, 250, 190, 260, 'RESIDUAL', '#0f766e', appear(local, 6.2), '#f0fdfa')}
      <text x="1125" y="355" text-anchor="middle" class="risk-medium">LOWER</text>
      <text x="1125" y="395" text-anchor="middle" class="small-body">not zero</text>
      <text x="1055" y="455" class="tiny-body">attack may exceed</text>
      <text x="1055" y="480" class="tiny-body">designed capacity</text>
      <text x="640" y="650" text-anchor="middle" class="caption">Residual risk is what remains after controls—not proof that the system cannot fail.</text>
    </g>`;
}

function recapNode(x, y, w, title, question, color, tint, opacity = 1) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="92" rx="18" fill="${tint}" stroke="${color}" stroke-width="2.5"/>
      <text x="${x + w / 2}" y="${y + 35}" text-anchor="middle" class="recap-title" fill="${color}">${title}</text>
      <text x="${x + w / 2}" y="${y + 65}" text-anchor="middle" class="recap-question">${question}</text>
    </g>`;
}

function sceneRecap(time) {
  const local = time - sceneDuration * 7;
  return `
    <g opacity="${sceneOpacity(time, 7)}">
      ${header('MY RECALL MODEL', 'I follow one harmful scenario, then compare risk before and after controls.', '#0f766e')}
      ${recapNode(55, 255, 210, 'THREAT', 'What could happen?', '#dc2626', '#fee2e2', appear(local, 0.4))}
      ${arrow(275, 301, 325, 301, '#64748b', progress(local, 0.9, 1.6))}
      ${recapNode(335, 255, 210, 'VULNERABILITY', 'What weakness?', '#d97706', '#fef3c7', appear(local, 1.3))}
      ${arrow(555, 301, 605, 301, '#64748b', progress(local, 1.8, 2.5))}
      ${recapNode(615, 255, 210, 'IMPACT', 'What harm follows?', '#7c3aed', '#f3e8ff', appear(local, 2.2))}
      ${arrow(835, 301, 875, 301, '#64748b', progress(local, 2.7, 3.4))}
      ${recapNode(885, 255, 340, 'ASSET', 'What valuable thing is harmed?', '#0f766e', '#ccfbf1', appear(local, 3.1))}
      <path d="M85 375 V390 H1195 V375" fill="none" stroke="#94a3b8" stroke-width="3" opacity="${appear(local, 3.8)}"/>
      <text x="640" y="420" text-anchor="middle" class="note" opacity="${appear(local, 4.0)}">ASSESS THE WHOLE SCENARIO</text>
      ${recapNode(80, 455, 300, 'RISK ASSESSMENT', 'Likelihood + impact', '#2563eb', '#dbeafe', appear(local, 4.5))}
      ${arrow(390, 501, 470, 501, '#16a34a', progress(local, 5.0, 5.7))}
      ${recapNode(480, 455, 300, 'CONTROLS', 'Change the scenario', '#16a34a', '#dcfce7', appear(local, 5.4))}
      ${arrow(790, 501, 870, 501, '#0f766e', progress(local, 6.0, 6.7))}
      ${recapNode(880, 455, 300, 'RESIDUAL RISK', 'Reassess what remains', '#0f766e', '#ccfbf1', appear(local, 6.4))}
      <text x="640" y="610" text-anchor="middle" class="caption">Threat reaches vulnerability → impact harms asset → I assess risk across the whole scenario.</text>
      <text x="640" y="648" text-anchor="middle" class="note">My final question: after the controls, is the remaining risk acceptable to the right owner?</text>
    </g>`;
}

function frameSvg(time) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="24" y="22" width="1232" height="676" rx="28" fill="#ffffff" stroke="#dbe3ef" stroke-width="2"/>
    <style>
      text { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }
      .eyebrow { font-size: 14px; font-weight: 800; letter-spacing: 3px; fill: #2563eb; }
      .title { font-size: 32px; font-weight: 800; }
      .subtitle { font-size: 16px; fill: #475569; }
      .section { font-size: 16px; font-weight: 800; letter-spacing: 0.3px; }
      .card-title { font-size: 14px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      .pill { font-size: 14px; font-weight: 800; letter-spacing: 0.35px; }
      .person-name { font-size: 17px; font-weight: 800; }
      .person-role { font-size: 13px; fill: #64748b; }
      .data-title { font-size: 14px; font-weight: 800; letter-spacing: 0.4px; }
      .field-label { font-size: 15px; fill: #64748b; }
      .field-value { font-size: 16px; font-weight: 700; }
      .server-label { font-size: 16px; font-weight: 800; fill: #f8fafc; }
      .server-state { font-size: 14px; font-weight: 800; }
      .body { font-size: 18px; fill: #334155; }
      .body-strong { font-size: 18px; font-weight: 800; }
      .small-body { font-size: 15px; fill: #475569; }
      .tiny-body { font-size: 13px; fill: #475569; }
      .caption { font-size: 18px; font-weight: 700; }
      .note { font-size: 15px; fill: #64748b; }
      .risk-high { font-size: 44px; font-weight: 900; fill: #dc2626; }
      .risk-medium { font-size: 32px; font-weight: 900; fill: #0f766e; }
      .control-title { font-size: 17px; font-weight: 800; }
      .control-effect { font-size: 16px; fill: #475569; }
      .recap-title { font-size: 16px; font-weight: 900; letter-spacing: 0.4px; }
      .recap-question { font-size: 14px; fill: #334155; }
    </style>
    ${sceneAsset(time)}
    ${sceneThreat(time)}
    ${sceneVulnerability(time)}
    ${sceneImpact(time)}
    ${sceneRisk(time)}
    ${sceneControls(time)}
    ${sceneResidual(time)}
    ${sceneRecap(time)}
  </svg>`;
}

async function writeFrame(index, time) {
  const filename = `frame-${String(index + 1).padStart(6, '0')}.png`;
  await sharp(Buffer.from(frameSvg(time))).png().toFile(path.join(framesDir, filename));
}

async function main() {
  const previewTime = Number.parseFloat(process.env.PREVIEW_TIME || '');
  if (Number.isFinite(previewTime)) {
    await writeFrame(0, clamp(previewTime, 0, duration - 1 / fps));
    await sharp(Buffer.from(frameSvg(clamp(previewTime, 0, duration - 1 / fps)))).png().toFile(posterPath);
    console.log(`Preview written at ${previewTime}s`);
    return;
  }

  const batchSize = 8;
  for (let start = 0; start < frameCount; start += batchSize) {
    const tasks = [];
    for (let index = start; index < Math.min(start + batchSize, frameCount); index += 1) {
      tasks.push(writeFrame(index, index / fps));
    }
    await Promise.all(tasks);
    if (start % (batchSize * 30) === 0) console.log(`Rendered ${Math.min(start + batchSize, frameCount)}/${frameCount} frames`);
  }

  const posterTime = sceneDuration * 7 + 8;
  await sharp(Buffer.from(frameSvg(posterTime))).png().toFile(posterPath);
  console.log(`Poster written to ${posterPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
