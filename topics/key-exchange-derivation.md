---
title: Key Exchange & Key Derivation (KDF)
description: Diffie-Hellman key exchange mechanics, Ephemeral ECDH (X25519), Perfect Forward Secrecy (PFS), HKDF extract-and-expand pipeline, and post-quantum KEMs.
permalink: /topics/key-exchange-derivation/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# Key Exchange & Key Derivation (KDF)

<p class="lede">Key exchange protocols allow two communicating endpoints to establish a matching secret key over an untrusted, eavesdropped channel without transmitting the key itself. Key Derivation Functions (KDF) take high-entropy shared secrets or master secrets and deterministically expand them into cryptographically independent sub-keys for encryption, authentication, and IV generation.</p>

## Diffie-Hellman Key Exchange (DH & ECDH)

Standardized by Whitfield Diffie and Martin Hellman, Diffie-Hellman leverages the discrete logarithm problem. Endpoint A and Endpoint B exchange public parameters **g** and **p**, combine them with their private keys, and arrive at the exact same shared secret **S**:

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
   - Eavesdroppers see Orange and Green crossing the wire, but because *un-mixing paint is mathematically impossible*, they cannot deduce Red or Blue.
4. **Independent Final Mix**:
   - Client mixes received Green (Yellow + Blue) + secret **Red → Brown**.
   - Server mixes received Orange (Yellow + Red) + secret **Blue → Brown**.
5. **Identical Secret Key Result**: Both endpoints arrive at the exact same secret color (**Brown**). The secret key (**Brown**) was **never transmitted over the network**.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Software Execution Flow</div>
  <div>
    <strong>How Software Handshakes Execute Without Transmitting Keys</strong>
    <p>A common point of confusion is asking <em>"how does the secret key get passed to the client?"</em></p>
    <p><strong>The secret key is NEVER transmitted across the network.</strong> Neither endpoint sends the secret key. Instead, both software engines exchange public parameters and compute the matching 256-bit symmetric key <strong>independently in CPU RAM</strong>:</p>
    <ol>
      <li><strong>Client Exchange (`ClientHello`)</strong>: Client's crypto engine generates an ephemeral private key <strong>a</strong> in RAM and sends public key <b>A = a × G</b> over the wire.</li>
      <li><strong>Server Exchange (`ServerHello`)</strong>: Server's crypto engine generates an ephemeral private key <strong>b</strong> in RAM and sends public key <b>B = b × G</b> over the wire.</li>
      <li><strong>Independent Local Calculation</strong>:
        <ul>
          <li>Browser calculates: <b>S = a × B = a × (b × G) = a × b × G</b></li>
          <li>Server calculates: <b>S = b × A = b × (a × G) = a × b × G</b></li>
        </ul>
      </li>
      <li><strong>Identical Key Output &amp; Memory Purge</strong>: Both sides arrive at the exact same 32-byte AES key (e.g. <code>0x8f3a91b2...</code>). Once the TLS session closes, both sides wipe the ephemeral keys from RAM.</li>
    </ol>
  </div>
</div>

### Elliptic Curve Diffie-Hellman (ECDH / X25519)

Modern protocols replace finite-field Diffie-Hellman with **Elliptic Curve Diffie-Hellman (ECDH)** over Curve25519 (**X25519 / [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)**) or NIST P-256:
- **Smaller Public Keys**: 32-byte (256-bit) public keys provide 128-bit security, compared to 3072-bit modular prime groups in finite-field DH.
- **Fast Execution**: Orders of magnitude faster scalar multiplication with complete, constant-time arithmetic routines.

## Perfect Forward Secrecy (PFS)

**Perfect Forward Secrecy (PFS)** guarantees that compromising a long-term server private key today does NOT allow an adversary to decrypt past recorded session traffic.

| Protocol Property | Static Key Exchange (Deprecated) | Ephemeral Key Exchange (PFS Standard) |
|---|---|---|
| **Impact of Private Key Leak** | Adversary decrypts **ALL recorded historical traffic** encrypted under that server certificate. | Adversary **CANNOT decrypt past traffic**; recorded sessions remain protected. |
| **Key Agreement Mechanics** | RSA Key Transport or Static Diffie-Hellman | Ephemeral Elliptic Curve Diffie-Hellman (**ECDHE / X25519**) |
| **Modern Standard Requirement** | Prohibited in **TLS 1.3** ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)). | Mandatory requirement in **TLS 1.3** and **SSHv2**. |

<div class="security-layer security-layer-protect">
  <div class="security-layer-label">Architectural Roles</div>
  <div>
    <strong>Server Certificates (Disk) vs. Ephemeral ECDHE Keys (RAM)</strong>
    <p>Understanding key roles resolves common misconceptions between identity authentication and data encryption:</p>
    <ul>
      <li><strong>Server Certificate Key (Stored on Server Disk)</strong>: Used exclusively for <strong>Identity Authentication</strong> (proving to the browser: <em>"I am really bank.com"</em>). The server uses its private key to <strong>sign</strong> the handshake parameters. It is <strong>never used to encrypt bulk data</strong>.</li>
      <li><strong>Ephemeral ECDHE Key (Stored in Memory ONLY)</strong>: Used exclusively for <strong>Data Confidentiality</strong>. Generated in transient RAM for a single connection session, it calculates the symmetric AES-256 session key (<code>0x8f3a91b2...</code>) and is <strong>purged from RAM</strong> when the session closes.</li>
      <li><strong>Client Certificates</strong>: In 99% of web browsing, <strong>clients do not have certificates at all</strong>. The browser relies entirely on ephemeral ECDHE keys in RAM to calculate the AES key and encrypt HTTP traffic.</li>
    </ul>
  </div>
</div>

### Perfect Forward Secrecy Simulation Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>Perfect Forward Secrecy (PFS) Simulator</h3>
    <p>Simulate key transport and key agreement protocols directly in your browser. Establish connections, simulate a server key compromise, and check whether historical session data can be decrypted.</p>
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
    let color = 'var(--text)';
    if (type === 'success') color = 'var(--teal)';
    if (type === 'error') color = '#b91c1c';
    if (type === 'warning') color = 'var(--amber)';
    return `<div style="margin-bottom: 0.35rem; color: ${color}; font-size: 0.85rem;">${message}</div>`;
  }

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
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
      tabRSA.style.background = 'var(--primary)';
      tabRSA.style.color = '#ffffff';
      tabRSA.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      tabECDH.style.background = 'transparent';
      tabECDH.style.color = 'var(--text-muted, #888)';
      tabECDH.style.boxShadow = 'none';
    } else {
      tabECDH.style.background = 'var(--primary)';
      tabECDH.style.color = '#ffffff';
      tabECDH.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      tabRSA.style.background = 'transparent';
      tabRSA.style.color = 'var(--text-muted, #888)';
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
        // Generate Server Long-Term Signing Identity Key
        state.serverLongTermECDSAKeyPair = await cryptoObj.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify']
        );

        // Generate Ephemeral Keys (transient in RAM)
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

        // Client & Server exchange ephemeral public keys and derive shared AES secret
        const sharedSecret = await cryptoObj.subtle.deriveBits(
          { name: 'ECDH', public: serverEph.publicKey },
          clientEph.privateKey,
          256
        );

        // Encrypt payload with derived shared secret using AES-GCM
        const nonce = cryptoObj.getRandomValues(new Uint8Array(12));
        const keyObj = await cryptoObj.subtle.importKey(
          'raw',
          sharedSecret,
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
          nonce,
          sharedSecret
        });

        outputArea.innerHTML += log('🔑 [Session 1]: Server generated ephemeral P-256 ECDH keypair in transient RAM.');
        outputArea.innerHTML += log(`📦 [Session 1]: Ephemeral Client Public Key: <code>P-256 Point</code>`);
        outputArea.innerHTML += log(`🔒 [Session 1]: Transmitted Ciphertext: <code>${bytesToHex(ciphertext)}</code>`, 'success');
        outputArea.innerHTML += log('🧹 [Session 1 END]: Ephemeral private keys wiped and garbage-collected from transient memory.');
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

        const sharedSecret = await cryptoObj.subtle.deriveBits(
          { name: 'ECDH', public: serverEph.publicKey },
          clientEph.privateKey,
          256
        );

        const nonce = cryptoObj.getRandomValues(new Uint8Array(12));
        const keyObj = await cryptoObj.subtle.importKey(
          'raw',
          sharedSecret,
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
          nonce,
          sharedSecret
        });

        outputArea.innerHTML += log(`🔒 [Session 2]: Transmitted Ciphertext: <code>${bytesToHex(ciphertext)}</code>`, 'success');
        outputArea.innerHTML += log('🧹 [Session 2 END]: Ephemeral keys wiped from memory.');
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
              <li><strong>Session 1 Data:</strong> <code>${decrypted1}</code></li>
              <li><strong>Session 2 Data:</strong> <code>${decrypted2}</code></li>
            </ul>
          </div>
        </div>`;
      } else {
        outputArea.innerHTML += `
        <div class="security-layer security-layer-direct" style="margin-top: 1rem;">
          <div class="security-layer-label">PFS Security Protection Verified</div>
          <div>
            <strong>🚨 PFS SECURED: ATTACKER CANNOT DECRYPT TRAFFIC!</strong>
            <p style="margin-bottom:0;">Even though the attacker stole the long-term Server Identity Signature Key, they <strong>cannot decrypt past traffic</strong>. The transient ECDH private keys were deleted from RAM immediately after handshakes ended, leaving the recorded AES session secrets impossible to recalculate.</p>
          </div>
        </div>`;
      }
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

Expands **PRK** into arbitrary-length sub-keys using application-specific info context strings:

**Client_Write_Key = HKDF-Expand(PRK, "tls13 client write", 32)**

**Server_Write_Key = HKDF-Expand(PRK, "tls13 server write", 32)**

## Hybrid Public Key Encryption (HPKE / RFC 9180) & Post-Quantum KEMs

Specified in **[RFC 9180](https://www.rfc-editor.org/rfc/rfc9180)**, **HPKE** standardizes a Key Encapsulation Mechanism (KEM), a KDF (HKDF), and an AEAD cipher into a single modular primitive.

### Post-Quantum KEM Transition (FIPS 203 ML-KEM)

Classical ECDH key agreement (X25519) is vulnerable to quantum computers. Modern protocols deploy **[NIST FIPS 203 ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)** (Kyber) or hybrid **X25519MLKEM768** key exchange to establish post-quantum shared secrets.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Key Exchange &amp; PFS Summary</strong>
    <ul>
      <li><strong>No Key Transmitted</strong>: Diffie-Hellman math derives matching shared secrets locally in RAM; no secret key ever crosses the network.</li>
      <li><strong>Perfect Forward Secrecy (PFS)</strong>: Ephemeral keys (ECDHE / X25519) are generated in RAM per connection and erased when done. Stealing a server disk key later cannot decrypt past recorded sessions.</li>
      <li><strong>HKDF Pipeline (RFC 5869)</strong>: Extracts raw Diffie-Hellman secrets into a master key (Extract) and expands independent sub-keys for client/server encryption (Expand).</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 7748**: *Elliptic Curves for Security (X25519)* — [IETF RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)
- **RFC 5869**: *HMAC-based Extract-and-Expand Key Derivation Function (HKDF)* — [IETF RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)
- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
