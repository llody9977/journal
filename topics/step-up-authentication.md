---
title: Step-Up Authentication & MFA
description: NIST's authenticator assurance levels, how OAuth/OIDC actually requests stronger authentication mid-session, and a factor-by-factor comparison of MFA methods.
permalink: /topics/step-up-authentication/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Step-Up Authentication & MFA

<p class="lede">MFA and step-up authentication answer different questions. MFA asks "how many independent factors proved this identity at login?" Step-up asks "is that proof still strong and fresh enough for the specific thing being attempted right now?" A session that cleared MFA at 9am with a password and an SMS code is not automatically strong enough to authorize a wire transfer at 2pm — that's the gap step-up authentication exists to close.</p>

## NIST's Authenticator Assurance Levels

[NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) (Revision 4, published 2025) defines three tiers of confidence that the party at the keyboard actually controls the authenticator bound to the account:

| Level | Confidence | Requirement | Session reauthentication |
|---|---|---|---|
| **AAL1** | Basic | Any single authenticator factor | SHOULD be no more than 30 days |
| **AAL2** | High | Two distinct authentication factors, proof of possession and control of both | SHOULD be no more than 24 hours, or 1 hour of inactivity (a simplified reauth — password or biometric plus the existing session secret — is permitted here) |
| **AAL3** | Very high | Phishing-resistant public-key authentication with a non-exportable private key, plus an activation factor or password | Overall timeout SHALL be no more than 12 hours; inactivity timeout SHOULD be no more than 15 minutes; full AAL3 reauthentication is required |

Two points matter. First, AAL is not just a factor count: AAL3 requires phishing-resistant public-key authentication and a non-exportable private key, so password-plus-OTP is not enough. Second, each level has session reauthentication rules; one successful login is not permanent proof of continued presence.

## Which authenticators actually qualify, and which don't

The same revision is explicit about **restricting** SMS/PSTN delivery, not merely discouraging it:

<div class="callout warn">
  <span class="callout-title">SMS/voice OTP is a restricted authenticator</span>
  <p>NIST classifies PSTN-delivered (SMS or voice call) one-time codes as <strong>restricted</strong> — allowed only when the verifier has a documented plan to migrate away from it, and only if alternative authenticator types remain available to every subscriber. The <a href="https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html">OWASP MFA Cheat Sheet</a> is blunter about why: SIM-swap, SS7 interception, and number-porting attacks all defeat it, and it recommends against SMS entirely for high-value or PII-handling applications.</p>
</div>

The same revision also draws a line most people don't expect: **syncable authenticators** (passkeys that clone the private key across devices through a sync fabric, for convenience) are explicitly barred from AAL3, precisely because AAL3 requires a key that cannot be exported — the same sync feature that makes passkeys convenient for everyday login makes them unsuitable for the highest assurance tier.

| Factor | What it proves | Known weakness | NIST status |
|---|---|---|---|
| Password | Something you know | Reused, phished, guessed, or leaked in a breach | Baseline; not sufficient alone above AAL1 |
| SMS / voice OTP | Something you have (weakly — the phone number, not a device secret) | SIM-swap, SS7 interception, number porting | Restricted |
| TOTP ([RFC 6238](https://www.rfc-editor.org/rfc/rfc6238)) / HOTP ([RFC 4226](https://www.rfc-editor.org/rfc/rfc4226)) app codes | Something you have (a shared secret held by an app) | User can still be phished into typing the code into a fake site; secret can be extracted from a compromised device | Allowed; not phishing-resistant |
| Push notification | Something you have (a registered device) | "MFA fatigue" / push-bombing — flooding a user with approval prompts until one is accepted | Allowed; not phishing-resistant |
| Hardware security key / FIDO2 ([WebAuthn](https://www.w3.org/TR/webauthn-3/)) | Something you have, via public-key cryptography bound to the origin | Cost and provisioning overhead for lost/replaced keys | Can support AAL3 when the key is non-exportable and the complete authenticator, activation, validation, and protocol requirements are met |
| Syncable passkey | Something you have, convenience-optimized | Private key is exportable via the sync fabric by design | Phishing-resistant at AAL2; **not permitted at AAL3** |
| Biometric | Something you are | Can't be rotated if the underlying template is compromised; usually paired with a device-bound key rather than transmitted itself | Allowed as one factor, not a full authenticator on its own |

WebAuthn's own specification is precise about *why* the hardware-key row is phishing-resistant: a credential is "scoped to a given WebAuthn Relying Party" and cryptographically bound to it, so a lookalike phishing site — a different origin — cannot obtain a valid assertion no matter how convincing the page looks. Password and OTP codes have no equivalent binding; the user is the one deciding (and can be fooled about) which site the secret goes to.

## Real-world case: the Uber breach (September 2022)

Uber's own [security update](https://www.uber.com/newsroom/security-update/) describes exactly the push-notification weakness in the table above, at the scale of a real intrusion. An external contractor's corporate password had been exposed after malware infected the contractor's personal device. The attacker, a group Uber believed affiliated with Lapsus$, then used that password to repeatedly attempt to log in:

<div class="callout">
  <p>"Each time, the contractor received a two-factor login approval request, which initially blocked access. Eventually, however, the contractor accepted one, and the attacker successfully logged in."</p>
</div>

Nothing about the MFA implementation was technically broken — the push challenge fired exactly as designed, every time. The failure mode was fatigue: enough repeated prompts wear down a legitimate user's judgment, whereas a phishing-resistant factor (a hardware key or passkey bound to Uber's actual origin) has no equivalent "just approve it" action for an attacker to induce at all — there's no prompt to accept, only a cryptographic challenge the attacker's fake or replayed session cannot answer.

## Step-up authentication: raising the bar mid-session

OpenID Connect already lets a client request a specific assurance level *at login*, via the `acr_values` authentication request parameter (covered on the [OAuth & OpenID Connect]({{ '/topics/oauth-oidc/' | relative_url }}#openid-connect-adding-who-is-this-on-top) page). Step-up authentication is the reactive counterpart: a resource server, mid-session, decides the current proof isn't enough for the specific action being attempted, and asks for more — without tearing down the whole session.

[RFC 9470](https://www.rfc-editor.org/rfc/rfc9470) ("OAuth 2.0 Step Up Authentication Challenge Protocol") standardizes exactly that reactive flow:

1. A client presents an access token to a resource server for some action (say, changing a payout bank account).
2. The resource server judges the token's existing authentication event too weak or too old for that specific action, and replies with a new error code, `insufficient_user_authentication`, plus a `WWW-Authenticate` challenge carrying the `acr_values` and/or `max_age` it actually requires.
3. The client takes those same parameters back to the authorization server as a fresh authentication request, prompting the user for whatever stronger or fresher proof satisfies them — a hardware key tap, a fresh password entry, a redone biometric check — without logging the user out of everything else the session was doing.

This is the piece that closes the gap the [Machine-to-Machine API Authentication]({{ '/topics/api-security/' | relative_url }}#closing-the-impersonation-gap-in-machine-to-machine-auth) page flags as missing entirely for service-to-service calls: there's no human on the other end of a Client Credentials grant to answer a step-up challenge, so that page relies on different mechanisms (mTLS-bound tokens, DPoP) instead. Step-up authentication is specifically the human-present answer to the same underlying problem — proving that a login from months ago is still an adequate basis for a specific, higher-risk action right now.

## Common pitfalls

- **Treating all MFA as equivalent** — a password plus SMS code satisfies "two factors" on paper while remaining fully phishable and SIM-swap-vulnerable; it is not a substitute for a phishing-resistant factor for anything sensitive.
- **No step-up for high-risk actions** — if every action inside a session only ever needs the assurance level established at login, a single phished or fatigued approval at the start covers everything an attacker might want to do afterward.
- **Deploying syncable passkeys where AAL3 is actually required** — convenient for everyday login, explicitly disqualified by NIST for the highest assurance tier because the private key can leave the device.
- **No defense against push-bombing** — a bare "approve/deny" push prompt with no number-matching or context (as in the Uber case) trains users to tap approve reflexively under repeated pressure.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://pages.nist.gov/800-63-4/sp800-63b.html">NIST SP 800-63B Rev. 4</a></strong> defines the AAL levels and restricted/phishing-resistant authenticator status. <strong><a href="https://www.rfc-editor.org/rfc/rfc9470">RFC 9470</a></strong> defines the OAuth step-up challenge protocol. <strong><a href="https://www.rfc-editor.org/rfc/rfc6238">RFC 6238</a></strong> defines TOTP; <strong><a href="https://www.rfc-editor.org/rfc/rfc4226">RFC 4226</a></strong> defines the underlying HOTP algorithm. <strong><a href="https://www.w3.org/TR/webauthn-3/">WebAuthn Level 3</a></strong> (W3C) defines FIDO2 browser authentication. The <strong><a href="https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html">OWASP MFA Cheat Sheet</a></strong> compares factor weaknesses in practice. <a href="https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf">OMB M-22-09</a> mandates phishing-resistant MFA across U.S. federal agencies.</p>
</div>
