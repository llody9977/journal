---
title: Key Exchange & Key Derivation (KDF)
description: Diffie-Hellman key exchange mechanics, Ephemeral ECDH (X25519), Perfect Forward Secrecy (PFS), HKDF extract-and-expand pipeline, and post-quantum KEMs.
permalink: /topics/key-exchange-derivation/
last_verified: 2026-08-11
---

<span class="eyebrow">Cryptography / Concepts</span>

# Key Exchange & Key Derivation (KDF)

<p class="lede">Key exchange protocols allow two communicating endpoints to establish a matching secret key over an untrusted, eavesdropped channel without transmitting the key itself. Key Derivation Functions (KDF) take high-entropy shared secrets or master secrets and deterministically expand them into cryptographically independent sub-keys for encryption, authentication, and IV generation.</p>

## Diffie-Hellman Key Exchange (DH & ECDH)

Standardized by Whitfield Diffie and Martin Hellman, Diffie-Hellman leverages the discrete logarithm problem. Endpoint A and Endpoint B agree on shared public domain parameters **g** and **p** (typically pre-established or drawn from a standardized group, not generated fresh per session), then each compute and exchange a public value derived from them — **A = g<sup>a</sup> mod p** and **B = g<sup>b</sup> mod p** — combining the received value with their own private exponent to arrive at the exact same shared secret **S**:

**S = g^(ab) mod p**

<div class="diagram-frame">
  <img src="{{ '/assets/img/diffie-hellman.svg' | relative_url }}" alt="Diffie-Hellman public key exchange diagram between Alice and Bob deriving a shared secret S.">
  <p class="diagram-caption">Diffie-Hellman public exchange: private keys (a, b) remain secret while shared secret S is derived</p>
</div>

### Intuitive Layman Model: The Paint Mixing Analogy

To understand how two computers arrive at the exact same secret key without ever sending the key over the wire, consider the **Paint Mixing Analogy**:

1. **Public Base Color**: Client and Server agree in the open on a starting color (**Yellow**). Eavesdroppers see Yellow too.
2. **Private Secret Colors**: Client secretly picks **Red** (keeps in Client RAM). Server secretly picks **Blue** (keeps in Server RAM).
3. **Public Mixture Exchange**:
   - Client mixes **Red + Yellow → Orange** and sends Orange across the wire.
   - Server mixes **Blue + Yellow → Green** and sends Green across the wire.
   - Eavesdroppers see Orange and Green crossing the wire, but because *un-mixing paint is computationally infeasible in practice* (the analogy stands in for the discrete-log problem, which is not proven mathematically impossible to solve — just believed intractable with known algorithms and realistic hardware), they cannot deduce Red or Blue.
4. **Independent Final Mix**:
   - Client mixes received Green (Yellow + Blue) + secret **Red → Brown**.
   - Server mixes received Orange (Yellow + Red) + secret **Blue → Brown**.
5. **Identical Secret Key Result**: Both endpoints arrive at the exact same secret color (**Brown**). The secret key (**Brown**) was **never transmitted over the network**.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Software Execution Flow</div>
  <div>
    <strong>How Software Handshakes Execute Without Transmitting Keys</strong>
    <p>A common point of confusion is asking <em>"how does the secret key get passed to the client?"</em></p>
    <p><strong>The secret key is NEVER transmitted across the network.</strong> Neither endpoint sends the secret key. Instead, both software engines exchange public values (key shares) derived from previously agreed-upon domain parameters, and compute the same shared secret <strong>independently in CPU RAM</strong>:</p>
    <ol>
      <li><strong>Client Exchange (`ClientHello`)</strong>: Client's crypto engine generates an ephemeral private key <strong>a</strong> in RAM and sends public key <b>A = a × G</b> over the wire.</li>
      <li><strong>Server Exchange (`ServerHello`)</strong>: Server's crypto engine generates an ephemeral private key <strong>b</strong> in RAM and sends public key <b>B = b × G</b> over the wire.</li>
      <li><strong>Independent Local Calculation</strong>:
        <ul>
          <li>Browser calculates: <b>S = a × B = a × (b × G) = a × b × G</b></li>
          <li>Server calculates: <b>S = b × A = b × (a × G) = a × b × G</b></li>
        </ul>
      </li>
      <li><strong>Identical Shared Secret &amp; Memory Purge</strong>: Both sides arrive at the exact same shared secret <b>S</b>. Neither side uses <b>S</b> directly as a key — each passes it through HKDF (RFC 5869) to derive the actual AES traffic key (e.g. <code>0x8f3a91b2...</code>) and IVs. TLS implementations are expected to wipe ephemeral keys from RAM once the session closes, but this is an implementation requirement, not a property the protocol itself guarantees — a buggy or negligent implementation that fails to erase the secret leaves it recoverable from memory even after the session ends.</li>
    </ol>
  </div>
</div>

### Elliptic Curve Diffie-Hellman (ECDH / X25519)

Modern protocols replace finite-field Diffie-Hellman with **Elliptic Curve Diffie-Hellman (ECDH)** over Curve25519 (**X25519 / [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)**) or NIST P-256:
- **Smaller Public Keys**: 32-byte (256-bit) public keys provide 128-bit security, compared to 3072-bit modular prime groups in finite-field DH.
- **Fast Execution**: Meaningfully faster scalar multiplication than equivalent-security finite-field DH — the precise speedup depends on implementation and hardware, so benchmark your target platform rather than treating any fixed multiplier as universal. Curve25519 (X25519) was specifically designed so that constant-time, complete-formula arithmetic is straightforward to implement correctly; NIST P-256 can also be implemented in constant time, but its formulas historically made that easier to get wrong, and constant-time-ness is ultimately a property of a given implementation, not a guarantee either curve provides automatically.


## Key Establishment Taxonomy: Agreement vs. Transport vs. KEM Encapsulation

"How do two parties end up with a shared key?" covers three distinct mechanisms that this page (and the Asymmetric Cryptography and PQC pages) otherwise use somewhat interchangeably. They differ in who generates the secret and what a private-key compromise exposes:

| Mechanism | Who Generates the Secret | Private-Key Compromise Exposes | Examples |
|---|---|---|---|
| **Key Agreement** | Neither party alone — both sides' independent contributions combine into a secret neither could compute without the other's input | Nothing retroactively, *if* the contributions were ephemeral (freshly generated per session, then discarded) — this is what makes forward secrecy possible | Diffie-Hellman, ECDH/X25519 (as described above) |
| **Key Transport** | The sender — it generates the session key itself and encrypts (transports) it directly under the recipient's long-term public key | Every session key ever transported under that public key, including past ones — a leaked long-term private key retroactively decrypts recorded traffic (this is exactly the "Static Key Exchange" row in the PFS table below) | Static RSA key transport (e.g., classic TLS RSA cipher suites, now prohibited in TLS 1.3) |
| **KEM Encapsulation** | The encapsulating party — it uses the recipient's public key to produce both a ciphertext and a shared secret in one step; the recipient recovers the same secret via decapsulation | Depends entirely on whether the KEM keypair itself was ephemeral or long-term — a KEM used with a freshly generated keypair per session behaves like agreement for forward-secrecy purposes; one used with a static keypair behaves like transport | ML-KEM (FIPS 203), the hybrid X25519MLKEM768 group's ML-KEM component (see the Post-Quantum Cryptography page) |

The recurring confusion across this section is treating all three as interchangeable "key exchange." They aren't: agreement and (ephemeral) KEM encapsulation both support forward secrecy; transport and (static) KEM encapsulation don't. Whether a given key-establishment step provides forward secrecy is a property of *how the keys involved are generated and reused*, not of which mathematical primitive (DH, RSA, lattice-based KEM) is doing the underlying work.

## Authenticated Key Exchange & MITM Prevention

Unauthenticated Diffie-Hellman (Anonymous DH/ECDH) provides confidentiality against passive eavesdroppers, but is **fundamentally vulnerable to active Man-in-the-Middle (MITM) attacks**. An active adversary intercepting the network connection can negotiate independent shared secrets with both parties, decrypting and re-encrypting all traffic transparently.

When peer identity and active-MITM resistance are security objectives — as they are for essentially all internet-facing key exchange — the exchange must be authenticated to prevent MITM key substitution. (Anonymous or opportunistic DH, which deliberately forgoes this, has narrower legitimate uses, like defending only against passive eavesdroppers where authentication infrastructure isn't available.) The common authentication mechanisms:
- **Digital Signatures (TLS 1.3)**: TLS 1.3 does not simply sign the ephemeral ECDH key share in isolation; `CertificateVerify` signs the complete handshake transcript, which includes and therefore cryptographically binds the exchanged key shares per [RFC 9846](https://www.rfc-editor.org/info/rfc9846/) bound to a verified X.509 certificate (`RSA-PSS`, `ECDSA`, or `Ed25519`, per the negotiated `signature_algorithms`).
- **Pre-Shared Keys (PSK)**: Both parties share a pre-configured high-entropy secret used to authenticate the key exchange.
- **Mutual TLS (mTLS)**: Both client and server present X.509 certificates and verify digital signatures over the handshake transcript.

Furthermore, raw Diffie–Hellman produces a shared-secret value, not a ready-to-use key. Applications should pass that value through a protocol-defined Key Derivation Function (**HKDF / RFC 5869**) to derive independent, context-bound traffic keys rather than using it directly as an AEAD key.

## Password-Authenticated Key Exchange (PAKE)

The PSK row above assumes a **high-entropy** pre-shared secret — one an offline brute-force search can't feasibly enumerate. A low-entropy human password doesn't meet that bar, and using one as an ordinary PSK is dangerous: anyone who observes the exchange (or compromises a party that verifies it insecurely) can run an offline dictionary attack against the password itself. **PAKE (Password-Authenticated Key Exchange)** protocols exist specifically to let two parties establish an authenticated shared key from a low-entropy password *without* exposing it to that kind of offline attack — an eavesdropper who records the entire exchange still can't do better than the online guessing rate the server itself can rate-limit.

- **Symmetric vs. augmented PAKE**: In a **symmetric (balanced) PAKE**, both sides hold the same password-derived secret directly — appropriate when both endpoints are equally trusted with the password (e.g., two peers establishing a shared session from a common passphrase). In an **augmented (asymmetric) PAKE**, the client holds the password but the server holds only a derived **registration record** — never the password itself, and not something from which the password can be directly recovered — so a server-side data breach doesn't hand the attacker a password-equivalent secret usable to impersonate the client elsewhere.
- **Resistance to offline guessing**: A PAKE's core security property is that the protocol transcript an eavesdropper observes gives no information usable for offline password guessing — every guess an attacker makes has to be checked interactively against the live server (which can rate-limit or lock out repeated failures), not verified silently against captured data. This is the property an ordinary PSK-authenticated exchange or a password sent over TLS and checked server-side does *not* provide on its own for the stored credential.
- **Server registration records**: For an augmented PAKE, the server-side record is deliberately not the password and not a simple salted hash of it. The compromised record by itself is not a directly reusable credential against a *different* server (a property plain salted-hash password storage, discussed on the Password Storage page, doesn't provide) — but that's narrower protection than it sounds, for two reasons. First, [RFC 9807 itself is explicit](https://www.rfc-editor.org/rfc/rfc9807.html) that offline dictionary attacks are not eliminated by OPAQUE, only made harder: a server compromise that yields both the stored registration record and any server-side secrets needed to use it still lets an attacker run an offline guessing attack against the password. Second, if that offline attack succeeds, the attacker recovers the actual password — a credential that *is* directly reusable anywhere the user reused it, so the registration record's non-reusability doesn't survive a successful password recovery. A key-stretching function (KSF, e.g. Argon2id) raises the cost per guess, the same role it plays in ordinary password storage, but it doesn't make a low-entropy password's recovery infeasible; PAKE's offline-guessing resistance is specifically about the live network protocol exchange, not a guarantee that survives full server compromise.
- **Transcript binding and key confirmation**: Like the authenticated-DH mechanisms above, a well-designed PAKE binds the derived session key to the specific protocol transcript and includes explicit key-confirmation messages (MAC-authenticated protocol messages) so each side proves it derived the *same* key before either trusts the channel — the same principle as the key-confirmation discussion on the Asymmetric Cryptography page, applied to a password-derived exchange instead of a certificate-authenticated one.
- **OPAQUE**: [RFC 9807](https://www.rfc-editor.org/rfc/rfc9807.html) specifies **OPAQUE**, a current augmented PAKE built from an Oblivious Pseudorandom Function (OPRF) plus an authenticated key exchange phase. The client's password never leaves the client in a form the server can use to reconstruct it; the server-side registration record includes an encrypted "envelope" that only a correct password can unlock, and the AKE phase performs explicit key confirmation over the full transcript. Its real advantages over a plain password-over-TLS design aren't about what a server breach exposes: a leaked password hash directly enables offline guessing on its own, while OPAQUE's registration record alone doesn't — offline guessing there requires the fuller single-server compromise described in the server-registration-record entry above, exposing both the record *and* the server-side OPRF secrets needed to use it. The advantages instead are that the password itself is never transmitted to or seen in the clear by the server at all (**password hiding**), that a passive eavesdropper on the network exchange gains nothing usable toward offline guessing, and that the OPRF step specifically blocks precomputation attacks against the credential. RFC 9807 §1 also describes OPAQUE as **PKI-free**, but with a specific carve-out: PKI (or some other authenticated channel) is still needed during initial client registration, so "PKI-free" describes ongoing authentication, not the full protocol lifecycle.

## Perfect Forward Secrecy (PFS)

**Perfect Forward Secrecy (PFS)** ensures that, provided the per-session ephemeral key material was not itself separately compromised, an adversary who later obtains a long-term server private key cannot use it to decrypt previously recorded session traffic.

| Protocol Property | Static Key Exchange (Deprecated) | Ephemeral Key Exchange (PFS Standard) |
|---|---|---|
| **Impact of Private Key Leak** | In deployments that use the leaked long-term key to directly transport or derive the session key — static RSA key transport or static (non-ephemeral) Diffie-Hellman — the adversary decrypts **all recorded historical traffic** protected under that key. Modern ephemeral-only deployments (TLS 1.3 mandates ECDHE) are not exposed this way. | Adversary **cannot derive past session keys from the leaked long-term key alone**; recorded sessions remain protected unless the ephemeral key material was independently compromised. |
| **Key Agreement Mechanics** | RSA Key Transport or Static Diffie-Hellman | Ephemeral Elliptic Curve Diffie-Hellman (**ECDHE / X25519**) |
| **Modern Standard Requirement** | Prohibited in **TLS 1.3** ([RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html), which obsoletes the original [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)). | Required for every full **TLS 1.3** handshake. SSHv2 similarly favors ephemeral ECDH/DH key exchange in its default, most widely deployed algorithms, but [RFC 9142](https://www.rfc-editor.org/rfc/rfc9142.html) defines per-algorithm implementation-requirement tiers (MUST/SHOULD/MAY) that also permit some lower-priority, non-ephemeral methods — it isn't a strict ephemeral-only mandate the way TLS 1.3 is. TLS 1.3 PSK-only resumption (without `psk_dhe_ke`) is still permitted and forgoes forward secrecy for that resumed session. |

<div class="security-layer security-layer-protect">
  <div class="security-layer-label">Architectural Roles</div>
  <div>
    <strong>Server Certificate Key (Disk/HSM/KMS) vs. Ephemeral ECDHE Keys (RAM)</strong>
    <p>Understanding key roles resolves common misconceptions between identity authentication and data encryption:</p>
    <ul>
      <li><strong>Server Certificate Key (Typically on Disk, an HSM, or a KMS)</strong>: In a certificate-authenticated TLS 1.3 handshake, this key provides <strong>identity authentication</strong> by signing the handshake transcript. It is not the bulk-data encryption key; record-layer traffic keys are derived separately from the key-agreement result. This describes the key's TLS role rather than every use another certificate profile might permit.</li>
      <li><strong>Ephemeral ECDHE Key (Expected to Stay in Memory Only)</strong>: Used to establish the shared secret material that makes <strong>Data Confidentiality</strong> possible — it is a key-agreement key, not an encryption key itself. Generated in transient RAM for a single connection session, both endpoints combine key shares to derive the ECDH shared secret, which is passed through HKDF to derive the symmetric AES traffic keys (<code>0x8f3a91b2...</code>) and IVs that actually perform the AEAD encryption; the ECDHE key material is <em>intended</em> to be discarded when the session closes, though that's an implementation goal rather than a guarantee — swap, hibernation, or a crash dump taken while the session is live can still persist it.</li>
      <li><strong>Client Certificates</strong>: In the vast majority of ordinary web browsing, <strong>clients do not present certificates at all</strong>. The browser relies entirely on ephemeral ECDHE keys in RAM to derive the shared secret and expanded HKDF traffic keys to encrypt HTTP traffic.</li>
    </ul>
  </div>
</div>

### Perfect Forward Secrecy Simulation Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>Perfect Forward Secrecy (PFS) Simulator</h3>
    <p>Simulate key transport and key agreement protocols directly in your browser. Establish connections, simulate a server key compromise, and check whether historical session data can be decrypted. <em>Simplified for illustration: the "Ephemeral ECDH" mode signs only the server's ephemeral key share against a freshly generated key, not the full handshake transcript against a CA-trusted certificate the way real TLS 1.3 does.</em></p>
  </div>

  <div class="demo-body">
    <!-- Segmented Tab Switcher -->
    <div style="display: flex; gap: 0.25rem; background: rgba(127, 127, 127, 0.08); padding: 0.35rem; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 1.5rem;">
      <button id="tab-static-rsa" type="button" style="flex: 1; padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;">
        1. Static RSA (No PFS)
      </button>
      <button id="tab-ephemeral-ecdh" type="button" style="flex: 1; padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;">
        2. Ephemeral ECDH (PFS)
      </button>
    </div>

    <!-- Simulator Steps -->
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div id="sim-step-1" style="opacity: 1; transition: opacity 0.3s;">
        <h4 style="margin: 0 0 0.25rem 0;">Step 1: Session 1 (Past Connection)</h4>
        <p style="font-size: 0.85rem; margin: 0 0 0.5rem 0;">Establish a secure connection and transmit data.</p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input id="input-payload-1" type="text" class="demo-input" style="flex: 1; margin: 0;" value="Secret Transaction: Send $5,000 to Alice">
          <button id="btn-pfs-step-1" class="btn-primary" style="margin: 0;" type="button">⚡ Run Session 1</button>
        </div>
      </div>

      <div id="sim-step-2" style="opacity: 0.4; pointer-events: none; transition: opacity 0.3s;">
        <h4 style="margin: 0 0 0.25rem 0;">Step 2: Session 2 (Recent Connection)</h4>
        <p style="font-size: 0.85rem; margin: 0 0 0.5rem 0;">Establish a second connection and transmit data. Eavesdroppers record all traffic.</p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input id="input-payload-2" type="text" class="demo-input" style="flex: 1; margin: 0;" value="Secret Transaction: Send $2,500 to Bob">
          <button id="btn-pfs-step-2" class="btn-primary" style="margin: 0;" type="button">⚡ Run Session 2</button>
        </div>
      </div>

      <div id="sim-step-3" style="opacity: 0.4; pointer-events: none; transition: opacity 0.3s;">
        <h4 style="margin: 0 0 0.25rem 0;">Step 3: Server Key Compromise</h4>
        <p style="font-size: 0.85rem; margin: 0 0 0.5rem 0;">Steal the long-term identity private key from the server storage.</p>
        <button id="btn-pfs-step-3" class="btn-primary" style="margin: 0;" type="button">🔓 Steal Server Key</button>
      </div>

      <div id="sim-step-4" style="opacity: 0.4; pointer-events: none; transition: opacity 0.3s;">
        <h4 style="margin: 0 0 0.25rem 0;">Step 4: Attempt Decryption of Historical Traffic</h4>
        <p style="font-size: 0.85rem; margin: 0 0 0.5rem 0;">Attacker attempts to decrypt past connection ciphertexts using the stolen server key.</p>
        <button id="btn-pfs-step-4" class="btn-primary" style="margin: 0;" type="button">🔓 Attempt Decryption</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="pfs-output-area" class="demo-output-area" style="margin-top: 1.5rem;"></div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const tabRSA = document.getElementById('tab-static-rsa');
  const tabECDH = document.getElementById('tab-ephemeral-ecdh');

  const step1Div = document.getElementById('sim-step-1');
  const step2Div = document.getElementById('sim-step-2');
  const step3Div = document.getElementById('sim-step-3');
  const step4Div = document.getElementById('sim-step-4');

  const btnStep1 = document.getElementById('btn-pfs-step-1');
  const btnStep2 = document.getElementById('btn-pfs-step-2');
  const btnStep3 = document.getElementById('btn-pfs-step-3');
  const btnStep4 = document.getElementById('btn-pfs-step-4');

  const payload1Input = document.getElementById('input-payload-1');
  const payload2Input = document.getElementById('input-payload-2');
  const outputArea = document.getElementById('pfs-output-area');

  if (!tabRSA || !tabECDH || !btnStep1 || !outputArea) return;

  let activeMode = 'rsa'; // 'rsa' or 'ecdh'
  let state = {
    step: 1,
    serverRSAKeyPair: null,
    serverLongTermECDSAKeyPair: null, // long-term identity signature key
    sessions: [] // each connection session: ciphertext, encryptedKey/ephPubs, nonce
  };

  function log(message, type = 'info') {
    let color = 'var(--ink)';
    if (type === 'success') color = 'var(--teal)';
    if (type === 'error') color = '#b91c1c';
    if (type === 'warning') color = 'var(--amber)';
    return `<div style="margin-bottom: 0.35rem; color: ${color}; font-size: 0.85rem;">${message}</div>`;
  }

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setStepOpacity(stepNum) {
    step1Div.style.opacity = stepNum >= 1 ? '1' : '0.4';
    step1Div.style.pointerEvents = stepNum === 1 ? 'auto' : 'none';

    step2Div.style.opacity = stepNum >= 2 ? '1' : '0.4';
    step2Div.style.pointerEvents = stepNum === 2 ? 'auto' : 'none';

    step3Div.style.opacity = stepNum >= 3 ? '1' : '0.4';
    step3Div.style.pointerEvents = stepNum === 3 ? 'auto' : 'none';

    step4Div.style.opacity = stepNum >= 4 ? '1' : '0.4';
    step4Div.style.pointerEvents = stepNum === 4 ? 'auto' : 'none';
  }

  function resetSimulator(mode) {
    activeMode = mode;
    state.step = 1;
    state.serverRSAKeyPair = null;
    state.serverLongTermECDSAKeyPair = null;
    state.sessions = [];

    if (activeMode === 'rsa') {
      tabRSA.style.background = 'var(--accent)';
      tabRSA.style.color = '#ffffff';
      tabRSA.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      tabECDH.style.background = 'transparent';
      tabECDH.style.color = 'var(--muted)';
      tabECDH.style.boxShadow = 'none';
    } else {
      tabECDH.style.background = 'var(--accent)';
      tabECDH.style.color = '#ffffff';
      tabECDH.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      tabRSA.style.background = 'transparent';
      tabRSA.style.color = 'var(--muted)';
      tabRSA.style.boxShadow = 'none';
    }

    setStepOpacity(1);
    outputArea.innerHTML = log(`Simulator switched to <strong>${activeMode === 'rsa' ? 'Static RSA Key Transport' : 'Ephemeral ECDH (PFS)'}</strong>. Ready for Step 1.`);
  }

  tabRSA.addEventListener('click', () => resetSimulator('rsa'));
  tabECDH.addEventListener('click', () => resetSimulator('ecdh'));

  // Run Session 1
  btnStep1.addEventListener('click', async () => {
    try {
      const payload1 = payload1Input.value || 'Payload 1';
      outputArea.innerHTML += log('⏳ Executing Session 1 handshake...');

      const cryptoObj = window.crypto || window.msCrypto;
      if (!cryptoObj || !cryptoObj.subtle) {
        throw new Error('Web Crypto API not supported in this browser.');
      }

      if (activeMode === 'rsa') {
        // Generate Server Long-Term RSA Identity Key Pair
        state.serverRSAKeyPair = await cryptoObj.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
          },
          true,
          ['encrypt', 'decrypt']
        );

        // Client generates random AES-256 session key
        const sessionKeyBytes = cryptoObj.getRandomValues(new Uint8Array(32));

        // Client encrypts session key under Server RSA Public Key
        const encSessionKey = await cryptoObj.subtle.encrypt(
          { name: 'RSA-OAEP' },
          state.serverRSAKeyPair.publicKey,
          sessionKeyBytes
        );

        // Encrypt payload using AES-256-GCM
        const nonce = cryptoObj.getRandomValues(new Uint8Array(12));
        const keyObj = await cryptoObj.subtle.importKey(
          'raw',
          sessionKeyBytes,
          'AES-GCM',
          false,
          ['encrypt']
        );
        const ciphertext = await cryptoObj.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce },
          keyObj,
          new TextEncoder().encode(payload1)
        );

        state.sessions.push({
          num: 1,
          ciphertext,
          encSessionKey,
          nonce,
          rawSessionKey: sessionKeyBytes // saved so attacker can check decrypt
        });

        outputArea.innerHTML += log('🔑 [Session 1]: Long-term Server RSA key pair generated.');
        outputArea.innerHTML += log(`📦 [Session 1]: Encrypted AES Session Key: <code>${bytesToHex(encSessionKey).substring(0, 40)}...</code>`);
        outputArea.innerHTML += log(`🔒 [Session 1]: Transmitted Ciphertext: <code>${bytesToHex(ciphertext)}</code>`, 'success');
      } else {
        // 1. Generate Server Long-Term ECDSA Signing Identity Key
        state.serverLongTermECDSAKeyPair = await cryptoObj.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify']
        );

        // 2. Generate Ephemeral Keys (transient in application state)
        const clientEph = await cryptoObj.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveBits']
        );
        const serverEph = await cryptoObj.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveBits']
        );

        // 3. Server signs its own ephemeral key share (simplified illustration — real TLS 1.3
        //    signs the full handshake transcript, and validates against a CA-issued certificate,
        //    not a freshly generated key as this demo does)
        const serverEphExported = new Uint8Array(await cryptoObj.subtle.exportKey('raw', serverEph.publicKey));
        const handshakeSig = await cryptoObj.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          state.serverLongTermECDSAKeyPair.privateKey,
          serverEphExported
        );
        const sigValid = await cryptoObj.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          state.serverLongTermECDSAKeyPair.publicKey,
          handshakeSig,
          serverEphExported
        );

        // 4. Derive shared secret bits and pass through HKDF (RFC 5869)
        const rawBits = await cryptoObj.subtle.deriveBits(
          { name: 'ECDH', public: serverEph.publicKey },
          clientEph.privateKey,
          256
        );
        const hkdfKey = await cryptoObj.subtle.importKey('raw', rawBits, { name: 'HKDF' }, false, ['deriveKey']);
        const derivedKey = await cryptoObj.subtle.deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('pfs-demo-session-key') },
          hkdfKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );

        // 5. Encrypt payload using HKDF-derived AES-256-GCM key
        const nonce = cryptoObj.getRandomValues(new Uint8Array(12));
        const ciphertext = await cryptoObj.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce },
          derivedKey,
          new TextEncoder().encode(payload1)
        );

        state.sessions.push({
          num: 1,
          ciphertext,
          nonce
        });

        outputArea.innerHTML += log('🔑 [Session 1]: Server generated ephemeral P-256 ECDH keypair in transient RAM.');
        outputArea.innerHTML += log(`🖊️ [Session 1]: Server signed its ephemeral key share with the long-term ECDSA identity key (simplified illustration, not full TLS transcript binding) — signature valid: <code>${sigValid}</code>`);
        outputArea.innerHTML += log(`📦 [Session 1]: Ephemeral Client Public Key: <code>P-256 Point</code>`);
        outputArea.innerHTML += log(`🔒 [Session 1]: Transmitted Ciphertext: <code>${bytesToHex(ciphertext)}</code>`, 'success');
        outputArea.innerHTML += log('🧹 [Session 1 END]: Ephemeral key handles released for garbage collection. Note: JavaScript has no guaranteed secure-erase primitive — production TLS stacks explicitly zero this memory instead.');
      }

      state.step = 2;
      setStepOpacity(2);
    } catch (err) {
      outputArea.innerHTML += log(`❌ Error in Session 1: ${err.message || err}`, 'error');
    }
  });

  // Run Session 2
  btnStep2.addEventListener('click', async () => {
    try {
      const payload2 = payload2Input.value || 'Payload 2';
      outputArea.innerHTML += log('⏳ Executing Session 2 handshake...');

      const cryptoObj = window.crypto || window.msCrypto;

      if (activeMode === 'rsa') {
        const sessionKeyBytes = cryptoObj.getRandomValues(new Uint8Array(32));
        const encSessionKey = await cryptoObj.subtle.encrypt(
          { name: 'RSA-OAEP' },
          state.serverRSAKeyPair.publicKey,
          sessionKeyBytes
        );

        const nonce = cryptoObj.getRandomValues(new Uint8Array(12));
        const keyObj = await cryptoObj.subtle.importKey(
          'raw',
          sessionKeyBytes,
          'AES-GCM',
          false,
          ['encrypt']
        );
        const ciphertext = await cryptoObj.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce },
          keyObj,
          new TextEncoder().encode(payload2)
        );

        state.sessions.push({
          num: 2,
          ciphertext,
          encSessionKey,
          nonce,
          rawSessionKey: sessionKeyBytes
        });

        outputArea.innerHTML += log(`📦 [Session 2]: Encrypted AES Session Key: <code>${bytesToHex(encSessionKey).substring(0, 40)}...</code>`);
        outputArea.innerHTML += log(`🔒 [Session 2]: Transmitted Ciphertext: <code>${bytesToHex(ciphertext)}</code>`, 'success');
      } else {
        const clientEph = await cryptoObj.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveBits']
        );
        const serverEph = await cryptoObj.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveBits']
        );

        const serverEphExported2 = new Uint8Array(await cryptoObj.subtle.exportKey('raw', serverEph.publicKey));
        const handshakeSig2 = await cryptoObj.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          state.serverLongTermECDSAKeyPair.privateKey,
          serverEphExported2
        );
        const sigValid2 = await cryptoObj.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          state.serverLongTermECDSAKeyPair.publicKey,
          handshakeSig2,
          serverEphExported2
        );

        const rawBits2 = await cryptoObj.subtle.deriveBits(
          { name: 'ECDH', public: serverEph.publicKey },
          clientEph.privateKey,
          256
        );
        const hkdfKey2 = await cryptoObj.subtle.importKey('raw', rawBits2, { name: 'HKDF' }, false, ['deriveKey']);
        const derivedKey2 = await cryptoObj.subtle.deriveKey(
          { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('pfs-demo-session-key') },
          hkdfKey2,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );

        const nonce = cryptoObj.getRandomValues(new Uint8Array(12));
        const ciphertext = await cryptoObj.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce },
          derivedKey2,
          new TextEncoder().encode(payload2)
        );

        state.sessions.push({
          num: 2,
          ciphertext,
          nonce
        });

        outputArea.innerHTML += log(`🖊️ [Session 2]: Server signed its ephemeral key share with the long-term ECDSA identity key (simplified illustration, not full TLS transcript binding) — signature valid: <code>${sigValid2}</code>`);
        outputArea.innerHTML += log(`🔒 [Session 2]: Transmitted Ciphertext: <code>${bytesToHex(ciphertext)}</code>`, 'success');
        outputArea.innerHTML += log('🧹 [Session 2 END]: Ephemeral key handles released for garbage collection (no guaranteed secure-erase in JavaScript).');
      }

      state.step = 3;
      setStepOpacity(3);
    } catch (err) {
      outputArea.innerHTML += log(`❌ Error in Session 2: ${err.message || err}`, 'error');
    }
  });

  // Steal Server Key
  btnStep3.addEventListener('click', () => {
    if (activeMode === 'rsa') {
      outputArea.innerHTML += log('💥 ATTACK: Eavesdropper hacked the server filesystem and stole the Server\'s Long-Term RSA Private Key!', 'warning');
    } else {
      outputArea.innerHTML += log('💥 ATTACK: Eavesdropper hacked the server filesystem and stole the Server\'s Long-Term Identity Signature Key!', 'warning');
    }
    state.step = 4;
    setStepOpacity(4);
  });

  // Attempt Decryption
  btnStep4.addEventListener('click', async () => {
    try {
      outputArea.innerHTML += log('⏳ Attacker attempting decryption of recorded historical traffic...');

      const cryptoObj = window.crypto || window.msCrypto;

      if (activeMode === 'rsa') {
        let decrypted1 = '';
        let decrypted2 = '';

        try {
          const key1Bytes = await cryptoObj.subtle.decrypt(
            { name: 'RSA-OAEP' },
            state.serverRSAKeyPair.privateKey,
            state.sessions[0].encSessionKey
          );
          const key1 = await cryptoObj.subtle.importKey(
            'raw',
            key1Bytes,
            'AES-GCM',
            false,
            ['decrypt']
          );
          const p1 = await cryptoObj.subtle.decrypt(
            { name: 'AES-GCM', iv: state.sessions[0].nonce },
            key1,
            state.sessions[0].ciphertext
          );
          decrypted1 = new TextDecoder().decode(p1);

          const key2Bytes = await cryptoObj.subtle.decrypt(
            { name: 'RSA-OAEP' },
            state.serverRSAKeyPair.privateKey,
            state.sessions[1].encSessionKey
          );
          const key2 = await cryptoObj.subtle.importKey(
            'raw',
            key2Bytes,
            'AES-GCM',
            false,
            ['decrypt']
          );
          const p2 = await cryptoObj.subtle.decrypt(
            { name: 'AES-GCM', iv: state.sessions[1].nonce },
            key2,
            state.sessions[1].ciphertext
          );
          decrypted2 = new TextDecoder().decode(p2);
        } catch (e) {
          throw new Error('RSA Private Key Decryption Failed: ' + e.message);
        }

        outputArea.innerHTML += `
        <div class="security-layer security-layer-protect" style="margin-top: 1rem;">
          <div class="security-layer-label">Static RSA Key Compromise Complete</div>
          <div>
            <strong>❌ PFS BREACH: HISTORICAL TRAFFIC DECRYPTED!</strong>
            <p style="margin-bottom:0.35rem;">Because Static RSA doesn't support Forward Secrecy, stealing the long-term private key allows the attacker to decrypt the encrypted session key and recover all historic data:</p>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem;">
              <li><strong>Session 1 Data:</strong> <code>${escapeHtml(decrypted1)}</code></li>
              <li><strong>Session 2 Data:</strong> <code>${escapeHtml(decrypted2)}</code></li>
            </ul>
          </div>
        </div>`;
      } else {
        outputArea.innerHTML += `
        <div class="security-layer security-layer-direct" style="margin-top: 1rem;">
          <div class="security-layer-label">PFS Security Protection Verified</div>
          <div>
            <strong>✅ PFS HOLDS: LONG-TERM KEY LEAK DOESN'T EXPOSE PAST TRAFFIC</strong>
            <p style="margin-bottom:0;">The stolen key only ever signed the handshake — it was never used to encrypt data, so it cannot decrypt anything by itself. Recomputing either session's symmetric traffic key would require the client and server's ephemeral ECDH private keys, which this demo never persisted anywhere the attacker's stolen key can reach. (Note: real TLS stacks additionally take care to explicitly zero that ephemeral key memory; JavaScript itself offers no guaranteed secure-erase primitive.)</p>
          </div>
        </div>`;
      }
      state.step = 5;
      setStepOpacity(5);
    } catch (err) {
      outputArea.innerHTML += log(`❌ Decryption Error: ${err.message || err}`, 'error');
    }
  });

  resetSimulator('rsa');
})();
</script>
{% endraw %}


## Key Derivation Functions: HKDF (RFC 5869) & HPKE

A raw Diffie-Hellman shared secret **S** often contains non-uniform entropy and cannot be used directly as an AES key. A **Key Derivation Function (KDF)** transforms raw input key material (IKM) into pseudo-random key material (PRK) and expands it into multiple target keys.

Standardized in **[RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)**, **HKDF** follows a two-stage **Extract-then-Expand** pipeline:

<div class="diagram-frame">
  <img src="{{ '/assets/img/hkdf-extract-expand.svg' | relative_url }}" alt="HKDF Extract-and-Expand pipeline diagram converting raw IKM into PRK, then expanding into sub-keys.">
  <p class="diagram-caption">HKDF Extract-then-Expand pipeline: HMAC-based entropy extraction and key expansion</p>
</div>

### 1. Extract Phase

Extracts uniform pseudorandom key **PRK** from input key material **IKM** and an optional salt:

**PRK = HMAC-Hash(Salt, IKM)**

### 2. Expand Phase

Internally, HKDF-Expand builds its output keying material (OKM) block by block, and each block feeds into the next — the formula from [RFC 5869 §2.3](https://www.rfc-editor.org/rfc/rfc5869) is:

**T(i) = HMAC(PRK, T(i&minus;1) || info || i)**, with **T(0)** defined as the empty string

Expands **PRK** into sub-keys of any length up to `HKDF-Expand`'s own bound — [RFC 5869 §2.3](https://www.rfc-editor.org/rfc/rfc5869.html#section-2.3) caps output at **255 × HashLen** bytes, not an arbitrary length — using application-specific info context strings. Generic RFC 5869 applications call `HKDF-Expand` with a plain `info` byte string directly, e.g.:

**Traffic_Key = HKDF-Expand(PRK, info, length)**

TLS 1.3 itself does not call raw `HKDF-Expand` with a bare label string like `"tls13 client write"` — [RFC 9846 §7.1](https://www.rfc-editor.org/rfc/rfc9846.html#section-7.1) defines a wrapper, **HKDF-Expand-Label**, that builds a structured `info` field (encoding the output length, a `"tls13 "`-prefixed label, and an optional context) before calling `HKDF-Expand`:

**HKDF-Expand-Label(Secret, Label, Context, Length) = HKDF-Expand(Secret, HkdfLabel, Length)**

where `HkdfLabel` is the serialized structure `{ Length, "tls13 " + Label, Context }`. Traffic keys are then derived via the further wrapper `Derive-Secret(Secret, Label, Messages) = HKDF-Expand-Label(Secret, Label, Transcript-Hash(Messages), Hash.length)`.

## Hybrid Public Key Encryption (HPKE / RFC 9180) & Post-Quantum KEMs

Specified in **[RFC 9180](https://www.rfc-editor.org/rfc/rfc9180)**, **HPKE** standardizes a Key Encapsulation Mechanism (KEM), a KDF (HKDF), and an AEAD cipher into a single modular primitive.

### Post-Quantum KEM Transition (FIPS 203 ML-KEM)

Classical ECDH key agreement (X25519) is vulnerable to quantum computers. Protocols are transitioning to post-quantum-secure key exchange, though adoption varies and is not yet universal. TLS 1.3 is a concrete, already-standardized example: [RFC 10024](https://www.rfc-editor.org/info/rfc10024) defines the hybrid **X25519MLKEM768** group, combining classical X25519 ECDH with **[NIST FIPS 203 ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)**-768 (Kyber), to establish post-quantum-resistant shared secrets.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Key Exchange &amp; PFS Summary</strong>
    <ul>
      <li><strong>No Key Transmitted</strong>: Diffie-Hellman math derives matching shared secrets locally in RAM; no secret key ever crosses the network.</li>
      <li><strong>Perfect Forward Secrecy (PFS)</strong>: Ephemeral keys (ECDHE / X25519) are generated in RAM per connection and discarded when done. A later leak of the server's long-term disk key cannot, by itself, decrypt past recorded sessions.</li>
      <li><strong>HKDF Pipeline (RFC 5869)</strong>: Extracts raw Diffie-Hellman secrets into a pseudorandom key (PRK, via Extract) and expands it into independent sub-keys for client/server encryption (Expand).</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 7748**: *Elliptic Curves for Security (X25519)* — [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) (IRTF/CFRG Informational)
- **RFC 5869**: *HMAC-based Extract-and-Expand Key Derivation Function (HKDF)* — [IETF RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)
- **RFC 9846**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html)
- **RFC 9807**: *The OPAQUE Augmented Password-Authenticated Key Exchange (aPAKE) Protocol* — [RFC 9807](https://www.rfc-editor.org/rfc/rfc9807.html) (IRTF/CFRG Informational)
