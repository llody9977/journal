---
title: Serverless Security & FaaS Hardening
description: Technical reference for the FaaS execution environment lifecycle and why /tmp persists across invocations, per-function IAM execution roles, event payload validation, and why a reserved concurrency cap bounds spend by converting a Denial of Wallet into a denial of service.
permalink: /topics/serverless-faas-security/
last_verified: 2026-08-15
---

<span class="eyebrow">Cloud-Native Security / Serverless Architecture</span>

# Serverless Security & FaaS Hardening

<p class="lede">Function-as-a-Service removes server management but not server state. A function runs inside an execution environment that the provider keeps alive and reuses between invocations, so anything written to local disk outlives the request that wrote it. Meanwhile the security boundary moves almost entirely into two places: the IAM execution role attached to each function, and the validation applied to event payloads arriving from queues, buckets and API gateways. Cost becomes an attack surface too, and the standard mitigation for that trades one form of availability for another.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/serverless-faas-security.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the serverless faas security diagram at full size">
    <img src="{{ '/assets/img/serverless-faas-security.svg' | relative_url }}" alt="Serverless Security diagram showing execution environment reuse across invocations, per-function IAM role scoping, event source validation, and concurrency and timeout caps.">
  </a>
  <p class="diagram-caption">Serverless Architecture: Reused Execution Environments &leftrightarrow; Per-Function IAM Role Scoping &leftrightarrow; Concurrency &amp; Timeout Caps</p>
</div>

## The execution environment is reused, and so is its disk

AWS Lambda runs functions inside an isolated **execution environment**. On AWS this is a Firecracker microVM, though the isolation technology is provider-specific — Google Cloud Functions and Azure Functions use different mechanisms, so treat "microVM" as an AWS implementation detail rather than a property of serverless in general.

What generalizes is the lifecycle:

- **Cold start**: no environment is available, so the provider creates one, downloads the code, and runs initialization before the handler.
- **Warm reuse**: after the invocation completes the environment is frozen and retained. A later invocation thaws the same environment, skipping initialization. AWS documents that environments are recycled every few hours regardless, so persistence is real but not indefinite.
- **`/tmp` persists across that reuse.** Each execution environment provides between 512 MB and 10,240 MB of disk at `/tmp`, and the directory contents remain when the environment is frozen — it is explicitly a transient cache across invocations. Notably, even a crash or timeout that resets the environment does **not** clear `/tmp` before the next init.

The security consequence: `/tmp` is shared mutable state between requests that may belong to different users. A handler that writes a decrypted document, a cached credential, or an uploaded file there leaves it readable by the next invocation in the same environment. If a function can be induced to write an executable into `/tmp`, that file is still present on subsequent invocations.

*Fix*: write nothing sensitive to `/tmp`; where it is used as a cache, namespace entries per request and delete them in a `finally` block rather than at the end of the happy path. Do not rely on the environment being discarded.

## Granular single-purpose IAM execution roles

Assigning a single shared, broad IAM role (*e.g. wildcard `s3:*` or `dynamodb:*` permissions*) across dozens of serverless functions violates least privilege — every function inherits the union of what any function needs, so a flaw in the least important handler yields the most sensitive permission.

```
[ Function: Process-Payment ]  ──> IAM Role: Scoped ONLY to Payment DynamoDB Table
[ Function: Generate-PDF ]     ──> IAM Role: Scoped ONLY to PDF S3 Bucket
```

1. **Per-Function IAM Roles**: Define a dedicated IAM execution role for every individual serverless function.
2. **Resource-Level Scoping**: Restrict IAM policy `Resource` ARNs to specific tables, buckets, or queues rather than using wildcard (`"Resource": "*"`) permissions.

The execution role is the blast radius. Because the function's credentials are delivered through the environment, any code execution inside the handler — including through a vulnerable dependency — runs with exactly that role.

## Event injection and untrusted event sources

A function's input is not only an HTTP body. It arrives from S3 notifications, SQS messages, SNS topics, DynamoDB streams and API Gateway, and each of those is attacker-influenced whenever an attacker can write to the upstream resource.

- **Validate event payload schemas** (*from SQS, S3, API Gateway, SNS*) with a strict validator before the handler logic reads any field, and reject unknown fields rather than ignoring them.
- **Treat event metadata as untrusted too** — object keys, message attributes and headers are attacker-controlled strings that frequently reach a shell, a SQL query, or a file path.
- **Authenticate the caller at the edge.** A public function URL or an API Gateway route without an authorizer is an unauthenticated entry point into the execution role above.

## Denial of Wallet, and what a concurrency cap actually buys

Serverless scales automatically, which turns billing into an availability-adjacent attack surface. In a **Denial of Wallet (DoW)** attack the adversary floods a public endpoint, forcing large numbers of concurrent invocations whose cost accrues to the account owner.

The standard mitigation is a **reserved concurrency cap** on the function, plus rate-limiting quotas at the API Gateway.

**The trade-off is explicit and worth stating.** A concurrency cap bounds spend; it does not distinguish attacker load from legitimate load. Once the cap is reached, genuine invocations are throttled alongside malicious ones — the attacker has converted a billing attack into a denial of service, and needs less volume to do it. The cap is a backstop that bounds the worst case, not a defense that preserves service. Keep authentication and rate limiting at the edge as the controls that actually distinguish callers, and set the cap high enough to absorb real peaks.

**Short execution timeouts** limit the cost and impact of any single hung or exploited invocation. Set them from measured p99 duration with headroom. Note that on Lambda the default timeout is **3 seconds** and the maximum is 900 seconds (15 minutes) — the risk is a timeout raised carelessly toward that ceiling, not a permissive default.

## Serverless security review checklist

The checklist below is a journal working model, not a published audit standard. When auditing a serverless or FaaS deployment, evaluate these six criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Per-Function IAM Roles** | Does every serverless function use a dedicated, single-purpose IAM execution role with resource-scoped ARNs? | Infrastructure as Code (Serverless.yml / SAM) manifests. |
| **Concurrency caps sized deliberately** | Are reserved concurrency limits set to bound DoW cost, and sized above real peak so the cap does not become the outage? | Function concurrency settings compared against observed peak concurrency. |
| **Timeouts from measured duration** | Are function timeouts derived from p99 duration rather than raised toward the 900-second maximum? | Function timeout configuration and duration metrics. |
| **Event source validation** | Is every event payload and its metadata schema-validated before the handler reads it, for all sources, not just HTTP? | Handler entry-point code review, schema definitions. |
| **Dynamic Secret Fetching** | Are database credentials fetched at runtime via a secret manager rather than hardcoded environment variables? | Function code review &amp; environment variable audits. |
| **`/tmp` hygiene** | Is sensitive data kept out of `/tmp`, and is anything written there deleted on every exit path including errors? | Codebase static analysis, handler cleanup paths. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>The execution environment is reused and <code>/tmp</code> survives with it — even across a crash reset — so local disk is shared state between requests from different users. The per-function IAM execution role is the blast radius of any code execution in the handler, so scope one role per function to specific ARNs. Every event source is attacker-influenced, not just HTTP. And a reserved concurrency cap bounds the bill by throttling everyone: it converts Denial of Wallet into denial of service, so authentication and edge rate limiting remain the controls that tell callers apart.</p>
</div>

## Primary references

- **[AWS Lambda: Understanding the execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)** — verified environment reuse across invocations, the 512 MB to 10,240 MB `/tmp` range, that `/tmp` contents remain when the environment is frozen, and that a reset does not clear `/tmp` before the next init.
- **[AWS Lambda: Configure function timeout](https://docs.aws.amazon.com/lambda/latest/dg/configuration-timeout.html)** — verified that the default timeout is 3 seconds and the maximum is 900 seconds (15 minutes).
- **[AWS Lambda: Configure reserved concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)** — verified that reserved concurrency caps the concurrent executions of a function and that invocations beyond the limit are throttled.
- **[AWS Lambda: Defining Lambda function permissions with an execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)** — verified that the execution role grants the function its permissions and that credentials are supplied to the running function, which is what makes the role the blast radius. Replaces the retired *Security Overview of AWS Lambda* whitepaper, whose URL now redirects to the developer guide index.
- **[OWASP Serverless Top 10](https://owasp.org/www-project-serverless-top-10/)** — an OWASP **Incubator** project whose only release is the 2018 *OWASP Top 10: Serverless Interpretation*; useful as a risk taxonomy, but it is not a current ranked Top 10 and should not be cited as one.
