---
title: Administrative Network Access
description: SSH bastions and ZTNA for mediated administration, including trust paths, host verification, forwarding controls, short-lived access, evidence, recovery, and selection.
permalink: /topics/administrative-network-access/
last_verified: 2026-08-13
---

<span class="eyebrow">Network Security / Privileged Access</span>

# Administrative Network Access

<p class="lede">Administrative access should expose the smallest management surface to an authenticated, authorized operator for a bounded time. SSH bastions proxy a network protocol to private hosts; Zero Trust Network Access (ZTNA) brokers access to named resources. Both depend on endpoint security, identity lifecycle, complete path coverage, and recoverable control planes.</p>

## SSH bastions and ZTNA have different boundaries

| Model | Client reachability | Trust and policy point | Best fit |
|---|---|---|---|
| **SSH bastion / jump host** | The client establishes SSH through a reachable jump host to a private SSH server. `ProxyJump` forwards a TCP stream; the target SSH session remains end-to-end between client and target. | Bastion admission plus separate target host authentication and authorization. Network policy must prevent direct target access. | Operator access to SSH-managed systems and tools that can use an SSH proxy. |
| **ZTNA broker / access proxy** | The client reaches named applications or resources through a broker instead of receiving general subnet routes. | An identity-aware decision point evaluates the subject, device, resource, and context at session establishment and at the product's configured re-evaluation points. | Per-application workforce or administrative access across heterogeneous locations. |

ZTNA does not inherently authorize every individual application request; some products establish a session or tunnel after one policy decision. The application must still enforce its own authorization, and the broker must cover every alternate path.

## Preserve both SSH trust relationships

```bash
# The client authenticates the bastion and the target as separate SSH hosts.
# ProxyJump supplies transport to the target; it does not waive target host-key checks.
ssh -J admin@bastion.example.com admin@10.0.2.45
```

Before first use, distribute bastion and target host keys or host certificates through an authenticated channel. A warning caused by an unexpected host-key change is an incident to investigate; do not replace `known_hosts` data merely to make the connection succeed. The **[SSH Architecture & Authentication]({{ '/topics/ssh/' | relative_url }})** page covers host-key verification and certificate mechanics in depth.

The network should allow SSH to targets only from approved bastion identities or addresses. A public bastion with unrestricted target forwarding becomes a pivot; a private target that remains reachable through another VPN, peering route, or cloud endpoint bypasses the intended chokepoint.

## Harden the bastion for its exact role

The settings below are a restrictive starting point for accounts that require only jump transport. They are not a universal complete configuration and must be tested against the installed OpenSSH version:

```text
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
AllowAgentForwarding no
X11Forwarding no
PermitTunnel no
GatewayPorts no
AllowTcpForwarding local

# ProxyJump requires local TCP forwarding, so restrict its destinations.
# Use DisableForwarding only for accounts that require no forwarding features.
# DisableForwarding yes
PermitOpen 10.0.2.45:22
```

`PasswordAuthentication no` does not disable keyboard-interactive authentication. Disable or deliberately configure both, and inspect the effective configuration with `sshd -T` because includes, `Match` blocks, and platform defaults can change the result.

- Use named administrator identities, phishing-resistant MFA at the identity tier where supported, least-privilege target accounts, and separate service automation from human access.
- Prefer short-lived SSH certificates or another bounded credential where the ecosystem supports them. Set lifetime from threat, operation duration, renewal, revocation, and outage requirements; `1–8 hours` is an example design range, not a universal standard.
- Restrict `AllowTcpForwarding`, `PermitOpen`, agent forwarding, X11 forwarding, tunnels, shell commands, and file transfer to the functions the account needs.
- Patch and minimize the bastion, protect its logs and CA/client-key material, and keep it out of general application hosting.
- Treat a compromised bastion as loss of a network chokepoint, not automatic compromise of target SSH private keys. Attack impact depends on captured credentials, agent forwarding, target trust, active sessions, and downstream policy.

## Make access decisions and evidence useful

For either model, bind each grant to operator, device, target resource, permitted action or port, approval, start/expiry, and ticket or incident context. Log authentication result, authorization decision, resource, time, policy version, and session identifiers.

Session recording can help investigation, but it has limits and privacy costs. A terminal recording may capture secrets shown on screen while missing activity inside nested encrypted channels or application-side effects. Protect recordings, restrict access, define retention, notify affected users where required, and correlate with target audit logs rather than treating the recording as complete evidence.

Monitor direct-path attempts, access outside approved windows, new device or geography, failed host verification, unexpected forwarding, target mismatch, dormant account use, emergency access, policy-controller outage, and logs that stop arriving.

## Plan revocation and break-glass recovery

1. Remove the identity or entitlement and stop new sessions.
2. Revoke or expire issued credentials where the mechanism supports it; short lifetime bounds but does not instantly invalidate an already issued certificate or session.
3. Terminate active sessions when the incident warrants it and preserve relevant evidence.
4. Rotate affected CA, host, operator, or broker credentials according to what the attacker obtained.
5. Test that direct access remains blocked and that retired credentials fail.

Keep a separately protected, monitored break-glass path for loss of the identity provider, certificate authority, broker, DNS, or bastion. Exercise it periodically, require post-use review, and prevent its credentials or routes from becoming a routine shortcut.

## Select the narrower access model

- Use an **SSH bastion** when SSH end-to-end semantics, host verification, and a tightly controlled jump path meet the requirement.
- Use **ZTNA** when multiple application protocols need resource-level brokering and contextual identity/device policy.
- Use a **[VPN tunnel]({{ '/topics/vpn-ipsec-wireguard/' | relative_url }})** when a device or site genuinely needs broader IP reachability, then apply downstream segmentation and application authorization.
- Combine models only with explicit boundaries. A ZTNA connector behind a bastion or VPN adds control planes; it does not automatically add independent protection.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Administrative access is a bounded path to a named resource, not proof that the operator or endpoint stays trustworthy. Verify both SSH hosts, restrict forwarding and alternate routes, scope credentials and sessions, correlate target evidence, and maintain a tested break-glass path.</p>
</div>

## Primary references

- **[OpenSSH `ssh_config(5)`](https://man.openbsd.org/ssh_config)** and **[`sshd_config(5)`](https://man.openbsd.org/sshd_config)** — verified ProxyJump, host-key behavior, authentication controls, forwarding restrictions, and effective server-policy options.
- **[NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)** — verified policy decision/enforcement concepts, resource-focused access, and session trust boundaries.
- **[CISA Zero Trust Maturity Model](https://www.cisa.gov/zero-trust-maturity-model)** — verified identity, device, network, application, and visibility considerations for resource access.
