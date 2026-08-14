---
title: Key Compromise & Emergency Rekeying
description: How to contain suspected key compromise, determine blast radius, replace keys, rewrap or re-encrypt dependencies, and preserve incident evidence.
permalink: /topics/key-compromise-emergency-rekeying/
last_verified: 2026-08-13
---

<span class="eyebrow">Key Management / Incident Response</span>

# Key Compromise & Emergency Rekeying

<p class="lede">A key-compromise incident is a loss of trust in key confidentiality, integrity, ownership, or authorized use. Emergency rekeying should stop new harm, preserve the ability to investigate and recover data, replace the trust relationship, and remediate every dependency affected since the earliest plausible compromise time.</p>

## Treat suspected compromise as a trust-state change

Compromise is not limited to seeing raw key bytes. It can include unauthorized signing or decryption, a policy change that exposes key use, loss of sole control, an untracked key copy, weak generation, wrong-owner binding, HSM or library vulnerability, or missing evidence that prevents continued trust.

The first decision is reversible containment:

1. Preserve relevant logs, configuration, memory and host evidence, module status, identities, and timestamps.
2. Stop the key from applying new protection—encryption, signing, MAC generation, wrapping, or certificate issuance—as quickly as operationally safe.
3. Avoid immediate destruction when the key may be needed to decrypt affected data, verify evidence, or determine scope.
4. Create independent replacement material through a trusted path; do not derive the replacement from a suspected key.
5. Record uncertainty and the person accountable for the incident decision.

[NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) states that compromised keys stop being used to apply protection. Controlled use to remove or verify existing protection may still be warranted under the organization's policy and risk decision.

## Record both compromise times

[OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html) distinguishes:

- **Compromise Date:** when the key-management system became aware of the compromise.
- **Compromise Occurrence Date:** when the compromise is believed to have begun.

The second time defines the potential blast-radius window. If it cannot be established, use a conservative bound such as the last known-good control evidence or, in the KMIP model, the object's initial date.

## Determine impact from key purpose

| Compromised use | Potential impact | Main remediation question |
|---|---|---|
| **Data-encryption key** | Past and future ciphertext under that key may lose confidentiality | Which objects were protected during the exposure window, and must they be re-encrypted? |
| **KEK or wrapping key** | Every encrypted DEK it can unwrap may be exposed | Which envelopes and cached plaintext DEKs depend on the KEK, and are the DEKs still trustworthy? |
| **Private signature key** | Unauthorized signatures may be created and historical signatures may need temporal review | Which signatures were created after the occurrence date, and what trusted timestamp or audit evidence remains? |
| **CA private key** | Certificates can be misissued under the affected hierarchy | Which certificates, intermediates, trust stores, revocation channels, and relying parties require action? |
| **MAC or symmetric authentication key** | Forgery and verification authority are shared | Which parties possessed the key, and can legitimate and forged messages be distinguished? |
| **Key-establishment private key** | Session impact depends on protocol, ephemerality, and captured traffic | Which sessions and peers used it, and did the protocol provide forward secrecy? |

Scope from inventory, KMS/HSM operations, data-key generation, application logs, certificate records, deployments, caches, backups, and external consumers. Absence of KMS use does not prove absence of compromise if a key or DEK was copied outside the service.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/emergency-rekeying-decision-tree.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the emergency rekeying decision tree diagram at full size">
    <img src="{{ '/assets/img/emergency-rekeying-decision-tree.svg' | relative_url }}" alt="Journal decision tree for emergency rekeying: contain and preserve evidence, identify the compromised key purpose, replace it with independent material, then choose rewrapping, bulk re-encryption, certificate or trust replacement, or session and peer remediation before retirement.">
  </a>
  <p class="diagram-caption">The key purpose determines remediation. Every branch begins with containment, evidence preservation, independent replacement material, and a conservative compromise window; no branch ends with rotation alone.</p>
</div>

## Replace, rewrap, or re-encrypt according to what lost trust

- If only the KEK's scheduled usage period ended and the DEKs remain trusted, rewrapping can remove the old KEK dependency without reading the payload.
- If the KEK was compromised, assume an adversary may have obtained any DEK it could unwrap; risk may require rotating those DEKs and re-encrypting their payloads.
- If a DEK was compromised, rewrapping the same DEK is insufficient; decrypt and re-encrypt with independent key material.
- If a signing key was compromised, issue replacement public-key material, revoke or distrust the old binding where the ecosystem supports it, and assess signatures within the occurrence window.
- If a certificate private key was compromised, coordinate certificate revocation and replacement with the key change. Deleting a key does not notify relying parties.

Use versioned, idempotent migration jobs with checkpoints. Keep the compromised key restricted to the minimum controlled processing needed for recovery, and destroy it only when incident, legal, evidence, and dependency requirements allow.

## Validate emergency rekeying as an end-to-end change

Confirm that:

- new protective operations use only the replacement key;
- policy, grants, aliases, caches, replicas, and deployment configuration no longer route new work to the old key;
- required old data remains processable only through the approved recovery path;
- rewrapped or re-encrypted samples validate their authentication tags and metadata;
- certificates, public keys, trust stores, pins, and external consumers received the new binding;
- alerts fire on attempted use of the compromised key; and
- the inventory links every affected object, decision, exception, and evidence artifact to the incident.

A clean sample migration proves the tested path. It does not prove full remediation until inventory and usage evidence account for dormant, offline, backed-up, and third-party dependencies.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>On suspected compromise, stop new protective use, preserve evidence, and replace the key with independent material. Remediation follows purpose: rewrapping fixes a KEK dependency only when the DEK remains trusted; a compromised DEK requires bulk re-encryption.</p>
</div>

## Primary references

- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified compromise implications, cessation of protective use, controlled processing, replacement, recovery, and destruction guidance.
- **[OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html)** — verified compromised states, revocation workflow, Compromise Date, and Compromise Occurrence Date semantics.
- **[RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280)** — verified certificate and certificate-revocation-list structures relevant to compromised certificate keys.
- **[NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations](https://csrc.nist.gov/pubs/sp/800/61/r3/final)** — verified the wider incident-response integration used for preparation, detection, response, and recovery.
