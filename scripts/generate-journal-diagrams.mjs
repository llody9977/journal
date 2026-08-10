import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.resolve("assets/img");

const colors = {
  ink: "#0f172a",
  muted: "#475569",
  line: "#94a3b8",
  rule: "#cbd5e1",
  panel: "#f8fafc",
  blue: "#2563eb",
  blueFill: "#eff6ff",
  teal: "#0f766e",
  tealFill: "#f0fdfa",
  amber: "#b45309",
  amberFill: "#fffbeb",
  red: "#b91c1c",
  redFill: "#fef2f2",
  violet: "#7c3aed",
  violetFill: "#faf5ff",
  green: "#15803d",
  greenFill: "#f0fdf4",
};

const accents = [
  [colors.blue, colors.blueFill],
  [colors.teal, colors.tealFill],
  [colors.amber, colors.amberFill],
  [colors.violet, colors.violetFill],
  [colors.green, colors.greenFill],
  [colors.red, colors.redFill],
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lines(x, y, values, options = {}) {
  const {
    size = 16,
    lineHeight = 24,
    fill = colors.muted,
    weight = 500,
    anchor = "start",
  } = options;
  return values
    .map(
      (value, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`,
    )
    .join("\n");
}

function card(x, y, width, height, item, index = 0) {
  const [accent, fill] = item.colors ?? accents[index % accents.length];
  const titleY = y + (item.eyebrow ? 65 : 50);
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="${fill}" stroke="${accent}" stroke-width="3"/>
      ${item.eyebrow ? `<text x="${x + 25}" y="${y + 31}" font-size="12" font-weight="900" letter-spacing="1" fill="${accent}">${escapeXml(item.eyebrow.toUpperCase())}</text>` : ""}
      ${lines(x + 25, titleY, item.titleLines ?? [item.title], { size: item.titleSize ?? 20, lineHeight: 25, fill: colors.ink, weight: 800 })}
      ${lines(x + 25, titleY + (item.titleLines?.length ?? 1) * 27 + 13, item.lines ?? [], { size: item.bodySize ?? 14.5, lineHeight: item.lineHeight ?? 23, fill: colors.muted, weight: 500 })}
    </g>`;
}

function arrow(x1, y1, x2, y2, label = "", options = {}) {
  const marker = "url(#arrow)";
  const middleX = (x1 + x2) / 2;
  const middleY = (y1 + y2) / 2;
  const labelWidth = Math.min(280, Math.max(124, label.length * 7.2));
  return `
    <path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${options.color ?? colors.line}" stroke-width="4" stroke-linecap="round" marker-end="${marker}"/>
    ${label ? `<rect x="${middleX - labelWidth / 2}" y="${middleY - 32}" width="${labelWidth}" height="24" rx="12" fill="#ffffff"/><text x="${middleX}" y="${middleY - 15}" text-anchor="middle" font-size="11" font-weight="900" letter-spacing=".5" fill="${colors.muted}">${escapeXml(label.toUpperCase())}</text>` : ""}`;
}

function documentSvg(title, subtitle, height, body) {
  const maxCharsPerLine = 85;
  let subtitleMarkup = '';
  if (subtitle.length > maxCharsPerLine) {
    const words = subtitle.split(' ');
    let line1 = '', line2 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).length <= maxCharsPerLine) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    }
    subtitleMarkup = `<text x="50" y="82" font-size="14.5" fill="${colors.muted}">${escapeXml(line1)}</text>
  <text x="50" y="102" font-size="14.5" fill="${colors.muted}">${escapeXml(line2)}</text>`;
  } else {
    subtitleMarkup = `<text x="50" y="88" font-size="15" fill="${colors.muted}">${escapeXml(subtitle)}</text>`;
  }

  return `<svg viewBox="0 0 1200 ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(subtitle)}</desc>
  <rect width="1200" height="${height}" fill="#ffffff"/>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="${colors.line}"/></marker>
    <marker id="arrow-reverse" viewBox="0 0 10 10" refX="1.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M10 0 L0 5 L10 10Z" fill="${colors.line}"/></marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="${colors.blue}"/></marker>
    <marker id="arrow-teal" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="${colors.teal}"/></marker>
    <marker id="arrow-amber" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="${colors.amber}"/></marker>
    <marker id="arrow-violet" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="${colors.violet}"/></marker>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="${colors.red}"/></marker>
  </defs>
  <text x="50" y="55" font-size="30" font-weight="850" fill="${colors.ink}">${escapeXml(title)}</text>
  ${subtitleMarkup}
  ${body}
</svg>\n`;
}

function horizontalFlow({ title, subtitle, items, labels = [], filename, cardHeight = 215 }) {
  const margin = 50;
  const gap = 55;
  const width = (1200 - margin * 2 - gap * (items.length - 1)) / items.length;
  const y = 135;
  let body = items.map((item, index) => card(margin + index * (width + gap), y, width, cardHeight, item, index)).join("\n");
  for (let index = 0; index < items.length - 1; index += 1) {
    const x1 = margin + index * (width + gap) + width;
    body += arrow(x1 + 8, y + cardHeight / 2, x1 + gap - 8, y + cardHeight / 2);
    if (labels[index]) {
      body += lines(x1 + gap / 2, y - 10, [labels[index].toUpperCase()], { size: 10.5, fill: colors.muted, weight: 800, anchor: "middle" });
    }
  }
  write(filename, documentSvg(title, subtitle, y + cardHeight + 45, body));
}

function verticalFlow({ title, subtitle, items, labels = [], filename, cardHeight = 115 }) {
  const y = 130;
  const gap = 44;
  const width = 1040;
  const x = 80;
  let body = items.map((item, index) => card(x, y + index * (cardHeight + gap), width, cardHeight, item, index)).join("\n");
  for (let index = 0; index < items.length - 1; index += 1) {
    const y1 = y + index * (cardHeight + gap) + cardHeight;
    body += arrow(600, y1 + 7, 600, y1 + gap - 7, labels[index] ?? "");
  }
  const height = y + items.length * cardHeight + (items.length - 1) * gap + 45;
  write(filename, documentSvg(title, subtitle, height, body));
}

function comparison({ title, subtitle, items, filename, footer = "" }) {
  const gap = 30;
  const width = (1100 - gap * (items.length - 1)) / items.length;
  const y = 135;
  const cardHeight = 275;
  let body = items.map((item, index) => card(50 + index * (width + gap), y, width, cardHeight, item, index)).join("\n");
  if (footer) {
    body += `<rect x="50" y="430" width="1100" height="55" rx="22" fill="${colors.panel}" stroke="${colors.rule}" stroke-width="2"/>${lines(600, 464, [footer], { size: 15, fill: colors.ink, weight: 700, anchor: "middle" })}`;
  }
  write(filename, documentSvg(title, subtitle, footer ? 520 : 455, body));
}

function sequence({ title, subtitle, participants, messages, filename, note = "" }) {
  const left = 135;
  const right = 1065;
  const xs = participants.map((_, index) => left + (index * (right - left)) / (participants.length - 1));
  const startY = 160;
  const rowHeight = 70;
  const height = startY + messages.length * rowHeight + (note ? 105 : 45);
  let body = participants
    .map((participant, index) => {
      const x = xs[index];
      return `<rect x="${x - 125}" y="120" width="250" height="60" rx="18" fill="${accents[index][1]}" stroke="${accents[index][0]}" stroke-width="3"/>${lines(x, 156, [participant], { size: 17, fill: colors.ink, weight: 800, anchor: "middle" })}<path d="M${x} 180 V${height - (note ? 95 : 35)}" stroke="${colors.rule}" stroke-width="3" stroke-dasharray="8 8"/>`;
    })
    .join("\n");
  messages.forEach((message, index) => {
    const y = 220 + index * rowHeight;
    const from = xs[message.from];
    const to = xs[message.to];
    if (from === to) {
      const boxX = message.from === 0 ? from + 35 : from - 355;
      const accent = accents[message.from % accents.length][0];
      const fill = accents[message.from % accents.length][1];
      body += `<rect x="${boxX}" y="${y - 28}" width="320" height="56" rx="16" fill="${fill}" stroke="${accent}" stroke-width="2"/>`;
      body += lines(boxX + 18, y - 6, [`${index + 1}. ${message.label.toUpperCase()}`], { size: 12, fill: colors.ink, weight: 800 });
      if (message.detail) body += lines(boxX + 18, y + 15, [message.detail], { size: 12, fill: colors.muted, weight: 500 });
    } else {
      body += arrow(from, y, to, y, `${index + 1}. ${message.label}`);
      if (message.detail) body += lines((from + to) / 2, y + 24, [message.detail], { size: 12.5, fill: colors.muted, weight: 500, anchor: "middle" });
    }
  });
  if (note) body += `<rect x="90" y="${height - 80}" width="1020" height="46" rx="20" fill="${colors.panel}" stroke="${colors.rule}" stroke-width="2"/>${lines(600, height - 51, [note], { size: 14, fill: colors.ink, weight: 700, anchor: "middle" })}`;
  write(filename, documentSvg(title, subtitle, height, body));
}

function rows({ title, subtitle, items, filename }) {
  const y = 130;
  const rowHeight = 115;
  let body = "";
  items.forEach((item, index) => {
    const rowY = y + index * (rowHeight + 18);
    const [accent, fill] = item.colors ?? accents[index % accents.length];
    body += `<rect x="55" y="${rowY}" width="1090" height="${rowHeight}" rx="18" fill="${fill}" stroke="${accent}" stroke-width="2.5"/>`;
    body += lines(85, rowY + 42, item.titleLines ?? [item.title], { size: 18, fill: colors.ink, weight: 800 });
    body += lines(400, rowY + 37, item.lines, { size: 14.5, lineHeight: 23, fill: colors.muted, weight: 500 });
  });
  write(filename, documentSvg(title, subtitle, y + items.length * (rowHeight + 18) + 25, body));
}

function write(filename, contents) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, filename), contents);
}

comparison({
  filename: "sender-constrained-tokens.svg",
  title: "Binding an access token to its sender",
  subtitle: "A stolen token is insufficient unless the caller also proves possession of the bound key.",
  items: [
    { eyebrow: "RFC 8705", title: "mTLS-bound token", lines: ["Token contains the client", "certificate thumbprint.", "", "API validates the certificate", "used on the TLS connection."], colors: accents[0] },
    { eyebrow: "RFC 9449", title: "DPoP-bound token", lines: ["Client signs a proof JWT", "for each HTTP request.", "", "API matches the proof key", "to the token's confirmation claim."], colors: accents[1] },
  ],
  footer: "Replay from another client fails because the attacker does not possess the bound private key.",
});

verticalFlow({
  filename: "blockchain-cryptography-layers.svg",
  title: "Cryptographic layers in a blockchain",
  subtitle: "Each primitive solves a different problem; none of them creates trust on its own.",
  items: [
    { eyebrow: "1 · tamper evidence", title: "Hash-linked blocks", lines: ["Each block commits to the previous block hash, so changing history breaks every later link."] },
    { eyebrow: "2 · efficient inclusion", title: "Merkle tree", lines: ["A root digest commits to many transactions and supports logarithmic-size inclusion proofs."] },
    { eyebrow: "3 · authorization", title: "Digital signatures", lines: ["Owners authorize transactions with private keys; nodes verify them with public keys."] },
  ],
  labels: ["commits transactions", "authorizes changes"],
});

horizontalFlow({
  filename: "certificate-lifetime-timeline.svg",
  title: "Public TLS certificate lifetime reduction",
  subtitle: "Shorter lifetimes reduce the exposure window of a compromised or misissued certificate.",
  items: [
    { eyebrow: "before 2020", title: "825 days", lines: ["former maximum"] },
    { eyebrow: "September 2020", title: "398 days", lines: ["industry maximum"] },
    { eyebrow: "March 2026", title: "200 days", lines: ["current phase"] },
    { eyebrow: "March 2027", title: "100 days", lines: ["next phase"] },
    { eyebrow: "March 2029", title: "47 days", lines: ["planned final phase"] },
  ],
  labels: ["reduced", "reduced", "reduced", "reduces again"],
  cardHeight: 175,
});

comparison({
  filename: "full-disk-encryption-scope.svg",
  title: "What full-disk encryption protects",
  subtitle: "FDE protects data at rest while the volume is locked; it is not an application or network control.",
  items: [
    { eyebrow: "in scope", title: "Locked storage", lines: ["lost or stolen device", "decommissioned drive", "offline disk inspection", "unauthorized physical access"], colors: accents[1] },
    { eyebrow: "out of scope", title: "Unlocked runtime", lines: ["malware in a live session", "unauthorized application access", "network eavesdropping", "compromised user account"], colors: accents[5] },
  ],
  footer: "Once the OS unlocks the volume, applications and authorized processes can read the plaintext.",
});

verticalFlow({
  filename: "grc-framework-stack.svg",
  title: "How security frameworks fit together",
  subtitle: "Start with strategy, select controls, add domain requirements, then collect assurance evidence.",
  items: [
    { eyebrow: "layer 1", title: "Governance and strategic vocabulary", lines: ["NIST CSF describes outcomes such as Govern, Identify, Protect, Detect, Respond, and Recover."] },
    { eyebrow: "layer 2", title: "Control catalogs and baselines", lines: ["CIS Controls and NIST SP 800-53 translate outcomes into safeguards and control requirements."] },
    { eyebrow: "layer 3", title: "Domain-specific standards", lines: ["OWASP ASVS, PCI DSS, and NIST SP 800-63 add requirements for a particular system or risk."] },
    { eyebrow: "layer 4", title: "Assurance and attestation", lines: ["ISO/IEC 27001 certification and SOC 2 reports provide evidence about the operating program."] },
  ],
  labels: ["map outcomes", "add context", "collect evidence"],
});

horizontalFlow({
  filename: "security-program-roadmap.svg",
  title: "A practical security program roadmap",
  subtitle: "The sequence moves from essential hygiene to repeatable governance and external assurance.",
  items: [
    { eyebrow: "stage 1", title: "Technical hygiene", lines: ["CIS IG1"] },
    { eyebrow: "stage 2", title: "Strategic vocabulary", lines: ["NIST CSF"] },
    { eyebrow: "stage 3", title: "Product security", lines: ["OWASP ASVS"] },
    { eyebrow: "stage 4", title: "Customer assurance", lines: ["SOC 2"] },
    { eyebrow: "stage 5", title: "Management system", lines: ["ISO 27001"] },
  ],
  cardHeight: 190,
});

horizontalFlow({
  filename: "hash-security-properties.svg",
  title: "Three security properties of a cryptographic hash",
  subtitle: "Each property describes a different search problem for an attacker.",
  items: [
    { eyebrow: "given a digest", titleLines: ["Preimage", "resistance"], lines: ["Hard to recover any", "input that matches it."] },
    { eyebrow: "given one input", titleLines: ["Second-preimage", "resistance"], lines: ["Hard to find another", "input with its digest."] },
    { eyebrow: "choose both inputs", titleLines: ["Collision", "resistance"], lines: ["Hard to find any two", "inputs with one digest."] },
  ],
  cardHeight: 225,
});

sequence({
  filename: "http-authentication-challenge.svg",
  title: "HTTP authentication challenge and response",
  subtitle: "The server advertises an authentication scheme before the client retries with credentials.",
  participants: ["Client", "Resource server"],
  messages: [
    { from: 0, to: 1, label: "request", detail: "No credentials" },
    { from: 1, to: 0, label: "401 challenge", detail: "WWW-Authenticate: Bearer" },
    { from: 0, to: 1, label: "retry", detail: "Authorization: Bearer <token>" },
    { from: 1, to: 0, label: "200 response", detail: "Credentials accepted" },
  ],
  note: "Authentication establishes who or what is calling; authorization still decides what the caller may access.",
});

sequence({
  filename: "mcp-oauth-discovery.svg",
  title: "MCP resource server authorization discovery",
  subtitle: "Protected Resource Metadata tells the MCP client which authorization server can issue a suitable token.",
  participants: ["MCP client", "MCP resource server", "Authorization server"],
  messages: [
    { from: 0, to: 1, label: "unauthenticated call" },
    { from: 1, to: 0, label: "401 + metadata", detail: "Protected Resource Metadata URL" },
    { from: 0, to: 2, label: "discover + authorize", detail: "Resolve authorization server metadata" },
    { from: 2, to: 0, label: "issue token", detail: "Audience is the MCP resource" },
    { from: 0, to: 1, label: "authorized call", detail: "Bearer access token" },
  ],
});

horizontalFlow({
  filename: "hkdf-extract-expand.svg",
  title: "HKDF: extract once, expand by purpose",
  subtitle: "HKDF converts input key material into independent, context-bound protocol keys.",
  items: [
    { eyebrow: "input", title: "Secret + salt", lines: ["possibly biased", "key material"] },
    { eyebrow: "extract", title: "HKDF-Extract", lines: ["creates a strong", "pseudorandom key"] },
    { eyebrow: "expand", title: "HKDF-Expand", lines: ["uses an info label", "for domain separation"] },
    { eyebrow: "output", title: "Purpose keys", lines: ["encryption key", "MAC key · IV"] },
  ],
  labels: ["normalize", "PRK", "derive"],
  cardHeight: 205,
});

comparison({
  filename: "quantum-algorithm-impact.svg",
  title: "Quantum impact on current cryptography",
  subtitle: "Shor and Grover affect different cryptographic assumptions.",
  items: [
    { eyebrow: "Shor's algorithm", title: "Breaks public-key math", lines: ["RSA factoring", "elliptic-curve discrete logs", "ECDH and ECDSA", "Ed25519 signatures"], colors: accents[5] },
    { eyebrow: "Grover's algorithm", title: "Reduces brute-force margin", lines: ["quadratic search speedup", "roughly halves key bits", "AES-256 retains about", "128-bit security margin"], colors: accents[2] },
  ],
  footer: "Post-quantum migration replaces vulnerable public-key algorithms; strong symmetric key sizes remain useful.",
});

rows({
  filename: "risk-scenario-breakdown.svg",
  title: "One risk scenario, six connected parts",
  subtitle: "A useful risk statement links what matters, what may happen, why it can happen, and what changes it.",
  items: [
    { title: "Asset", lines: ["Treasury funds and supplier payout data"] },
    { title: "Threat source", lines: ["A phishing attacker targets a finance manager"] },
    { title: "Threat event", lines: ["The attacker changes supplier routing details"] },
    { title: "Vulnerability", lines: ["Single-factor login and one-person payment approval"] },
    { title: "Impact", lines: ["Financial loss and delayed supplier operations"] },
    { title: "Controls", lines: ["Phishing-resistant MFA, dual approval, and audit logging"] },
  ],
});

sequence({
  filename: "saml-sp-initiated-flow.svg",
  title: "SAML service-provider-initiated sign-in",
  subtitle: "The browser carries messages between the service provider and identity provider.",
  participants: ["User browser", "Service provider", "Identity provider"],
  messages: [
    { from: 0, to: 1, label: "request service" },
    { from: 1, to: 0, label: "redirect", detail: "SAMLRequest" },
    { from: 0, to: 2, label: "authenticate", detail: "User proves identity" },
    { from: 2, to: 0, label: "form response", detail: "Signed SAMLResponse" },
    { from: 0, to: 1, label: "post assertion", detail: "Service validates signature and conditions" },
  ],
});

verticalFlow({
  filename: "common-criteria-eal.svg",
  title: "Common Criteria evaluation assurance levels",
  subtitle: "Higher EALs require progressively more rigorous design evidence and independent evaluation.",
  items: [
    { eyebrow: "EAL 1", title: "Functionally tested", lines: ["Basic independent testing of available product information."] },
    { eyebrow: "EAL 2", title: "Structurally tested", lines: ["Adds developer evidence and structural analysis."] },
    { eyebrow: "EAL 3", title: "Methodically tested and checked", lines: ["Adds systematic development and testing evidence."] },
    { eyebrow: "EAL 4", title: "Methodically designed, tested, and reviewed", lines: ["Common upper target for conventional commercial products."] },
    { eyebrow: "EAL 5", title: "Semiformally designed and tested", lines: ["Adds semiformal design descriptions and stronger analysis."] },
    { eyebrow: "EAL 6", title: "Semiformally verified design and tested", lines: ["Targets high-value assets with specialized engineering."] },
    { eyebrow: "EAL 7", title: "Formally verified design and tested", lines: ["Maximum rigor for narrowly scoped, extremely high-risk systems."] },
  ],
  labels: ["more rigor", "more rigor", "more rigor", "more rigor", "more rigor", "more rigor"],
  cardHeight: 130,
});

verticalFlow({
  filename: "defense-in-depth-layers.svg",
  title: "Defense in depth across one payment path",
  subtitle: "Each layer limits a different failure so one bypass does not immediately become a fraudulent transfer.",
  items: [
    { eyebrow: "layer 1", title: "Phishing-resistant MFA", lines: ["Blocks password-only account takeover."] },
    { eyebrow: "layer 2", title: "Sender-constrained short-lived session", lines: ["Limits the replay value of a stolen token."] },
    { eyebrow: "layer 3", title: "Least-privilege authorization", lines: ["Restricts which tenant and actions the identity can reach."] },
    { eyebrow: "layer 4", title: "Dual approval", lines: ["Requires an independent approver for high-risk payments."] },
    { eyebrow: "layer 5", title: "Anomaly detection and response", lines: ["Detects unusual behavior and can contain the account."] },
    { eyebrow: "layer 6", title: "Tamper-resistant audit evidence", lines: ["Supports investigation, recovery, and accountability."] },
  ],
  labels: ["if bypassed", "if bypassed", "if bypassed", "if bypassed", "if bypassed"],
  cardHeight: 125,
});

horizontalFlow({
  filename: "cmmi-maturity-levels.svg",
  title: "Five maturity levels",
  subtitle: "Maturity progresses from unpredictable work to measured and continuously improving practice.",
  items: [
    { eyebrow: "level 1", title: "Initial", lines: ["ad hoc"] },
    { eyebrow: "level 2", title: "Managed", lines: ["project level"] },
    { eyebrow: "level 3", title: "Defined", lines: ["standardized"] },
    { eyebrow: "level 4", titleLines: ["Quantitatively", "managed"], lines: ["measured"] },
    { eyebrow: "level 5", title: "Optimizing", lines: ["continuous improvement"] },
  ],
  cardHeight: 190,
});

horizontalFlow({
  filename: "owasp-samm-functions.svg",
  title: "OWASP SAMM business functions",
  subtitle: "The model organizes software assurance practices across the full product lifecycle.",
  items: [
    { title: "Governance", lines: ["strategy", "policy", "education"] },
    { title: "Design", lines: ["threat assessment", "requirements", "architecture"] },
    { title: "Implementation", lines: ["secure build", "secure deploy", "defect management"] },
    { title: "Verification", lines: ["architecture review", "requirements testing", "security testing"] },
    { title: "Operations", lines: ["incident management", "environment", "operational management"] },
  ],
  cardHeight: 235,
});

verticalFlow({
  filename: "cis-implementation-groups.svg",
  title: "CIS Controls implementation groups",
  subtitle: "Each group builds on the safeguards in the group below it.",
  items: [
    { eyebrow: "IG1", title: "Essential cyber hygiene", lines: ["The minimum prioritized safeguards for every enterprise."] },
    { eyebrow: "IG2", title: "Enterprise baseline", lines: ["Adds safeguards for organizations with greater complexity, data, and operational risk."] },
    { eyebrow: "IG3", title: "High-assurance defense", lines: ["Adds safeguards for sensitive operations and targeted, sophisticated threats."] },
  ],
  labels: ["build on IG1", "build on IG1 + IG2"],
});

horizontalFlow({
  filename: "security-token-service-flow.svg",
  title: "Security token exchange",
  subtitle: "An STS validates trusted identity evidence and issues a short-lived token limited to the target resource.",
  items: [
    { eyebrow: "input", title: "Identity evidence", lines: ["OIDC token", "SAML assertion", "workload identity"] },
    { eyebrow: "policy decision", title: "Security token service", lines: ["validate issuer", "evaluate trust", "limit audience + scope"] },
    { eyebrow: "output", title: "Resource token", lines: ["short-lived", "down-scoped", "presented to API"] },
  ],
  labels: ["present", "issue"],
  cardHeight: 235,
});

rows({
  filename: "aws-sts-mechanisms.svg",
  title: "Common AWS STS role-assumption mechanisms",
  subtitle: "Each API exchanges a different kind of trusted caller evidence for temporary AWS credentials.",
  items: [
    { title: "AssumeRole", lines: ["An AWS principal assumes a target IAM role.", "Useful for cross-account or delegated access."] },
    { title: "AssumeRoleWithWebIdentity", lines: ["An external OIDC token is exchanged for role credentials.", "Common for CI/CD and federated workloads."] },
    { title: "AssumeRoleWithSAML", lines: ["A SAML 2.0 assertion is exchanged for role credentials.", "Common for enterprise workforce federation."] },
  ],
});

horizontalFlow({
  filename: "ssh-user-ca.svg",
  title: "OpenSSH user certificate trust",
  subtitle: "Servers trust the CA public key instead of maintaining every user's public key separately.",
  items: [
    { eyebrow: "trusted issuer", title: "User CA", lines: ["CA private key", "signs approved identity"] },
    { eyebrow: "portable credential", title: "User certificate", lines: ["user public key", "principals + expiry", "CA signature"] },
    { eyebrow: "verifier", title: "SSH server", lines: ["trusts CA public key", "checks principal", "checks validity period"] },
  ],
  labels: ["signs", "presents"],
  cardHeight: 235,
});

horizontalFlow({
  filename: "authentication-assurance-levels.svg",
  title: "Authentication assurance levels",
  subtitle: "Higher levels require stronger authenticators, binding, and resistance to impersonation.",
  items: [
    { eyebrow: "AAL1", title: "Single-factor", lines: ["one authentication factor", "basic confidence"] },
    { eyebrow: "AAL2", title: "Multi-factor", lines: ["two distinct factors", "phishing resistance is offered"] },
    { eyebrow: "AAL3", title: "Hardware-protected", lines: ["phishing-resistant", "non-exportable key", "verifier impersonation resistance"] },
  ],
  labels: ["stronger", "strongest"],
  cardHeight: 235,
});

sequence({
  filename: "step-up-authentication-flow.svg",
  title: "Step-up authentication for a high-risk action",
  subtitle: "The API requires a fresher or stronger authentication context before allowing the transaction.",
  participants: ["Client", "Resource server", "Authorization server"],
  messages: [
    { from: 0, to: 1, label: "request transfer" },
    { from: 1, to: 0, label: "insufficient assurance", detail: "401 or authorization response" },
    { from: 0, to: 2, label: "request stronger context", detail: "acr_values and max_age" },
    { from: 2, to: 0, label: "re-authenticate", detail: "phishing-resistant authenticator" },
    { from: 2, to: 0, label: "issue updated token", detail: "fresh authentication context" },
    { from: 0, to: 1, label: "retry transfer", detail: "API validates the stronger context" },
  ],
});

fs.writeFileSync(
  path.join(outputDirectory, "aes-round-operations.svg"),
  documentSvg(
    "AES State Transformation Pipeline (FIPS 197)",
    "Sequential 128-bit block transformation through substitution, permutation, column mixing, and round key XOR",
    340,
    `
    <g>
      <!-- Card 0: Input -->
      <rect x="50" y="110" width="200" height="155" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5"/>
      <text x="68" y="134" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">0 · INPUT</text>
      <text x="68" y="158" font-size="17" font-weight="800" fill="${colors.ink}">Plaintext State</text>
      <text x="68" y="184" font-size="13" font-weight="500" fill="${colors.muted}">128-bit block (16 bytes)</text>
      <text x="68" y="204" font-size="13" font-weight="500" fill="${colors.muted}">Loaded into 4×4 matrix S</text>
      <text x="68" y="224" font-size="13" font-weight="600" fill="${colors.blue}">Initial AddRoundKey (K₀)</text>

      <!-- Arrow 0 -> 1 -->
      <path d="M250 187 L270 187" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>

      <!-- Card 1: SubBytes -->
      <rect x="275" y="110" width="200" height="155" rx="14" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5"/>
      <text x="293" y="134" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">1 · SUBSTITUTE</text>
      <text x="293" y="158" font-size="17" font-weight="800" fill="${colors.ink}">SubBytes</text>
      <text x="293" y="184" font-size="13" font-weight="500" fill="${colors.muted}">Non-linear S-Box table</text>
      <text x="293" y="204" font-size="13" font-weight="500" fill="${colors.muted}">Byte-for-byte lookup</text>
      <text x="293" y="224" font-size="13" font-weight="600" fill="${colors.teal}">Destroys linearity</text>

      <!-- Arrow 1 -> 2 -->
      <path d="M475 187 L495 187" fill="none" stroke="${colors.teal}" stroke-width="3" marker-end="url(#arrow-teal)"/>

      <!-- Card 2: ShiftRows -->
      <rect x="500" y="110" width="200" height="155" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5"/>
      <text x="518" y="134" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">2 · PERMUTE</text>
      <text x="518" y="158" font-size="17" font-weight="800" fill="${colors.ink}">ShiftRows</text>
      <text x="518" y="184" font-size="13" font-weight="500" fill="${colors.muted}">Cyclic row shifts</text>
      <text x="518" y="204" font-size="13" font-weight="500" fill="${colors.muted}">Rows 0, 1, 2, 3 shifted</text>
      <text x="518" y="224" font-size="13" font-weight="600" fill="${colors.amber}">Diffuses column bits</text>

      <!-- Arrow 2 -> 3 -->
      <path d="M700 187 L720 187" fill="none" stroke="${colors.amber}" stroke-width="3" marker-end="url(#arrow-amber)"/>

      <!-- Card 3: MixColumns -->
      <rect x="725" y="110" width="200" height="155" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2.5"/>
      <text x="743" y="134" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.violet}">3 · MIX</text>
      <text x="743" y="158" font-size="17" font-weight="800" fill="${colors.ink}">MixColumns</text>
      <text x="743" y="184" font-size="13" font-weight="500" fill="${colors.muted}">Galois Field GF(2⁸) matrix</text>
      <text x="743" y="204" font-size="13" font-weight="500" fill="${colors.muted}">Mixes column bytes</text>
      <text x="743" y="224" font-size="13" font-weight="600" fill="${colors.violet}">Omitted in final round</text>

      <!-- Arrow 3 -> 4 -->
      <path d="M925 187 L945 187" fill="none" stroke="${colors.violet}" stroke-width="3" marker-end="url(#arrow-violet)"/>

      <!-- Card 4: AddRoundKey & Output -->
      <rect x="950" y="110" width="200" height="155" rx="14" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="2.5"/>
      <text x="968" y="134" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.green}">4 · OUTPUT</text>
      <text x="968" y="158" font-size="17" font-weight="800" fill="${colors.ink}">AddRoundKey</text>
      <text x="968" y="184" font-size="13" font-weight="500" fill="${colors.muted}">XOR state matrix S with Kᵢ</text>
      <text x="968" y="204" font-size="13" font-weight="500" fill="${colors.muted}">Repeats for N rounds</text>
      <text x="968" y="224" font-size="13" font-weight="700" fill="${colors.green}">Emits 128-bit Ciphertext</text>

      <!-- Bottom Round Count Summary Banner -->
      <rect x="50" y="280" width="1100" height="38" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="600" y="304" text-anchor="middle" font-size="13.5" font-weight="700" fill="#334155">Processing Rounds (N):  AES-128 = 10 Rounds (11 Keys)   |   AES-192 = 12 Rounds (13 Keys)   |   AES-256 = 14 Rounds (15 Keys)</text>
    </g>`
  )
);

fs.writeFileSync(
  path.join(outputDirectory, "ecb-openssl-block-leak.svg"),
  documentSvg(
    "AES-128-ECB Block Pattern Leakage Breakdown",
    "Identical 16-byte plaintext blocks produce identical 16-byte hex ciphertext outputs (ecb_leak.py)",
    350,
    `
    <g>
      <!-- Row 1: Block 1 -->
      <rect x="50" y="110" width="300" height="44" rx="8" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="65" y="136" font-size="13" font-weight="700" fill="${colors.ink}">Block 1: "ATTACKATDAWN1234"</text>

      <path d="M350 132 L440 132" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>
      <text x="395" y="125" text-anchor="middle" font-size="10" font-weight="800" fill="${colors.blue}">AES-ECB(K)</text>

      <rect x="445" y="110" width="705" height="44" rx="8" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="460" y="136" font-size="13" font-family="monospace" font-weight="800" fill="${colors.red}">f443 167b d98b 197e 88e7 a6fd c7c0 1f50  [HEX BLOCK 1]</text>

      <!-- Row 2: Block 2 -->
      <rect x="50" y="165" width="300" height="44" rx="8" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="65" y="191" font-size="13" font-weight="700" fill="${colors.ink}">Block 2: "ATTACKATDAWN1234"</text>

      <path d="M350 187 L440 187" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>
      <text x="395" y="180" text-anchor="middle" font-size="10" font-weight="800" fill="${colors.blue}">AES-ECB(K)</text>

      <rect x="445" y="165" width="705" height="44" rx="8" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="460" y="191" font-size="13" font-family="monospace" font-weight="800" fill="${colors.red}">f443 167b d98b 197e 88e7 a6fd c7c0 1f50  [DUPLICATE MATCH]</text>

      <!-- Row 3: Block 3 -->
      <rect x="50" y="220" width="300" height="44" rx="8" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="65" y="246" font-size="13" font-weight="700" fill="${colors.ink}">Block 3: "ATTACKATDAWN1234"</text>

      <path d="M350 242 L440 242" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>
      <text x="395" y="235" text-anchor="middle" font-size="10" font-weight="800" fill="${colors.blue}">AES-ECB(K)</text>

      <rect x="445" y="220" width="705" height="44" rx="8" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="460" y="246" font-size="13" font-family="monospace" font-weight="800" fill="${colors.red}">f443 167b d98b 197e 88e7 a6fd c7c0 1f50  [DUPLICATE MATCH]</text>

      <!-- Row 4: Block 4 -->
      <rect x="50" y="275" width="300" height="44" rx="8" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="65" y="301" font-size="13" font-weight="700" fill="${colors.ink}">Block 4: "ATTACKATDAWN1234"</text>

      <path d="M350 297 L440 297" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>
      <text x="395" y="290" text-anchor="middle" font-size="10" font-weight="800" fill="${colors.blue}">AES-ECB(K)</text>

      <rect x="445" y="275" width="705" height="44" rx="8" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="460" y="301" font-size="13" font-family="monospace" font-weight="800" fill="${colors.red}">f443 167b d98b 197e 88e7 a6fd c7c0 1f50  [DUPLICATE MATCH]</text>
    </g>`
  )
);

fs.writeFileSync(
  path.join(outputDirectory, "cbc-bitflip.svg"),
  documentSvg(
    "CBC Bit-Flipping Malleability Attack Mechanics",
    "Modifying byte k in Ciphertext C₁ scrambles P₁ into noise, but flips target bit k in P₂ ('isadmin=0' → 'isadmin=1')",
    450,
    `
    <g>
      <!-- Top Section: Transmitted Ciphertext -->
      <!-- C1 Box -->
      <rect x="50" y="110" width="520" height="95" rx="12" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5"/>
      <text x="70" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">ATTACKER MANIPULATES CIPHERTEXT</text>
      <text x="70" y="160" font-size="16" font-weight="800" fill="${colors.ink}">Ciphertext Block 1 (C₁)</text>
      <rect x="340" y="142" width="210" height="28" rx="6" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2"/>
      <text x="445" y="161" text-anchor="middle" font-size="12" font-weight="800" fill="${colors.red}">Byte 13 Flipped (0x30 ⊕ 0x31)</text>

      <!-- C2 Box -->
      <rect x="630" y="110" width="520" height="95" rx="12" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5"/>
      <text x="650" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">UNTOUCHED CIPHERTEXT</text>
      <text x="650" y="160" font-size="16" font-weight="800" fill="${colors.ink}">Ciphertext Block 2 (C₂)</text>
      <text x="650" y="184" font-size="13" font-weight="500" fill="${colors.muted}">Payload containing "user;isadmin=0;;"</text>

      <!-- Decryption Flow Arrows -->
      <path d="M310 205 L310 255" fill="none" stroke="${colors.muted}" stroke-width="3" marker-end="url(#arrow)"/>
      <text x="320" y="235" font-size="11" font-weight="700" fill="${colors.muted}">D_K(C₁)</text>

      <path d="M890 205 L890 255" fill="none" stroke="${colors.muted}" stroke-width="3" marker-end="url(#arrow)"/>

      <!-- CBC Chaining Arrow (C1 -> P2) -->
      <path d="M445 170 L445 230 L870 230 L870 255" fill="none" stroke="${colors.red}" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#arrow-red)"/>
      <text x="660" y="222" font-size="11" font-weight="800" fill="${colors.red}">CBC Chaining: C₁ XORs into P₂ Decryption</text>

      <!-- Bottom Section: Server Decrypted Plaintext -->
      <!-- Decrypted P1 Box (Garbled Noise) -->
      <rect x="50" y="260" width="520" height="110" rx="12" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="70" y="286" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">SERVER DECRYPTED RESULT: BLOCK 1</text>
      <text x="70" y="310" font-size="16" font-weight="800" fill="${colors.red}">Unrecoverable Garbled Noise</text>
      <text x="70" y="334" font-size="13" font-weight="500" fill="${colors.muted}">AES block diffusion scrambles entire 16-byte block</text>
      <text x="70" y="352" font-size="12" fill="${colors.muted}">b'\xfa\x82\x91...' (Ignored by application header parser)</text>

      <!-- Decrypted P2 Box (Privilege Escalation Target) -->
      <rect x="630" y="260" width="520" height="110" rx="12" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5"/>
      <text x="650" y="286" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">SERVER DECRYPTED RESULT: BLOCK 2</text>
      <text x="650" y="310" font-size="16" font-weight="800" fill="${colors.ink}">"user;isadmin=1;;"</text>
      <text x="650" y="334" font-size="13" font-weight="700" fill="${colors.teal}">Privilege Escalation Achieved!</text>
      <text x="650" y="352" font-size="12" font-weight="500" fill="${colors.muted}">Target byte 13 flipped from '0' to '1'; other 15 bytes intact</text>

      <!-- Bottom Summary Banner -->
      <rect x="50" y="390" width="1100" height="38" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="600" y="414" text-anchor="middle" font-size="13.5" font-weight="700" fill="#334155">No Key Required — Unauthenticated CBC lacks AEAD integrity tags. Decryption succeeds without raising errors!</text>
    </g>`
  )
);

fs.writeFileSync(
  path.join(outputDirectory, "ctr-two-time-pad.svg"),
  documentSvg(
    "CTR Nonce-Reuse Two-Time Pad Attack Mechanics",
    "Reusing a 96-bit nonce under the same key generates identical keystream (KS₁ = KS₂), enabling XOR cancellation",
    440,
    `
    <g>
      <!-- Top Row: Session 1 vs Session 2 -->
      <!-- Session 1 Box -->
      <rect x="50" y="110" width="520" height="95" rx="12" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5"/>
      <text x="70" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">SESSION 1 (NONCE N)</text>
      <text x="70" y="160" font-size="15" font-weight="800" fill="${colors.ink}">P₁: "Transfer $100 to Bob!!!"</text>
      <text x="70" y="184" font-size="13" font-weight="600" fill="${colors.muted}">C₁ = P₁ ⊕ Keystream(N)</text>

      <!-- Session 2 Box -->
      <rect x="630" y="110" width="520" height="95" rx="12" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="650" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">SESSION 2 (REUSED NONCE N)</text>
      <text x="650" y="160" font-size="15" font-weight="800" fill="${colors.ink}">P₂: "Meet me at 9pm sharp!!!"</text>
      <text x="650" y="184" font-size="13" font-weight="600" fill="${colors.red}">C₂ = P₂ ⊕ Keystream(N)  [DUPLICATE KEYSTREAM!]</text>

      <!-- Solid Connecting Arrows to Adversary Analysis Box -->
      <path d="M 310 205 L 310 225 L 420 225 L 420 240" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>
      <rect x="330" y="213" width="70" height="20" rx="4" fill="#ffffff" stroke="${colors.blue}" stroke-width="1"/>
      <text x="365" y="227" text-anchor="middle" font-size="11" font-weight="800" fill="${colors.blue}">Sent C₁</text>

      <path d="M 890 205 L 890 225 L 780 225 L 780 240" fill="none" stroke="${colors.red}" stroke-width="3" marker-end="url(#arrow-red)"/>
      <rect x="745" y="213" width="70" height="20" rx="4" fill="#ffffff" stroke="${colors.red}" stroke-width="1"/>
      <text x="780" y="227" text-anchor="middle" font-size="11" font-weight="800" fill="${colors.red}">Sent C₂</text>

      <!-- Middle Section: Adversary XOR Keystream Cancellation Box -->
      <rect x="350" y="240" width="500" height="95" rx="12" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5"/>
      <text x="600" y="266" text-anchor="middle" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">ADVERSARY NETWORK ANALYSIS</text>
      <text x="600" y="290" text-anchor="middle" font-size="16" font-weight="800" fill="${colors.ink}">C₁ ⊕ C₂ = (P₁ ⊕ KS) ⊕ (P₂ ⊕ KS) = P₁ ⊕ P₂</text>
      <text x="600" y="314" text-anchor="middle" font-size="13" font-weight="700" fill="${colors.amber}">Keystream KS cancels out completely — Secret Key eliminated!</text>

      <!-- Arrow down to Known-Plaintext Attack Result -->
      <path d="M 600 335 L 600 368" fill="none" stroke="${colors.amber}" stroke-width="3" marker-end="url(#arrow-amber)"/>

      <!-- Bottom Banner: Known-Plaintext Recovery -->
      <rect x="50" y="370" width="1100" height="50" rx="10" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2"/>
      <text x="600" y="394" text-anchor="middle" font-size="13.5" font-weight="800" fill="${colors.teal}">Known-Plaintext Attack: Guess P₁ prefix ("Transfer $100 to") ⊕ (P₁ ⊕ P₂)</text>
      <text x="600" y="410" text-anchor="middle" font-size="13" font-weight="700" fill="${colors.ink}">Recovers P₂ Plaintext: "Meet me at 9pm s" WITHOUT Decryption Key!</text>
    </g>`
  )
);

sequence({
  filename: "hybrid-public-key-encryption.svg",
  title: "Hybrid encryption: asymmetric key transport, symmetric data encryption",
  subtitle: "The sender encrypts bulk data with a random DEK and protects only that DEK with the recipient's public key.",
  participants: ["Sender", "Recipient"],
  messages: [
    { from: 0, to: 0, label: "generate random DEK", detail: "AES-256 data key" },
    { from: 0, to: 1, label: "send ciphertext", detail: "Payload encrypted with the DEK" },
    { from: 0, to: 1, label: "send encrypted DEK", detail: "DEK protected with recipient public key" },
    { from: 1, to: 1, label: "recover DEK", detail: "Recipient private key decrypts or unwraps the DEK" },
    { from: 1, to: 1, label: "decrypt payload", detail: "Recovered DEK decrypts and authenticates the data" },
  ],
  note: "Asymmetric cryptography protects the small data key; symmetric cryptography handles the large payload efficiently.",
});

fs.writeFileSync(
  path.join(outputDirectory, "certificate-lifecycle.svg"),
  documentSvg(
    "Automated X.509 Certificate Lifecycle & ACME Protocol",
    "Automated lifecycle: Key Generation → CSR Submission → DV Validation → CA Issuance → Deployment → Renewal",
    480,
    `
    <g>
      <!-- Top Row: 6 Sequential Lifecycle Cards -->
      <!-- Step 1: Key Generation -->
      <rect x="50" y="110" width="165" height="110" rx="10" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="65" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">STEP 1</text>
      <text x="65" y="158" font-size="14" font-weight="800" fill="${colors.ink}">Key Generation</text>
      <text x="65" y="180" font-size="11.5" font-weight="500" fill="${colors.muted}">Generate private key</text>
      <text x="65" y="196" font-size="11" font-weight="600" fill="${colors.teal}">Kept in RAM / HSM</text>

      <path d="M215 165 L245 165" fill="none" stroke="${colors.blue}" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

      <!-- Step 2: CSR Submission -->
      <rect x="245" y="110" width="165" height="110" rx="10" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="260" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">STEP 2</text>
      <text x="260" y="158" font-size="14" font-weight="800" fill="${colors.ink}">CSR Request</text>
      <text x="260" y="180" font-size="11.5" font-weight="500" fill="${colors.muted}">PKCS#10 payload</text>
      <text x="260" y="196" font-size="11" font-weight="600" fill="${colors.blue}">Sent to ACME CA</text>

      <path d="M410 165 L440 165" fill="none" stroke="${colors.blue}" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

      <!-- Step 3: Domain Validation -->
      <rect x="440" y="110" width="165" height="110" rx="10" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2"/>
      <text x="455" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">STEP 3</text>
      <text x="455" y="158" font-size="14" font-weight="800" fill="${colors.ink}">DV Validation</text>
      <text x="455" y="180" font-size="11.5" font-weight="500" fill="${colors.muted}">DNS-01 / HTTP-01</text>
      <text x="455" y="196" font-size="10" font-weight="600" fill="${colors.amber}">Validates Domain Control</text>

      <path d="M605 165 L635 165" fill="none" stroke="${colors.amber}" stroke-width="2.5" marker-end="url(#arrow-amber)"/>

      <!-- Step 4: CA Issuance -->
      <rect x="635" y="110" width="165" height="110" rx="10" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2"/>
      <text x="650" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">STEP 4</text>
      <text x="650" y="158" font-size="14" font-weight="800" fill="${colors.ink}">CA Issuance</text>
      <text x="650" y="180" font-size="11.5" font-weight="500" fill="${colors.muted}">Signs X.509 cert</text>
      <text x="650" y="196" font-size="11" font-weight="600" fill="${colors.teal}">&#8804;200 Day Lifetime (2026)</text>

      <path d="M800 165 L830 165" fill="none" stroke="${colors.teal}" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

      <!-- Step 5: Web Deployment -->
      <rect x="830" y="110" width="165" height="110" rx="10" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2"/>
      <text x="845" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">STEP 5</text>
      <text x="845" y="158" font-size="14" font-weight="800" fill="${colors.ink}">Web Deployment</text>
      <text x="845" y="180" font-size="11.5" font-weight="500" fill="${colors.muted}">Installs full chain</text>
      <text x="845" y="196" font-size="11" font-weight="600" fill="${colors.ink}">Binds to TLS Server</text>

      <path d="M995 165 L1025 165" fill="none" stroke="${colors.blue}" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

      <!-- Step 6: ARI Auto-Renewal -->
      <rect x="1025" y="110" width="125" height="110" rx="10" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="1037" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">STEP 6</text>
      <text x="1037" y="158" font-size="13" font-weight="800" fill="${colors.ink}">ARI Renewal</text>
      <text x="1037" y="180" font-size="10.5" font-weight="500" fill="${colors.muted}">Auto-renew</text>
      <text x="1037" y="196" font-size="10.5" font-weight="600" fill="${colors.blue}">ACME Agent</text>

      <!-- Auto-Renewal Loop Arrow (Card 6 back to Card 2) -->
      <path d="M 1087 220 L 1087 260 L 327 260 L 327 225" fill="none" stroke="${colors.blue}" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#arrow-blue)"/>
      <rect x="620" y="248" width="180" height="24" rx="4" fill="#ffffff" stroke="${colors.blue}" stroke-width="1"/>
      <text x="710" y="264" text-anchor="middle" font-size="11" font-weight="800" fill="${colors.blue}">Automated ACME Renewal Loop</text>

      <!-- Bottom Branch: Emergency Revocation -->
      <rect x="50" y="320" width="1100" height="110" rx="12" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5"/>
      <text x="70" y="348" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">EMERGENCY EXCEPTION: REVOCATION (CRL / OCSP STAPLING)</text>
      <text x="70" y="374" font-size="16" font-weight="800" fill="${colors.ink}">Key Compromise or Mis-Issuance Trigger</text>
      <text x="70" y="398" font-size="13" font-weight="600" fill="${colors.muted}">CA revokes certificate serial number; browser checks status via OCSP Stapling or Certificate Revocation Lists (CRL)</text>
      <text x="70" y="416" font-size="12" font-weight="700" fill="${colors.red}">Revocation is best-effort, not guaranteed-immediate: many clients soft-fail when status is unavailable</text>
    </g>`
  )
);

fs.writeFileSync(
  path.join(outputDirectory, "sct-flow.svg"),
  documentSvg(
    "Signed Certificate Timestamps (SCT) Workflow & CT Log Auditing",
    "Submitting pre-certificates to independent CT logs, receiving SCTs, and verifying inclusion via browser policies",
    440,
    `
    <g>
      <!-- Top Row: 4 Sequential Workflow Steps -->
      <!-- Step 1: Pre-Cert Submission -->
      <rect x="50" y="110" width="230" height="100" rx="10" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="65" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">STEP 1: CERTIFICATE AUTHORITY</text>
      <text x="65" y="158" font-size="14" font-weight="800" fill="${colors.ink}">Submit Pre-Certificate</text>
      <text x="65" y="180" font-size="12" font-weight="500" fill="${colors.muted}">CA sends pre-cert payload to</text>
      <text x="65" y="196" font-size="11" font-weight="600" fill="${colors.blue}">Multiple CT Logs (Count Varies)</text>

      <path d="M 280 160 L 330 160" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>

      <!-- Step 2: CT Log SCT Return -->
      <rect x="340" y="110" width="230" height="100" rx="10" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2"/>
      <text x="355" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">STEP 2: CT LOG SERVERS</text>
      <text x="355" y="158" font-size="14" font-weight="800" fill="${colors.ink}">Generate &amp; Return SCT</text>
      <text x="355" y="180" font-size="12" font-weight="500" fill="${colors.muted}">Log signs a promise to include &#8212;</text>
      <text x="355" y="196" font-size="12" font-weight="600" fill="${colors.amber}">actual Merkle append follows within MMD</text>

      <path d="M 570 160 L 620 160" fill="none" stroke="${colors.amber}" stroke-width="3" marker-end="url(#arrow-amber)"/>

      <!-- Step 3: SCT Embedding -->
      <rect x="630" y="110" width="230" height="100" rx="10" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2"/>
      <text x="645" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">STEP 3: ISSUANCE &amp; EMBEDDING</text>
      <text x="645" y="158" font-size="14" font-weight="800" fill="${colors.ink}">Embed SCT Extension</text>
      <text x="645" y="180" font-size="12" font-weight="500" fill="${colors.muted}">CA embeds SCTs directly into</text>
      <text x="645" y="196" font-size="12" font-weight="600" fill="${colors.teal}">Final X.509 Certificate</text>

      <path d="M 860 160 L 910 160" fill="none" stroke="${colors.teal}" stroke-width="3" marker-end="url(#arrow-teal)"/>

      <!-- Step 4: Browser Verification -->
      <rect x="920" y="110" width="230" height="100" rx="10" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2"/>
      <text x="935" y="136" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">STEP 4: CLIENT BROWSER</text>
      <text x="935" y="158" font-size="14" font-weight="800" fill="${colors.ink}">Enforce CT Policy</text>
      <text x="935" y="180" font-size="11" font-weight="500" fill="${colors.muted}">Verifies required SCT count</text>
      <text x="935" y="196" font-size="11" font-weight="700" fill="${colors.blue}">&amp; log diversity (policy-dependent)</text>

      <!-- Bottom Card: Delivery Methods & Protection -->
      <rect x="50" y="240" width="1100" height="170" rx="12" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5"/>
      <text x="70" y="268" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">SCT DELIVERY METHODS &amp; BROWSER ENFORCEMENT</text>
      <text x="70" y="294" font-size="15" font-weight="800" fill="${colors.ink}">3 Standardized SCT Delivery Mechanisms &#8212; Browser Acceptance Varies:</text>
      <text x="70" y="320" font-size="13" font-weight="600" fill="${colors.ink}">1. X.509 Extension (Most Common): CA bakes SCTs directly into the certificate during issuance.</text>
      <text x="70" y="342" font-size="13" font-weight="600" fill="${colors.ink}">2. TLS Extension (signed_certificate_timestamp): Web server transmits SCTs during ServerHello handshake.</text>
      <text x="70" y="364" font-size="13" font-weight="600" fill="${colors.ink}">3. OCSP Stapling: SCTs wrapped in the stapled OCSP response &#8212; Chrome 148+ no longer accepts this path.</text>
      <text x="70" y="392" font-size="12.5" font-weight="700" fill="${colors.teal}">Browser Policy: Chrome/Apple root programs require valid SCTs via their currently-accepted delivery paths to trust a cert.</text>
    </g>`
  )
);

verticalFlow({
  filename: "threat-modeling-questions.svg",
  title: "Four questions in a threat-modeling cycle",
  subtitle: "The model is useful only when architecture, threats, mitigations, and validation stay connected.",
  items: [
    { eyebrow: "1 · scope", title: "What are we working on?", lines: ["Map components, data flows, identities, assets, and trust boundaries."] },
    { eyebrow: "2 · analyze", title: "What can go wrong?", lines: ["Use threat scenarios, STRIDE, attack trees, and abuse cases where they fit."] },
    { eyebrow: "3 · respond", title: "What are we doing about it?", lines: ["Choose controls that prevent, detect, contain, or support recovery."] },
    { eyebrow: "4 · validate", title: "Did we do a good job?", lines: ["Test controls, review evidence, and record residual risk and assumptions."] },
  ],
  labels: ["model", "mitigate", "verify"],
});

horizontalFlow({
  filename: "webauthn-components.svg",
  title: "WebAuthn components",
  subtitle: "The browser coordinates a challenge-response exchange without sending the private key to the server.",
  items: [
    { eyebrow: "human + client", title: "User and browser", lines: ["starts registration", "or sign-in"] },
    { eyebrow: "key holder", title: "Authenticator", lines: ["Touch ID · platform TPM", "security key", "signs the challenge"] },
    { eyebrow: "verifier", title: "Relying party", lines: ["creates challenge", "stores public key", "verifies response"] },
  ],
  labels: ["WebAuthn API", "challenge + signature"],
  cardHeight: 235,
});

comparison({
  filename: "iso-27001-27002-relationship.svg",
  title: "ISO/IEC 27001 and ISO/IEC 27002",
  subtitle: "The standards are related, but they serve different purposes.",
  items: [
    { eyebrow: "requirements", title: "ISO/IEC 27001", lines: ["Defines requirements for", "an information security", "management system.", "", "An organization can be", "certified against it."], colors: accents[0] },
    { eyebrow: "guidance", title: "ISO/IEC 27002", lines: ["Explains information", "security controls and", "implementation guidance.", "", "It supports control selection;", "it is not a certification basis."], colors: accents[1] },
  ],
  footer: "ISO/IEC 27001 Annex A references the control set described in ISO/IEC 27002.",
});

// NIST CSF functions are concurrent outcomes, not a one-way implementation sequence.
{
  const functionItems = [
    { title: "IDENTIFY", lines: ["Understand assets,", "risks, and context"] },
    { title: "PROTECT", lines: ["Apply safeguards", "to manage risk"] },
    { title: "DETECT", lines: ["Find and analyze", "possible events"] },
    { title: "RESPOND", lines: ["Contain and manage", "an incident"] },
    { title: "RECOVER", lines: ["Restore services", "and improve"] },
  ];
  let body = `${card(70, 125, 1060, 125, { eyebrow: "cross-cutting function", title: "GOVERN", lines: ["Set strategy, policy, roles, oversight, and risk-management expectations across every other function."], colors: accents[3] })}`;
  functionItems.forEach((item, index) => {
    const width = 196;
    const gap = 20;
    const x = 70 + index * (width + gap);
    body += card(x, 335, width, 185, item, index);
    body += `<path d="M${x + width / 2} 250 V320" stroke="${colors.line}" stroke-width="3" stroke-dasharray="7 7" marker-end="url(#arrow)"/>`;
    if (index < functionItems.length - 1) body += arrow(x + width + 5, 428, x + width + gap - 5, 428);
  });
  body += `<path d="M1050 545 Q1050 610 600 610 Q150 610 150 545" fill="none" stroke="${colors.teal}" stroke-width="3" stroke-dasharray="8 7" marker-end="url(#arrow)"/>`;
  body += lines(600, 638, ["Continuous feedback: lessons from detection, response, and recovery change priorities and safeguards."], { size: 14, fill: colors.ink, weight: 700, anchor: "middle" });
  write("nist-csf-functions.svg", documentSvg("NIST Cybersecurity Framework 2.0 functions", "Govern informs all five operational functions, which continuously exchange information and improve one another.", 680, body));
}

horizontalFlow({
  filename: "owasp-guides-compared.svg",
  title: "Choosing among OWASP Top 10, ASVS, and SAMM",
  subtitle: "Use the artifact that matches the question I am trying to answer.",
  items: [
    { eyebrow: "awareness", title: "OWASP Top 10", lines: ["Which common web", "application risks", "should I recognize?"] },
    { eyebrow: "verification", title: "OWASP ASVS", lines: ["Which security", "requirements can I", "design and test?"] },
    { eyebrow: "program maturity", title: "OWASP SAMM", lines: ["How do I improve", "software assurance", "practices over time?"] },
  ],
  cardHeight: 235,
});

horizontalFlow({
  filename: "dns-cache-poisoning.svg",
  title: "DNS cache poisoning attempt",
  subtitle: "The attacker tries to make a forged response win the race and enter the recursive resolver's cache.",
  items: [
    { eyebrow: "1 · trigger", title: "Random query", lines: ["Query a nonexistent", "bank.com name"] },
    { eyebrow: "2 · race", title: "Forged replies", lines: ["Guess transaction data", "and claim a fake answer"] },
    { eyebrow: "3 · consequence", title: "Poisoned cache", lines: ["Later users receive", "attacker-controlled data"] },
  ],
  labels: ["creates lookup", "if accepted"],
  cardHeight: 220,
});

horizontalFlow({
  filename: "cryptography-threats.svg",
  title: "Threats to data crossing an untrusted network",
  subtitle: "Cryptographic controls protect different properties of the same communication.",
  items: [
    { eyebrow: "confidentiality", title: "Eavesdropping", lines: ["Attacker reads", "data in transit"] },
    { eyebrow: "integrity", title: "Tampering", lines: ["Attacker modifies", "the payload"] },
    { eyebrow: "authenticity", title: "Impersonation", lines: ["Attacker pretends", "to be a peer"] },
  ],
  cardHeight: 215,
});

verticalFlow({
  filename: "tls-cryptography-layers.svg",
  title: "How TLS combines cryptographic primitives",
  subtitle: "TLS uses separate mechanisms for peer authentication, shared-secret establishment, and protected data transport.",
  items: [
    { eyebrow: "authentication", title: "Validate the server certificate and signature", lines: ["The client validates the X.509 chain and proof of the certificate private key."] },
    { eyebrow: "key establishment", title: "Derive fresh traffic secrets", lines: ["Ephemeral Diffie-Hellman and HKDF establish keys without sending them directly."] },
    { eyebrow: "record protection", title: "Encrypt and authenticate application data", lines: ["AEAD such as AES-GCM or ChaCha20-Poly1305 protects each record."] },
  ],
  labels: ["establish trust", "protect traffic"],
});

rows({
  filename: "envelope-encryption.svg",
  title: "Envelope encryption with a KMS",
  subtitle: "The application encrypts data locally with a DEK and stores only the wrapped DEK beside the ciphertext.",
  items: [
    { title: "1 · Generate DEK", lines: ["Create a random symmetric data encryption key for the payload."] },
    { title: "2 · Encrypt payload", lines: ["Use the plaintext DEK with an AEAD cipher, then remove the plaintext DEK from memory."] },
    { title: "3 · Wrap DEK", lines: ["KMS protects the DEK under a KEK or customer-managed key without exposing that KEK."] },
    { title: "4 · Store envelope", lines: ["Persist ciphertext, nonce, tag, metadata, and wrapped DEK together."] },
  ],
});

// Certificate Transparency needs a real tree rather than a linear flow.
{
  const body = `
    ${card(430, 125, 340, 110, { eyebrow: "signed checkpoint", title: "Signed Tree Head", lines: ["root hash + tree size + timestamp"] }, 0)}
    ${card(140, 330, 350, 105, { title: "Hash of leaves 0–1", lines: ["commits to the left subtree"] }, 1)}
    ${card(710, 330, 350, 105, { title: "Hash of leaves 2–3", lines: ["commits to the right subtree"] }, 1)}
    ${card(45, 535, 235, 100, { title: "Leaf 0", lines: ["precertificate A"] }, 2)}
    ${card(320, 535, 235, 100, { title: "Leaf 1", lines: ["precertificate B"] }, 2)}
    ${card(645, 535, 235, 100, { title: "Leaf 2", lines: ["precertificate C"] }, 2)}
    ${card(920, 535, 235, 100, { title: "Leaf 3", lines: ["precertificate D"] }, 2)}
    ${arrow(500, 320, 560, 240)}${arrow(700, 240, 770, 320)}
    ${arrow(200, 525, 270, 445)}${arrow(435, 525, 370, 445)}
    ${arrow(760, 525, 820, 445)}${arrow(1035, 525, 950, 445)}
    <rect x="120" y="690" width="960" height="54" rx="22" fill="${colors.panel}" stroke="${colors.rule}" stroke-width="2"/>
    ${lines(600, 723, ["An inclusion proof supplies the neighboring hashes needed to recompute the signed root."], { size: 15, fill: colors.ink, weight: 700, anchor: "middle" })}`;
  write("certificate-transparency-merkle-tree.svg", documentSvg("Certificate Transparency Merkle tree", "The signed root commits to every ordered log entry without placing every certificate in the checkpoint.", 785, body));
}

// Security Domains Architecture Diagram (CIA Core -> Domain Scopes -> Risk Engine -> Controls Execution)
{
  const body = `
    <!-- Outer Container: Technical Execution & Security Controls -->
    <rect x="40" y="115" width="1120" height="475" rx="22" fill="${colors.panel}" stroke="${colors.ink}" stroke-width="3" />
    <text x="65" y="148" font-size="12" font-weight="900" letter-spacing="1.5" fill="${colors.ink}">TECHNICAL EXECUTION &amp; SECURITY CONTROLS (NIST SP 800-53 REV. 5 / NIST SP 800-160)</text>
    <text x="65" y="170" font-size="12" font-weight="500" fill="${colors.muted}">Applied technical safeguards: Cryptography (AES / TLS 1.3), IAM (OAuth / Passkeys),</text>
    <text x="65" y="188" font-size="12" font-weight="500" fill="${colors.muted}">Application Security (WAF / SAST), Network Defense, and HSM / TPM Roots of Trust</text>

    <!-- Governance Container: Risk Management Engine -->
    <rect x="65" y="208" width="1070" height="360" rx="18" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5" />
    <text x="90" y="236" font-size="12" font-weight="900" letter-spacing="1.5" fill="${colors.amber}">UNIVERSAL RISK MANAGEMENT ENGINE (NIST SP 800-39 / ISO 27005)</text>
    <text x="90" y="258" font-size="12" font-weight="600" fill="${colors.ink}">Common decision bridge connecting all domains:</text>
    <text x="90" y="276" font-size="12" font-weight="600" fill="${colors.ink}">Frame Risk  ──&gt;  Assess Exposure  ──&gt;  Select Response (Avoid, Reduce, Transfer, Accept)</text>

    <!-- Scope Container: InfoSec & Cybersecurity -->
    <rect x="90" y="294" width="1020" height="254" rx="16" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5" />
    <text x="115" y="320" font-size="12" font-weight="900" letter-spacing="1.5" fill="${colors.blue}">DOMAIN SCOPES &amp; BOUNDARIES</text>
    <text x="115" y="342" font-size="12" font-weight="700" fill="${colors.ink}">• Information Security (FISMA 44 U.S.C. 3542 / ISO 27001): Preserves CIA across all info</text>
    <text x="127" y="360" font-size="12" font-weight="500" fill="${colors.muted}">assets (paper, digital, verbal, GRC policy frameworks)</text>
    <text x="115" y="380" font-size="12" font-weight="700" fill="${colors.ink}">• Cybersecurity (NIST CSF 2.0 / ISO 27032): Preserves CIA &amp; Resilience across digital infrastructure,</text>
    <text x="127" y="398" font-size="12" font-weight="500" fill="${colors.muted}">software applications, cloud services, and networks in cyberspace</text>

    <!-- Core Container: Security Objectives -->
    <rect x="115" y="415" width="970" height="118" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2.5" />
    <text x="600" y="438" text-anchor="middle" font-size="11.5" font-weight="900" letter-spacing="1.5" fill="${colors.violet}">CORE SECURITY OBJECTIVES (NIST FIPS 199)</text>
    <text x="600" y="458" text-anchor="middle" font-size="14" font-weight="800" fill="${colors.ink}">Preserving Confidentiality, Integrity, Availability (CIA) + Safety &amp; Resilience</text>
    <line x1="140" y1="470" x2="1060" y2="470" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />
    <text x="270" y="492" text-anchor="middle" font-size="12.5" font-weight="800" fill="${colors.ink}">Confidentiality</text>
    <text x="270" y="510" text-anchor="middle" font-size="11.5" font-weight="500" fill="${colors.muted}">Authorized access only</text>
    <text x="600" y="492" text-anchor="middle" font-size="12.5" font-weight="800" fill="${colors.ink}">Integrity</text>
    <text x="600" y="510" text-anchor="middle" font-size="11.5" font-weight="500" fill="${colors.muted}">Protection from unauthorized alteration</text>
    <text x="930" y="492" text-anchor="middle" font-size="12.5" font-weight="800" fill="${colors.ink}">Availability</text>
    <text x="930" y="510" text-anchor="middle" font-size="11.5" font-weight="500" fill="${colors.muted}">Reliable access for authorized users</text>`;
  write("security-domains-overlap.svg", documentSvg("Defining Security Domains: Architecture & Scopes", "Security engineering operates across nested structures: CIA Core Objectives at center, InfoSec and Cybersecurity domain scopes, Risk Management Engine, and Security Controls Execution.", 610, body));
}

// Continuous Risk Management Lifecycle Diagram (Clean 5-Stage Architecture + Orthogonal Loop)
{
  const body = `
    <!-- Stage 1: Problem Inputs (x=40, w=210) -->
    <rect x="40" y="125" width="210" height="340" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2" />
    <text x="55" y="152" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.blue}">STAGE 1: INPUTS</text>
    <text x="55" y="174" font-size="15" font-weight="800" fill="${colors.ink}">Problem Domain</text>
    <line x1="55" y1="188" x2="235" y2="188" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="55" y="210" font-size="11" font-weight="800" fill="${colors.blue}">OPERATIONAL INPUTS:</text>
    <text x="55" y="228" font-size="11.5" font-weight="500" fill="${colors.muted}">• Threat Modeling</text>
    <text x="55" y="246" font-size="11.5" font-weight="500" fill="${colors.muted}">• Vuln Scans / CVSS</text>
    <text x="55" y="264" font-size="11.5" font-weight="500" fill="${colors.muted}">• Threat Intel Feeds</text>
    <text x="55" y="282" font-size="11.5" font-weight="500" fill="${colors.muted}">• Asset Inventories</text>
    <text x="55" y="300" font-size="11.5" font-weight="500" fill="${colors.muted}">• Gap Assessments</text>
    <line x1="55" y1="314" x2="235" y2="314" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="55" y="336" font-size="11" font-weight="800" fill="${colors.blue}">COMPONENTS:</text>
    <text x="55" y="354" font-size="11" font-weight="600" fill="${colors.ink}">• Asset</text>
    <text x="55" y="372" font-size="11" font-weight="600" fill="${colors.ink}">• Threat Source/Event</text>
    <text x="55" y="390" font-size="11" font-weight="600" fill="${colors.ink}">• Vulnerability</text>
    <text x="55" y="408" font-size="11" font-weight="600" fill="${colors.ink}">• Consequential Impact</text>

    <!-- Arrow 1 -> 2 -->
    ${arrow(250, 295, 270, 295)}

    <!-- Stage 2: Risk Assessment (x=270, w=210) -->
    <rect x="270" y="125" width="210" height="340" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2" />
    <text x="285" y="152" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.amber}">STAGE 2: EVALUATION</text>
    <text x="285" y="174" font-size="15" font-weight="800" fill="${colors.ink}">Risk Assessment</text>
    <text x="285" y="194" font-size="10.5" font-weight="600" fill="${colors.muted}">(NIST SP 800-30 Rev. 1)</text>
    <line x1="285" y1="206" x2="465" y2="206" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="285" y="228" font-size="11.5" font-weight="700" fill="${colors.ink}">Calculate Exposure:</text>
    <text x="285" y="250" font-size="12" font-weight="800" fill="${colors.amber}">Risk = Likelihood × Impact</text>
    <line x1="285" y1="264" x2="465" y2="264" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="285" y="286" font-size="11.5" font-weight="500" fill="${colors.muted}">• Threat Plausibility</text>
    <text x="285" y="304" font-size="11.5" font-weight="500" fill="${colors.muted}">• Impact Harm Severity</text>
    <text x="285" y="322" font-size="11.5" font-weight="500" fill="${colors.muted}">• Evaluated Severity:</text>
    <text x="285" y="342" font-size="11" font-weight="700" fill="${colors.ink}">  (Low/Med/High/Critical)</text>

    <!-- Arrow 2 -> 3 -->
    ${arrow(480, 295, 500, 295)}

    <!-- Stage 3: Risk Response Strategies (x=500, w=220) -->
    <rect x="500" y="125" width="220" height="340" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2" />
    <text x="515" y="152" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.violet}">STAGE 3: STRATEGY</text>
    <text x="515" y="174" font-size="15" font-weight="800" fill="${colors.ink}">Risk Responses</text>
    <text x="515" y="194" font-size="10.5" font-weight="600" fill="${colors.muted}">(NIST SP 800-39 / ISO 27005)</text>
    <line x1="515" y1="206" x2="705" y2="206" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />

    <!-- 4 Strategy Cards -->
    <rect x="510" y="215" width="200" height="42" rx="6" fill="#ffffff" stroke="${colors.rule}" stroke-width="1" />
    <text x="518" y="232" font-size="11" font-weight="800" fill="${colors.ink}">1. Avoid:</text>
    <text x="518" y="247" font-size="10.5" font-weight="500" fill="${colors.muted}">Redesign / terminate feature</text>

    <rect x="510" y="265" width="200" height="52" rx="6" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="1.5" />
    <text x="518" y="283" font-size="11" font-weight="800" fill="${colors.teal}">2. Reduce (Mitigate): ──&gt;</text>
    <text x="518" y="300" font-size="10.5" font-weight="700" fill="${colors.ink}">Triggers Stage 4 Controls</text>

    <rect x="510" y="325" width="200" height="42" rx="6" fill="#ffffff" stroke="${colors.rule}" stroke-width="1" />
    <text x="518" y="342" font-size="11" font-weight="800" fill="${colors.ink}">3. Transfer / Share:</text>
    <text x="518" y="357" font-size="10.5" font-weight="500" fill="${colors.muted}">Shift via insurance / SLAs</text>

    <rect x="510" y="375" width="200" height="42" rx="6" fill="#ffffff" stroke="${colors.rule}" stroke-width="1" />
    <text x="518" y="392" font-size="11" font-weight="800" fill="${colors.ink}">4. Accept:</text>
    <text x="518" y="407" font-size="10.5" font-weight="500" fill="${colors.muted}">Authorize residual risk</text>

    <!-- Arrow 3 -> 4 -->
    ${arrow(720, 291, 740, 291)}

    <!-- Stage 4: Security Controls Execution (x=740, w=220) -->
    <rect x="740" y="125" width="220" height="340" rx="14" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2" />
    <text x="755" y="152" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.teal}">STAGE 4: EXECUTION</text>
    <text x="755" y="174" font-size="15" font-weight="800" fill="${colors.ink}">Security Controls</text>
    <text x="755" y="194" font-size="10.5" font-weight="600" fill="${colors.muted}">(NIST SP 800-53 Rev. 5)</text>
    <line x1="755" y1="206" x2="945" y2="206" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="755" y="226" font-size="11" font-weight="800" fill="${colors.ink}">• Preventive Safeguards:</text>
    <text x="755" y="244" font-size="10.5" font-weight="500" fill="${colors.muted}">  IAM policies, WAF, mTLS</text>
    <text x="755" y="264" font-size="11" font-weight="800" fill="${colors.ink}">• Detective Safeguards:</text>
    <text x="755" y="282" font-size="10.5" font-weight="500" fill="${colors.muted}">  SIEM logging, IDS/IPS audit</text>
    <text x="755" y="302" font-size="11" font-weight="800" fill="${colors.ink}">• Responsive Safeguards:</text>
    <text x="755" y="320" font-size="10.5" font-weight="500" fill="${colors.muted}">  Incident containment</text>
    <text x="755" y="340" font-size="11" font-weight="800" fill="${colors.ink}">• Recovery Safeguards:</text>
    <text x="755" y="358" font-size="10.5" font-weight="500" fill="${colors.muted}">  Backups, DR failover</text>
    <line x1="755" y1="372" x2="945" y2="372" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="755" y="394" font-size="11" font-weight="800" fill="${colors.teal}">LEAVES OUTCOME:</text>
    <text x="755" y="412" font-size="11.5" font-weight="700" fill="${colors.ink}">Residual Risk Requiring a Recorded Response or Decision</text>

    <!-- Arrow 4 -> 5 -->
    ${arrow(960, 295, 980, 295)}

    <!-- Stage 5: Outcome & Monitoring (x=980, w=180) -->
    <rect x="980" y="125" width="180" height="340" rx="14" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="2" />
    <text x="995" y="152" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.green}">STAGE 5: MONITORING</text>
    <text x="995" y="174" font-size="14" font-weight="800" fill="${colors.ink}">Residual Risk &amp; Loop</text>
    <text x="995" y="194" font-size="10.5" font-weight="600" fill="${colors.muted}">(NIST SP 800-137)</text>
    <line x1="995" y1="206" x2="1145" y2="206" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="995" y="228" font-size="11" font-weight="700" fill="${colors.ink}">Continuous Action:</text>
    <text x="995" y="248" font-size="11" font-weight="500" fill="${colors.muted}">• Monitor Control Efficacy</text>
    <text x="995" y="268" font-size="11" font-weight="500" fill="${colors.muted}">• Track New Threat Intel</text>
    <text x="995" y="288" font-size="11" font-weight="500" fill="${colors.muted}">• Audit Env Changes</text>
    <text x="995" y="308" font-size="11" font-weight="500" fill="${colors.muted}">• Re-evaluate Risk</text>
    <line x1="995" y1="324" x2="1145" y2="324" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="995" y="348" font-size="11" font-weight="800" fill="${colors.green}">FEEDBACK LOOP ↺</text>
    <text x="995" y="368" font-size="10.5" font-weight="500" fill="${colors.muted}">Feeds back into Stage 1</text>
    <text x="995" y="386" font-size="10.5" font-weight="500" fill="${colors.muted}">Inputs continuously</text>

    <!-- Bottom Bar: Universal Return Loop (y=485, w=1120) -->
    <rect x="40" y="485" width="1120" height="65" rx="14" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="2" />
    <text x="600" y="512" text-anchor="middle" font-size="12" font-weight="900" letter-spacing="1" fill="${colors.green}">CONTINUOUS RISK MANAGEMENT FEEDBACK LOOP (NIST SP 800-37 / SP 800-137)</text>
    <text x="600" y="534" text-anchor="middle" font-size="11.5" font-weight="600" fill="${colors.ink}">Risk management is NOT a static one-time event ↺ Findings from Stage 5 feed right back into Stage 1 Inputs for continuous reassessment.</text>

    <!-- Clean Vertical Return Loop Arrows -->
    ${arrow(1070, 465, 1070, 485)}
    ${arrow(145, 485, 145, 465)}`;
  write("risk-management-lifecycle.svg", documentSvg("The Continuous Risk Management Lifecycle", "Inputs (Threat Modeling, Scans, Intel) lead to Risk Assessment, 4 Risk Response Strategies (Avoid, Reduce, Transfer, Accept), Security Control Execution, and Continuous Risk Monitoring feedback loop.", 570, body));
}

// Security Program Implementation Roadmap Diagram (SECURITY PROGRAM -> GOVERN -> TECHNICAL)
{
  const body = `
    <!-- Top Card: SECURITY PROGRAM (x=150, y=115, w=900) -->
    <rect x="150" y="115" width="900" height="80" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5" />
    <text x="600" y="140" text-anchor="middle" font-size="11" font-weight="900" letter-spacing="1.5" fill="${colors.blue}">SECURITY PROGRAM &amp; ARCHITECTURE MAP</text>
    <text x="600" y="164" text-anchor="middle" font-size="16" font-weight="800" fill="${colors.ink}">Translating Security Strategy into Operational Execution</text>

    <!-- Arrow Top -> GOVERN -->
    <path d="M 600 195 L 600 235" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>

    <!-- Middle Tier Card: GOVERN (x=150, y=235, w=900) -->
    <rect x="150" y="235" width="900" height="140" rx="16" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5" />
    <text x="180" y="262" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">GOVERNANCE, ISMS &amp; RISK FRAMEWORKS (GOVERN)</text>
    <text x="180" y="285" font-size="15" font-weight="800" fill="${colors.ink}">Enterprise Risk Appetite, ISMS &amp; Regulatory Compliance Mandates</text>
    <line x1="180" y1="298" x2="1020" y2="298" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="180" y="322" font-size="12" font-weight="600" fill="${colors.ink}">• Define Business Context, Scope &amp; Risk Appetite (NIST SP 800-39 / SP 800-37)</text>
    <text x="180" y="342" font-size="12" font-weight="600" fill="${colors.ink}">• Adopt ISMS &amp; Cybersecurity Frameworks (ISO/IEC 27001:2022 / NIST CSF 2.0 / CIS IG1)</text>
    <text x="180" y="362" font-size="12" font-weight="600" fill="${colors.ink}">• Ensure Regulatory &amp; Privacy Mandates (SOC 2 Type II, PCI-DSS v4.0, GDPR, Singapore PDPA)</text>

    <!-- Bi-Directional Connectors Between GOVERN and TECHNICAL (y=375 to y=435) -->
    <!-- Top-Down Arrow (Left: x=450) -->
    <path d="M 450 375 L 450 435" fill="none" stroke="${colors.amber}" stroke-width="3.5" marker-end="url(#arrow-amber)"/>
    <rect x="235" y="393" width="200" height="24" rx="12" fill="#ffffff" stroke="${colors.amber}" stroke-width="1.5"/>
    <text x="335" y="409" text-anchor="middle" font-size="10.5" font-weight="900" fill="${colors.amber}">TOP-DOWN: POLICY &amp; MANDATES ↓</text>

    <!-- Bottom-Up Arrow (Right: x=750) -->
    <path d="M 750 435 L 750 375" fill="none" stroke="${colors.teal}" stroke-width="3.5" marker-end="url(#arrow-teal)"/>
    <rect x="765" y="393" width="200" height="24" rx="12" fill="#ffffff" stroke="${colors.teal}" stroke-width="1.5"/>
    <text x="865" y="409" text-anchor="middle" font-size="10.5" font-weight="900" fill="${colors.teal}">BOTTOM-UP: TELEMETRY &amp; PROOF ↑</text>

    <!-- Bottom Tier Card: TECHNICAL (x=150, y=435, w=900) -->
    <rect x="150" y="435" width="900" height="140" rx="16" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5" />
    <text x="180" y="462" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">TECHNICAL ARCHITECTURE &amp; SAFEGUARDS (TECHNICAL)</text>
    <text x="180" y="485" font-size="15" font-weight="800" fill="${colors.ink}">System Security Engineering, Safeguards &amp; Control Validation</text>
    <line x1="180" y1="498" x2="1020" y2="498" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="180" y="522" font-size="12" font-weight="600" fill="${colors.ink}">• Map Trust Boundaries, Data Flow Diagrams &amp; System Entry Points</text>
    <text x="180" y="542" font-size="12" font-weight="600" fill="${colors.ink}">• Execute Threat Modeling &amp; Misuse Analysis (STRIDE / PASTA / VAST)</text>
    <text x="180" y="562" font-size="12" font-weight="600" fill="${colors.ink}">• Deploy Safeguards (Crypto, OAuth IAM, WAF) &amp; Validate (SAST/DAST/Pentest/SLSA)</text>`;
  write("security-program-implementation-roadmap.svg", documentSvg("Security Program Implementation Pathways", "Operational flow mapping Security Program strategy down into Governance (GOVERN) and Technical Safeguards (TECHNICAL) connected by Top-Down and Bottom-Up operational feedback loops.", 610, body));
}

// Security Objectives & System Properties Matrix Diagram (CIA Triad + Extended Properties -> Safeguards)
{
  const body = `
    <!-- Top CIA Triad Section (x=40, y=115, w=1120) -->
    <!-- Card 1: Confidentiality (x=40, w=355) -->
    <rect x="40" y="115" width="355" height="145" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5" />
    <text x="60" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">CONFIDENTIALITY (NIST FIPS 199)</text>
    <text x="60" y="165" font-size="15" font-weight="800" fill="${colors.ink}">Restricting Unauthorized Disclosure</text>
    <line x1="60" y1="178" x2="375" y2="178" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="200" font-size="11.5" font-weight="600" fill="${colors.ink}">• Enforces authorized access boundaries</text>
    <text x="60" y="220" font-size="11.5" font-weight="500" fill="${colors.muted}">• AES-256-GCM encryption at rest &amp; TLS 1.3</text>

    <!-- Card 2: Integrity (x=422, w=355) -->
    <rect x="422" y="115" width="355" height="145" rx="14" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5" />
    <text x="442" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">INTEGRITY (NIST FIPS 199)</text>
    <text x="442" y="165" font-size="15" font-weight="800" fill="${colors.ink}">Guarding Against State Tampering</text>
    <line x1="442" y1="178" x2="757" y2="178" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="442" y="200" font-size="11.5" font-weight="600" fill="${colors.ink}">• Protects against and detects unauthorized state alteration</text>
    <text x="442" y="220" font-size="11.5" font-weight="500" fill="${colors.muted}">• HMAC-SHA256 &amp; Ed25519 signatures</text>

    <!-- Card 3: Availability (x=805, w=355) -->
    <rect x="805" y="115" width="355" height="145" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5" />
    <text x="825" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">AVAILABILITY (NIST FIPS 199)</text>
    <text x="825" y="165" font-size="15" font-weight="800" fill="${colors.ink}">Ensuring Reliable Access</text>
    <line x1="825" y1="178" x2="1140" y2="178" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="825" y="200" font-size="11.5" font-weight="600" fill="${colors.ink}">• Timely access for authorized identities</text>
    <text x="825" y="220" font-size="11.5" font-weight="500" fill="${colors.muted}">• Redundant failover &amp; DDoS mitigation</text>

    <!-- Middle Extended Properties Section (2x2 Grid: x=40 and x=615, w=545) -->
    <!-- Grid Row 1 Left: Authenticity & Non-Repudiation (x=40, w=545, y=275, h=105) -->
    <rect x="40" y="275" width="545" height="105" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2" />
    <text x="60" y="298" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.violet}">AUTHENTICITY &amp; NON-REPUDIATION</text>
    <text x="60" y="318" font-size="14" font-weight="800" fill="${colors.ink}">Origin Proof &amp; Unforgeable Cryptographic Evidence</text>
    <line x1="60" y1="330" x2="565" y2="330" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="350" font-size="11.5" font-weight="500" fill="${colors.muted}">• PKI Mutual TLS (mTLS), FIDO2 Passkeys / WebAuthn</text>
    <text x="60" y="368" font-size="11.5" font-weight="500" fill="${colors.muted}">• Asymmetric Cryptographic Signatures (Ed25519 / ECDSA)</text>

    <!-- Grid Row 1 Right: Accountability (x=615, w=545, y=275, h=105) -->
    <rect x="615" y="275" width="545" height="105" rx="14" fill="${colors.panel}" stroke="${colors.line}" stroke-width="2" />
    <text x="635" y="298" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.ink}">ACCOUNTABILITY &amp; AUDITING</text>
    <text x="635" y="318" font-size="14" font-weight="800" fill="${colors.ink}">Attributing System Actions to Verified Identity Context</text>
    <line x1="635" y1="330" x2="1140" y2="330" stroke="${colors.line}" stroke-opacity="0.4" stroke-width="1" />
    <text x="635" y="350" font-size="11.5" font-weight="500" fill="${colors.muted}">• Tamper-Evident Audit Logging (NIST SP 800-92)</text>
    <text x="635" y="368" font-size="11.5" font-weight="500" fill="${colors.muted}">• SIEM Event Attribution &amp; Immutable Audit Trails</text>

    <!-- Grid Row 2 Left: Privacy & Minimization (x=40, w=545, y=390, h=105) -->
    <rect x="40" y="390" width="545" height="105" rx="14" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2" />
    <text x="60" y="413" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.red}">PRIVACY &amp; DATA MINIMIZATION</text>
    <text x="60" y="433" font-size="14" font-weight="800" fill="${colors.ink}">Personal Data Processing Limits &amp; Legal Rights</text>
    <line x1="60" y1="445" x2="565" y2="445" stroke="${colors.red}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="465" font-size="11.5" font-weight="500" fill="${colors.muted}">• Data Minimization, Pseudonymization &amp; Consent Management</text>
    <text x="60" y="483" font-size="11.5" font-weight="500" fill="${colors.muted}">• NIST Privacy Framework, ISO/IEC 27701 &amp; GDPR / Singapore PDPA</text>

    <!-- Grid Row 2 Right: Safety & Resilience (x=615, w=545, y=390, h=105) -->
    <rect x="615" y="390" width="545" height="105" rx="14" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="2" />
    <text x="635" y="413" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.green}">SAFETY &amp; SYSTEM RESILIENCE</text>
    <text x="635" y="433" font-size="14" font-weight="800" fill="${colors.ink}">Physical Protection &amp; Sustaining Operations Under Attack</text>
    <line x1="635" y1="445" x2="1140" y2="445" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="635" y="465" font-size="11.5" font-weight="500" fill="${colors.muted}">• Fail-Safe Fault Isolation &amp; Hazard Containment (ISO 26262)</text>
    <text x="635" y="483" font-size="11.5" font-weight="500" fill="${colors.muted}">• System Resilience &amp; Automated Recovery (NIST SP 800-160 Vol. 2)</text>

    <!-- Bottom Bar: Mechanism Alignment (y=505, w=1120, h=45) -->
    <text x="600" y="525" text-anchor="middle" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">TECHNICAL SAFEGUARD ALIGNMENT (NIST SP 800-53 REV. 5)</text>
    <text x="600" y="540" text-anchor="middle" font-size="10.5" font-weight="600" fill="${colors.ink}">Technical mechanisms enforce specific properties. No single mechanism satisfies all objectives in isolation.</text>`;
  write("security-objectives-properties-matrix.svg", documentSvg("Security Objectives & System Properties Matrix", "Architecture mapping the CIA Triad (FIPS 199), Extended Security Properties (Authenticity, Accountability, Privacy, Safety, Resilience), and Technical, Administrative &amp; Physical Safeguards.", 565, body));
}

// Identity & Access Management Architecture Diagram (NIST SP 800-63 & 800-207 Zero Trust)
{
  const body = `
    <!-- Setup Stage: IAL, AAL, FAL (y=115, h=135) -->
    <!-- Card 1: IAL Identity Proofing (x=40, w=355) -->
    <rect x="40" y="115" width="355" height="135" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5" />
    <text x="60" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">1. IDENTITY PROOFING (IAL1 - IAL3)</text>
    <text x="60" y="162" font-size="14" font-weight="800" fill="${colors.ink}">Applicant Identity Verification</text>
    <line x1="60" y1="174" x2="375" y2="174" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="194" font-size="10.5" font-weight="500" fill="${colors.muted}">• Facial biometrics &amp; document proofing (NIST 800-63A)</text>
    <text x="60" y="212" font-size="10.5" font-weight="500" fill="${colors.muted}">• IAL1 (Self-asserted) → IAL2 (Verified) → IAL3 (Biometric)</text>

    <!-- Card 2: AAL Authenticator Binding (x=422, w=355) -->
    <rect x="422" y="115" width="355" height="135" rx="14" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5" />
    <text x="442" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">2. AUTHENTICATOR BINDING (AAL1 - AAL3)</text>
    <text x="442" y="162" font-size="14" font-weight="800" fill="${colors.ink}">Phishing-Resistant Authenticator Pairing</text>
    <line x1="442" y1="174" x2="757" y2="174" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="442" y="194" font-size="10.5" font-weight="500" fill="${colors.muted}">• WebAuthn / FIDO2 Passkeys &amp; PKI Keys (NIST 800-63B)</text>
    <text x="442" y="212" font-size="10.5" font-weight="500" fill="${colors.muted}">• AAL1 (Password) → AAL2 (MFA) → AAL3 (Hardware Key)</text>

    <!-- Card 3: FAL Federation Assurance (x=805, w=355) -->
    <rect x="805" y="115" width="355" height="135" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5" />
    <text x="825" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">3. FEDERATION ASSURANCE (FAL1 - FAL3)</text>
    <text x="825" y="162" font-size="14" font-weight="800" fill="${colors.ink}">Secure Token &amp; Assertion Exchange</text>
    <line x1="825" y1="174" x2="1140" y2="174" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="825" y="194" font-size="10.5" font-weight="500" fill="${colors.muted}">• OpenID Connect (OIDC), OAuth 2.1 &amp; DPoP (NIST 800-63C)</text>
    <text x="825" y="212" font-size="10.5" font-weight="500" fill="${colors.muted}">• FAL1 (Bearer) → FAL2 (Signed) → FAL3 (Holder-Bound)</text>

    <!-- Runtime Stage: Zero Trust PDP / PEP Enforcement (y=265, h=145) -->
    <!-- Card 1: PEP (x=40, w=355) -->
    <rect x="40" y="265" width="355" height="145" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2.5" />
    <text x="60" y="290" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.violet}">4. POLICY ENFORCEMENT POINT (PEP)</text>
    <text x="60" y="312" font-size="14" font-weight="800" fill="${colors.ink}">API Gateway &amp; Ingress Proxy</text>
    <line x1="60" y1="324" x2="375" y2="324" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="344" font-size="10.5" font-weight="500" fill="${colors.muted}">• Intercepts incoming client requests &amp; bearer tokens</text>
    <text x="60" y="362" font-size="10.5" font-weight="500" fill="${colors.muted}">• Extracts mTLS certs, IP &amp; Device context</text>
    <text x="60" y="380" font-size="10.5" font-weight="500" fill="${colors.muted}">• Enforces PDP Allow / Deny decision rules</text>

    <!-- Card 2: PDP Engine (x=422, w=355) -->
    <rect x="422" y="265" width="355" height="145" rx="14" fill="${colors.panel}" stroke="${colors.line}" stroke-width="2.5" />
    <text x="442" y="290" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.ink}">5. POLICY DECISION POINT (PDP)</text>
    <text x="442" y="312" font-size="14" font-weight="800" fill="${colors.ink}">Zero Trust Policy Engine</text>
    <line x1="442" y1="324" x2="757" y2="324" stroke="${colors.line}" stroke-opacity="0.4" stroke-width="1" />
    <text x="442" y="344" font-size="10.5" font-weight="500" fill="${colors.muted}">• Evaluates OPA / Rego &amp; OpenFGA policy rules</text>
    <text x="442" y="362" font-size="10.5" font-weight="500" fill="${colors.muted}">• Evaluates RBAC roles, ABAC attributes &amp; ReBAC</text>
    <text x="442" y="380" font-size="10.5" font-weight="500" fill="${colors.muted}">• NIST SP 800-207 Zero Trust risk scoring</text>

    <!-- Card 3: Protected Resource (x=805, w=355) -->
    <rect x="805" y="265" width="355" height="145" rx="14" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="2.5" />
    <text x="825" y="290" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.green}">6. PROTECTED TARGET RESOURCE</text>
    <text x="825" y="312" font-size="14" font-weight="800" fill="${colors.ink}">Microservice or Data Store</text>
    <line x1="825" y1="324" x2="1140" y2="324" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="825" y="344" font-size="10.5" font-weight="500" fill="${colors.muted}">• Executes authorized application logic</text>
    <text x="825" y="362" font-size="10.5" font-weight="500" fill="${colors.muted}">• Enforces fine-grained field level filters</text>
    <text x="825" y="380" font-size="10.5" font-weight="500" fill="${colors.muted}">• Emits tamper-evident SIEM telemetry</text>

    <!-- Bottom Stage: Revocation & Governance (y=425, h=55) -->
    <!-- Left Box: Revocation (x=40, w=545) -->
    <rect x="40" y="425" width="545" height="55" rx="12" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2" />
    <text x="60" y="445" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.red}">AUTOMATED LIFECYCLE REVOCATION</text>
    <text x="60" y="463" font-size="10.5" font-weight="600" fill="${colors.muted}">• SCIM 2.0 Joiner-Mover-Leaver (JML) &amp; OAuth Revocation (RFC 7009)</text>

    <!-- Right Box: Audit (x=615, w=545) -->
    <rect x="615" y="425" width="545" height="55" rx="12" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2" />
    <text x="635" y="445" font-size="10.5" font-weight="900" letter-spacing="1" fill="${colors.blue}">CROSS-CUTTING AUDIT &amp; ACCOUNTABILITY</text>
    <text x="635" y="463" font-size="10.5" font-weight="600" fill="${colors.muted}">• Structured SIEM Audit Logging &amp; Immutable Hashes (NIST SP 800-92)</text>`;
  write("identity-access-architecture.svg", documentSvg("Identity & Access Management Architecture", "IAM Architecture showing Setup (IAL, AAL, FAL), Zero Trust Runtime Enforcement (PEP/PDP), and Lifecycle Revocation & Audit (NIST SP 800-63 & 800-207).", 500, body));
}

// Trust Boundaries & Threat Modeling DFD Architecture Diagram
{
  const body = `
    <!-- Z-LAYER 1: DOMAIN CONTAINER BOXES -->
    <!-- Domain 1: Untrusted External Zone (x=40, y=115, w=240, h=300) -->
    <rect x="40" y="115" width="240" height="300" rx="14" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2" stroke-dasharray="6 4" />
    <text x="60" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">UNTRUSTED PUBLIC ZONE</text>

    <!-- Domain 2: DMZ Application Gateway Zone (x=380, y=115, w=420, h=300) -->
    <rect x="380" y="115" width="420" height="300" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2" />
    <text x="400" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">DMZ &amp; APPLICATION PROCESSING ZONE</text>

    <!-- Domain 3: Sensitive Data Enclave (x=860, y=115, w=300, h=300) -->
    <rect x="860" y="115" width="300" height="300" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2" />
    <text x="880" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">HIGH-ASSURANCE DATA ENCLAVE</text>

    <!-- Z-LAYER 2: BACKGROUND VERTICAL TRUST BOUNDARY DASHED LINES -->
    <line x1="325" y1="115" x2="325" y2="415" stroke="${colors.red}" stroke-width="2.5" stroke-dasharray="8 6" />
    <line x1="825" y1="115" x2="825" y2="415" stroke="${colors.amber}" stroke-width="2.5" stroke-dasharray="8 6" />

    <!-- Z-LAYER 3: TRUST BOUNDARY TOP HEADER BADGES -->
    <rect x="235" y="103" width="180" height="24" rx="12" fill="#ffffff" stroke="${colors.red}" stroke-width="1.5" />
    <text x="325" y="119" text-anchor="middle" font-size="9.5" font-weight="900" letter-spacing="0.5" fill="${colors.red}">TRUST BOUNDARY 1 (INGRESS)</text>

    <rect x="735" y="103" width="180" height="24" rx="12" fill="#ffffff" stroke="${colors.amber}" stroke-width="1.5" />
    <text x="825" y="119" text-anchor="middle" font-size="9.5" font-weight="900" letter-spacing="0.5" fill="${colors.amber}">TRUST BOUNDARY 2 (ENCLAVE)</text>

    <!-- Z-LAYER 4: PROCESS & DATA CARDS INSIDE DOMAINS -->
    <!-- Card 1: External Entities -->
    <rect x="55" y="165" width="210" height="110" rx="12" fill="#ffffff" stroke="${colors.red}" stroke-width="2" />
    <text x="70" y="190" font-size="11" font-weight="900" fill="${colors.red}">EXTERNAL ENTITIES</text>
    <text x="70" y="210" font-size="13" font-weight="800" fill="${colors.ink}">Public Client / Mobile App</text>
    <line x1="70" y1="220" x2="250" y2="220" stroke="${colors.red}" stroke-opacity="0.3" stroke-width="1" />
    <text x="70" y="240" font-size="11" font-weight="500" fill="${colors.muted}">• Untrusted Browser / SPA</text>
    <text x="70" y="258" font-size="11" font-weight="500" fill="${colors.muted}">• Attacker Controlled Inputs</text>

    <!-- Card 2: Process 1 API Gateway -->
    <rect x="395" y="165" width="390" height="100" rx="12" fill="#ffffff" stroke="${colors.blue}" stroke-width="2" />
    <text x="410" y="190" font-size="11" font-weight="900" fill="${colors.blue}">PROCESS 1: API GATEWAY &amp; PEP</text>
    <text x="410" y="210" font-size="13" font-weight="800" fill="${colors.ink}">OAuth 2.1 Verification &amp; WAF Rate Limiting</text>
    <line x1="410" y1="220" x2="770" y2="220" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="410" y="238" font-size="11" font-weight="500" fill="${colors.muted}">• Validates JWT Bearer Tokens &amp; DPoP Proofs</text>
    <text x="410" y="254" font-size="11" font-weight="500" fill="${colors.muted}">• Sanitizes Input &amp; Blocks Attack Payloads</text>

    <!-- Card 3: Process 2 Payroll Microservice -->
    <rect x="395" y="290" width="390" height="105" rx="12" fill="#ffffff" stroke="${colors.teal}" stroke-width="2" />
    <text x="410" y="313" font-size="11" font-weight="900" fill="${colors.teal}">PROCESS 2: PAYROLL MICROSERVICE</text>
    <text x="410" y="333" font-size="13" font-weight="800" fill="${colors.ink}">Business Logic &amp; Fine-Grained Authorization</text>
    <line x1="410" y1="342" x2="770" y2="342" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="410" y="360" font-size="11" font-weight="500" fill="${colors.muted}">• ABAC / OPA Policy Evaluation Engine</text>
    <text x="410" y="378" font-size="11" font-weight="500" fill="${colors.muted}">• Enforces SPIFFE Workload mTLS Identity</text>

    <!-- Card 4: Data Store Payroll DB -->
    <rect x="875" y="165" width="270" height="105" rx="12" fill="#ffffff" stroke="${colors.amber}" stroke-width="2" />
    <text x="890" y="190" font-size="11" font-weight="900" fill="${colors.amber}">DATA STORE: PAYROLL DB</text>
    <text x="890" y="210" font-size="13" font-weight="800" fill="${colors.ink}">Encrypted Database</text>
    <line x1="890" y1="220" x2="1130" y2="220" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="890" y="238" font-size="11" font-weight="500" fill="${colors.muted}">• AES-256-GCM Column Encryption</text>
    <text x="890" y="254" font-size="11" font-weight="500" fill="${colors.muted}">• KMS IAM Key Policy Enforcement</text>

    <!-- Card 5: External Service Bank API -->
    <rect x="875" y="285" width="270" height="110" rx="12" fill="#ffffff" stroke="${colors.violet}" stroke-width="2" />
    <text x="890" y="308" font-size="11" font-weight="900" fill="${colors.violet}">EXTERNAL SERVICE: BANK API</text>
    <text x="890" y="328" font-size="13" font-weight="800" fill="${colors.ink}">Payment Gateway</text>
    <line x1="890" y1="338" x2="1130" y2="338" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />
    <text x="890" y="356" font-size="11" font-weight="500" fill="${colors.muted}">• mTLS Payment Execution</text>
    <text x="890" y="374" font-size="11" font-weight="500" fill="${colors.muted}">• Signed Request Assertions</text>

    <!-- Z-LAYER 5: FLOW ARROWS AND WHITE TRANSPORT BADGES (FOREGROUND) -->
    <!-- Arrow 1: Untrusted to Gateway (x=265 to x=395 at y=215) -->
    <path d="M 265 215 L 395 215" fill="none" stroke="${colors.red}" stroke-width="3" marker-end="url(#arrow-red)"/>
    <rect x="295" y="190" width="60" height="20" rx="10" fill="#ffffff" stroke="${colors.red}" stroke-width="1.5"/>
    <text x="325" y="204" text-anchor="middle" font-size="9" font-weight="900" fill="${colors.red}">TLS 1.3</text>

    <!-- Flow Arrow 2: Gateway to Microservice (x=590, y=265 to y=290) -->
    <path d="M 590 265 L 590 290" fill="none" stroke="${colors.blue}" stroke-width="3" marker-end="url(#arrow-blue)"/>

    <!-- Arrow 3: Microservice to Database (x=785 to x=875 at y=342) -->
    <path d="M 785 342 L 875 342" fill="none" stroke="${colors.amber}" stroke-width="3" marker-end="url(#arrow-amber)"/>
    <rect x="800" y="317" width="50" height="20" rx="10" fill="#ffffff" stroke="${colors.amber}" stroke-width="1.5"/>
    <text x="825" y="331" text-anchor="middle" font-size="9" font-weight="900" fill="${colors.amber}">mTLS</text>

    <!-- Z-LAYER 6: STRIDE SUMMARY FOOTER BAR -->
    <rect x="40" y="430" width="1120" height="55" rx="12" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2" />
    <text x="600" y="466" text-anchor="middle" font-size="10.5" font-weight="600" fill="${colors.ink}">External Entity: Spoofing &amp; Repudiation   •   Process: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation</text>
    <text x="600" y="480" text-anchor="middle" font-size="10" font-weight="500" fill="${colors.muted}">Data Store: Tampering, Repudiation, Info Disclosure, DoS   •   Data Flow: Tampering, Info Disclosure, DoS</text>`;
  write("trust-boundaries-threat-modeling.svg", documentSvg("Trust Boundaries & Threat Modeling DFD Architecture", "System Data Flow Diagram (DFD) showing External Untrusted Public Zone, DMZ Application Zone, High-Assurance Data Enclave, Trust Boundaries 1 & 2, and STRIDE per Element Mapping.", 510, body));
}

// Threats, Vulnerabilities & Risk Architecture Diagram (NIST SP 800-30 & 800-39)
{
  const body = `
    <!-- Top Stage: Threat & Vulnerability Evaluation Pipeline (y=115, h=135) -->
    <!-- Card 1: Threat Source & Event (x=40, w=355) -->
    <rect x="40" y="115" width="355" height="135" rx="14" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5" />
    <text x="60" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">1. THREAT SOURCE &amp; EVENT (NIST 800-30)</text>
    <text x="60" y="165" font-size="14" font-weight="800" fill="${colors.ink}">Adversary Vector &amp; Capability</text>
    <line x1="60" y1="176" x2="375" y2="176" stroke="${colors.red}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="196" font-size="11.5" font-weight="500" fill="${colors.muted}">• Threat Source: Nation-state, criminal, insider, bug</text>
    <text x="60" y="214" font-size="11.5" font-weight="500" fill="${colors.muted}">• Threat Event: SQLi, Ransomware, DDoS, Exploitation</text>

    <!-- Card 2: Vulnerability Exposure (x=422, w=355) -->
    <rect x="422" y="115" width="355" height="135" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2.5" />
    <text x="442" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">2. VULNERABILITY EXPOSURE (CVSS &amp; EPSS)</text>
    <text x="442" y="165" font-size="14" font-weight="800" fill="${colors.ink}">Flaw Reachability &amp; Exploitability</text>
    <line x1="442" y1="176" x2="757" y2="176" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="442" y="196" font-size="11.5" font-weight="500" fill="${colors.muted}">• CVSS v4.0 Severity Score &amp; EPSS Exploit Probability</text>
    <text x="442" y="214" font-size="11.5" font-weight="500" fill="${colors.muted}">• CISA Known Exploited Vulnerabilities (KEV) Catalog</text>

    <!-- Card 3: Risk Evaluation Engine (x=805, w=355) -->
    <rect x="805" y="115" width="355" height="135" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5" />
    <text x="825" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">3. RISK EVALUATION (NIST 800-39 / FAIR)</text>
    <text x="825" y="165" font-size="14" font-weight="800" fill="${colors.ink}">Risk Exposure = Likelihood × Impact</text>
    <line x1="825" y1="176" x2="1140" y2="176" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="825" y="196" font-size="11.5" font-weight="500" fill="${colors.muted}">• Qualitative (Low/Med/High) &amp; Quantitative Loss ($)</text>
    <text x="825" y="214" font-size="11.5" font-weight="500" fill="${colors.muted}">• Control effectiveness and context considered</text>

    <!-- Middle Stage: Risk Response Strategies (y=265, h=145) -->
    <!-- Option 1: Avoid (x=40, w=260) -->
    <rect x="40" y="265" width="260" height="145" rx="14" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2" />
    <text x="55" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">1. AVOID</text>
    <text x="55" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Eliminate Risk Vector</text>
    <line x1="55" y1="326" x2="285" y2="326" stroke="${colors.red}" stroke-opacity="0.3" stroke-width="1" />
    <text x="55" y="346" font-size="11" font-weight="500" fill="${colors.muted}">Terminating vulnerable features</text>
    <text x="55" y="364" font-size="11" font-weight="500" fill="${colors.muted}">or deprecating legacy protocols.</text>

    <!-- Option 2: Reduce (x=327, w=260) -->
    <rect x="327" y="265" width="260" height="145" rx="14" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2" />
    <text x="342" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">2. REDUCE (MITIGATE)</text>
    <text x="342" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Deploy Technical Controls</text>
    <line x1="342" y1="326" x2="572" y2="326" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="342" y="346" font-size="11" font-weight="500" fill="${colors.muted}">NIST SP 800-53 controls,</text>
    <text x="342" y="364" font-size="11" font-weight="500" fill="${colors.muted}">mTLS &amp; WebAuthn MFA.</text>

    <!-- Option 3: Transfer (x=614, w=260) -->
    <rect x="614" y="265" width="260" height="145" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2" />
    <text x="629" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.violet}">3. TRANSFER (SHARE)</text>
    <text x="629" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Shift Financial Exposure</text>
    <line x1="629" y1="326" x2="859" y2="326" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />
    <text x="629" y="346" font-size="11" font-weight="500" fill="${colors.muted}">Cybersecurity insurance policies</text>
    <text x="629" y="364" font-size="11" font-weight="500" fill="${colors.muted}">and managed cloud SLAs.</text>

    <!-- Option 4: Accept (x=901, w=259) -->
    <rect x="901" y="265" width="259" height="145" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2" />
    <text x="916" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">4. ACCEPT</text>
    <text x="916" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Formal Residual Approval</text>
    <line x1="916" y1="326" x2="1145" y2="326" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="916" y="346" font-size="11" font-weight="500" fill="${colors.muted}">Executive risk owner sign-off</text>
    <text x="916" y="364" font-size="11" font-weight="500" fill="${colors.muted}">for accepted residual risk.</text>

    <!-- Bottom Stage: Residual Risk Governance (y=425, h=50) -->
    <rect x="40" y="425" width="1120" height="50" rx="12" fill="${colors.panel}" stroke="${colors.line}" stroke-width="2" />
    <text x="600" y="446" text-anchor="middle" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.ink}">RESIDUAL RISK GOVERNANCE &amp; CONTINUOUS MONITORING (NIST SP 800-137)</text>
    <text x="600" y="462" text-anchor="middle" font-size="10.5" font-weight="600" fill="${colors.muted}">Residual Risk = Assess Exposure → Execute Response Strategy → Executive Sign-Off → Re-Evaluate on System Architecture Trigger</text>`;
  write("risk-fundamentals-engine.svg", documentSvg("Threats, Vulnerabilities & Risk Engine", "Risk Management Architecture showing Threat Event Evaluation (NIST SP 800-30), CVSS/EPSS Vulnerability Scoring, Risk Response Options (NIST SP 800-39), and Residual Risk Governance.", 500, body));
}

// Threat Frameworks Architecture Diagram
{
  const body = `
    <!-- Top Section: Design-Time Threat Modeling Frameworks (y=115, h=135) -->
    <!-- Card 1: STRIDE & DFD (x=40, w=355) -->
    <rect x="40" y="115" width="355" height="135" rx="14" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="2.5" />
    <text x="60" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.red}">DESIGN-TIME: STRIDE &amp; DFD MAPPING</text>
    <text x="60" y="165" font-size="14" font-weight="800" fill="${colors.ink}">Developer-Centric Threat Taxonomy</text>
    <line x1="60" y1="176" x2="375" y2="176" stroke="${colors.red}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="196" font-size="11.5" font-weight="500" fill="${colors.muted}">• 6 Categories: Spoofing, Tampering, Repudiation,</text>
    <text x="60" y="214" font-size="11.5" font-weight="500" fill="${colors.muted}">  Info Disclosure, DoS, Elevation of Privilege</text>

    <!-- Card 2: PASTA & VAST (x=422, w=355) -->
    <rect x="422" y="115" width="355" height="135" rx="14" fill="${colors.tealFill}" stroke="${colors.teal}" stroke-width="2.5" />
    <text x="442" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.teal}">DESIGN-TIME: PASTA &amp; VAST METHODOLOGIES</text>
    <text x="442" y="165" font-size="14" font-weight="800" fill="${colors.ink}">Risk-Centric &amp; Agile DevSecOps</text>
    <line x1="442" y1="176" x2="757" y2="176" stroke="${colors.teal}" stroke-opacity="0.3" stroke-width="1" />
    <text x="442" y="196" font-size="11.5" font-weight="500" fill="${colors.muted}">• PASTA: 7-stage business impact risk alignment</text>
    <text x="442" y="214" font-size="11.5" font-weight="500" fill="${colors.muted}">• VAST: Automated DevSecOps CI/CD storyboarding</text>

    <!-- Card 3: OWASP 4-Questions (x=805, w=355) -->
    <rect x="805" y="115" width="355" height="135" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2.5" />
    <text x="825" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">DESIGN-TIME: OWASP 4-QUESTION ENGINE</text>
    <text x="825" y="165" font-size="14" font-weight="800" fill="${colors.ink}">Continuous Sprint Review Engine</text>
    <line x1="825" y1="176" x2="1140" y2="176" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="825" y="196" font-size="11.5" font-weight="500" fill="${colors.muted}">• 1. Model $\rightarrow$ 2. Threats $\rightarrow$ 3. Controls $\rightarrow$ 4. Audit</text>
    <text x="825" y="214" font-size="11.5" font-weight="500" fill="${colors.muted}">• Universal meta-process across engineering teams</text>

    <!-- Middle Section: Runtime & Operational Threat Intel (y=265, h=145) -->
    <!-- Card 1: Cyber Kill Chain (x=40, w=355) -->
    <rect x="40" y="265" width="355" height="145" rx="14" fill="${colors.violetFill}" stroke="${colors.violet}" stroke-width="2" />
    <text x="60" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.violet}">RUNTIME: CYBER KILL CHAIN (7 STAGES)</text>
    <text x="60" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Linear Intrusion Lifecycle</text>
    <line x1="60" y1="326" x2="375" y2="326" stroke="${colors.violet}" stroke-opacity="0.3" stroke-width="1" />
    <text x="60" y="346" font-size="11" font-weight="500" fill="${colors.muted}">Recon $\rightarrow$ Weaponize $\rightarrow$ Deliver $\rightarrow$ Exploit</text>
    <text x="60" y="364" font-size="11" font-weight="500" fill="${colors.muted}">$\rightarrow$ Install $\rightarrow$ C2 $\rightarrow$ Actions on Objectives</text>

    <!-- Card 2: Diamond Model (x=422, w=355) -->
    <rect x="422" y="265" width="355" height="145" rx="14" fill="${colors.amberFill}" stroke="${colors.amber}" stroke-width="2" />
    <text x="442" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.amber}">RUNTIME: DIAMOND MODEL (PIVOTING)</text>
    <text x="442" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Adversary Attribution Matrix</text>
    <line x1="442" y1="326" x2="757" y2="326" stroke="${colors.amber}" stroke-opacity="0.3" stroke-width="1" />
    <text x="442" y="346" font-size="11" font-weight="500" fill="${colors.muted}">Connects 4 Pivoting Vertices:</text>
    <text x="442" y="364" font-size="11" font-weight="500" fill="${colors.muted}">Adversary $\leftrightarrow$ Capability $\leftrightarrow$ Infrastructure $\leftrightarrow$ Victim</text>

    <!-- Card 3: MITRE ATT&CK & D3FEND (x=805, w=355) -->
    <rect x="805" y="265" width="355" height="145" rx="14" fill="${colors.blueFill}" stroke="${colors.blue}" stroke-width="2" />
    <text x="825" y="292" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.blue}">RUNTIME: MITRE ATT&amp;CK &amp; D3FEND</text>
    <text x="825" y="315" font-size="13" font-weight="800" fill="${colors.ink}">Non-Linear TTP Knowledge Base</text>
    <line x1="825" y1="326" x2="1140" y2="326" stroke="${colors.blue}" stroke-opacity="0.3" stroke-width="1" />
    <text x="825" y="346" font-size="11" font-weight="500" fill="${colors.muted}">• ATT&amp;CK: 15 Tactics &amp; 600+ TTPs (Offensive)</text>
    <text x="825" y="364" font-size="11" font-weight="500" fill="${colors.muted}">• D3FEND: Model, Harden, Detect, Isolate (Defensive)</text>

    <!-- Bottom Stage: Threat Framework Taxonomy Summary (y=425, h=50) -->
    <rect x="40" y="425" width="1120" height="50" rx="12" fill="${colors.panel}" stroke="${colors.line}" stroke-width="2" />
    <text x="600" y="446" text-anchor="middle" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.ink}">THREAT FRAMEWORK ARCHITECTURE TAXONOMY</text>
    <text x="600" y="462" text-anchor="middle" font-size="10.5" font-weight="600" fill="${colors.muted}">Design-Time Threat Modeling (STRIDE/PASTA/VAST/OCTAVE) $\longleftrightarrow$ Operational Intrusion Intel (Kill Chain / Diamond / MITRE ATT&amp;CK &amp; D3FEND)</text>`;
  write("threat-frameworks-architecture.svg", documentSvg("Threat Frameworks Architecture", "Threat Frameworks Architecture showing Design-Time Threat Modeling (STRIDE, PASTA, VAST, OCTAVE, OWASP 4-Question) and Operational Intrusion Intelligence (Cyber Kill Chain, Diamond Model, MITRE ATT&CK & D3FEND).", 500, body));
}

// Defense in Depth vs Duplicate Control Architecture Diagram (NIST SP 800-53 & SP 800-160)
{
  const body = `
    <!-- PANEL 1: TRUE DEFENSE IN DEPTH (y=110, h=185) -->
    <rect x="40" y="110" width="1120" height="185" rx="14" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="2.5" />
    <text x="60" y="135" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.green}">TRUE DEFENSE IN DEPTH: DIVERSE COMPLEMENTARY SAFEGUARDS</text>
    <text x="60" y="155" font-size="13" font-weight="800" fill="${colors.ink}">Largely Independent Failure Modes Across Distinct Boundaries</text>

    <!-- Box 1: Network Gate (x=60, y=172, w=245, h=105) -->
    <rect x="60" y="172" width="245" height="105" rx="10" fill="#ffffff" stroke="${colors.green}" stroke-width="1.5" />
    <text x="75" y="195" font-size="10.5" font-weight="900" fill="${colors.green}">1. NETWORK GATE (mTLS)</text>
    <text x="75" y="213" font-size="12" font-weight="800" fill="${colors.ink}">Identity Verification</text>
    <line x1="75" y1="222" x2="290" y2="222" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="75" y="240" font-size="10" font-weight="500" fill="${colors.muted}">• Client Certificate Auth</text>
    <text x="75" y="256" font-size="10" font-weight="500" fill="${colors.muted}">• Authenticated &amp; Encrypted Transport</text>

    <!-- Arrow 1->2 -->
    <path d="M 305 224 L 330 224" fill="none" stroke="${colors.green}" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

    <!-- Box 2: Ingress Gate (x=330, y=172, w=245, h=105) -->
    <rect x="330" y="172" width="245" height="105" rx="10" fill="#ffffff" stroke="${colors.green}" stroke-width="1.5" />
    <text x="345" y="195" font-size="10.5" font-weight="900" fill="${colors.green}">2. INGRESS GATE (WAF)</text>
    <text x="345" y="213" font-size="12" font-weight="800" fill="${colors.ink}">Payload Filtering</text>
    <line x1="345" y1="222" x2="560" y2="222" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="345" y="240" font-size="10" font-weight="500" fill="${colors.muted}">• Parameter Validation</text>
    <text x="345" y="256" font-size="10" font-weight="500" fill="${colors.muted}">• OWASP Rule Checks</text>

    <!-- Arrow 2->3 -->
    <path d="M 575 224 L 600 224" fill="none" stroke="${colors.green}" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

    <!-- Box 3: Application Gate (x=600, y=172, w=245, h=105) -->
    <rect x="600" y="172" width="245" height="105" rx="10" fill="#ffffff" stroke="${colors.green}" stroke-width="1.5" />
    <text x="615" y="195" font-size="10.5" font-weight="900" fill="${colors.green}">3. CODE GATE (RUNTIME CHECKS)</text>
    <text x="615" y="213" font-size="12" font-weight="800" fill="${colors.ink}">Query Safety &amp; Authorization</text>
    <line x1="615" y1="222" x2="830" y2="222" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="615" y="240" font-size="10" font-weight="500" fill="${colors.muted}">• Parameterized SQL Queries</text>
    <text x="615" y="256" font-size="10" font-weight="500" fill="${colors.muted}">• Rego Policy Enforcement</text>

    <!-- Arrow 3->4 -->
    <path d="M 845 224 L 870 224" fill="none" stroke="${colors.green}" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow-teal)"/>

    <!-- Box 4: Storage Protection (x=870, y=172, w=270, h=105) -->
    <rect x="870" y="172" width="270" height="105" rx="10" fill="#ffffff" stroke="${colors.green}" stroke-width="1.5" />
    <text x="885" y="195" font-size="9.5" font-weight="900" fill="${colors.green}">STORAGE PROTECTION — SEPARATE THREAT</text>
    <text x="885" y="213" font-size="12" font-weight="800" fill="${colors.ink}">Data-at-Rest Encryption</text>
    <line x1="885" y1="222" x2="1125" y2="222" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="885" y="240" font-size="10" font-weight="500" fill="${colors.muted}">• AES-256 Envelope Keys</text>
    <text x="885" y="256" font-size="10" font-weight="500" fill="${colors.muted}">• Does not narrow the Gates 1–3 attack path</text>

    <!-- PANEL 2: INGESTION POINT LAYERING VS DUPLICATE ANTI-PATTERN (y=310, h=175) -->
    <rect x="40" y="310" width="1120" height="175" rx="14" fill="${colors.panel}" stroke="${colors.line}" stroke-width="2.5" />
    <text x="60" y="335" font-size="11" font-weight="900" letter-spacing="1" fill="${colors.ink}">INGESTION POINT LAYERING VS SINGLE-BOUNDARY DUPLICATE ANTI-PATTERN</text>
    <text x="60" y="355" font-size="12.5" font-weight="600" fill="${colors.muted}">Journal working model, informed by NIST SP 800-160 resilience principles</text>

    <!-- Box 1: Single Boundary Duplicate Anti-Pattern (x=60, y=372, w=520, h=95) -->
    <rect x="60" y="372" width="520" height="95" rx="10" fill="${colors.redFill}" stroke="${colors.red}" stroke-width="1.5" />
    <text x="75" y="395" font-size="10.5" font-weight="900" fill="${colors.red}">SINGLE-BOUNDARY DUPLICATE ANTI-PATTERN</text>
    <text x="75" y="413" font-size="12" font-weight="800" fill="${colors.ink}">Dual Stacked WAF Regex Engines at Same API Gateway Ingress</text>
    <line x1="75" y1="422" x2="565" y2="422" stroke="${colors.red}" stroke-opacity="0.3" stroke-width="1" />
    <text x="75" y="440" font-size="10" font-weight="500" fill="${colors.muted}">• Stacked Vendor A + Vendor B WAFs on same proxy checking identical HTTP headers</text>
    <text x="75" y="454" font-size="10" font-weight="600" fill="${colors.red}">• Failure Mode: shared parsing behavior can create correlated bypass risk</text>

    <!-- Box 2: Valid Ingestion Point Layering (x=600, y=372, w=540, h=95) -->
    <rect x="600" y="372" width="540" height="95" rx="10" fill="${colors.greenFill}" stroke="${colors.green}" stroke-width="1.5" />
    <text x="615" y="395" font-size="10.5" font-weight="900" fill="${colors.green}">VALID INGESTION POINT LAYERING (MULTI-BOUNDARY)</text>
    <text x="615" y="413" font-size="12" font-weight="800" fill="${colors.ink}">API Gateway WAF (Web) + Kafka Consumer Sidecar (Internal Queue)</text>
    <line x1="615" y1="422" x2="1125" y2="422" stroke="${colors.green}" stroke-opacity="0.3" stroke-width="1" />
    <text x="615" y="440" font-size="10" font-weight="500" fill="${colors.muted}">• Gateway WAF checks public web API payloads; Kafka Sidecar checks internal event streams</text>
    <text x="615" y="454" font-size="10" font-weight="600" fill="${colors.green}">• Architectural Merit: Protects public HTTP ingress AND internal queue lateral vectors</text>`;
  write("defense-in-depth-architecture.svg", documentSvg("Defense in Depth vs Duplicate Control Architecture", "Architecture mapping True Defense-in-Depth (Diverse Complementary Gates), Valid Ingestion Point Layering across boundaries, versus Single-Boundary Duplicate Anti-Patterns.", 500, body));
}

console.log("Generated journal SVG diagrams in assets/img");







