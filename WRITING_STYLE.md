# Journal writing standard

## Purpose and reader

This is my personal technical field journal. I am writing for my future self, not publishing an article for a general audience. I may return after months or years, so every page must help me recall the subject quickly without assuming that I still remember its prerequisites.

## Voice and language

- **Direct Technical Voice (Objective, 3rd person)**: Write in a clean, authoritative engineering style (similar to AWS architecture docs or Stripe technical references).
- Avoid repetitive or self-conscious first-person framing (do NOT use "My mental model is...", "My takeaway is...", "When I design..."). Keep the focus strictly on the engineering subject, mechanisms, and trade-offs.
- Use clear, natural Singapore English with **US spelling**: `authorize`, `categorize`, `organization`, `behavior`, `color`, and `center`.
- Keep the tone practical, calm, direct, crisp, and technically precise.
- Prefer plain language. Define an acronym or specialist term the first time it appears.
- Do not write as though promoting a product or presenting an academic paper.


## Recall-first rule

Assume I have forgotten the surrounding knowledge.

- Start with a short mental model: what the subject is and what problem it addresses.
- State why it matters before going into implementation details.
- Briefly restore required background instead of saying “as we know” or assuming prior knowledge.
- Use one concrete example, scenario, command, or diagram when it improves recall.
- Separate concepts that are commonly confused and explain the boundary between them.
- Keep each page self-contained because entries are written ad hoc.
- Link only to an existing journal page when it directly restores a prerequisite or materially improves recall. Explain the minimum required context locally.
- Do not promise future entries or narrate that a subject belongs in separate notes.

## Narrative continuity and single-subject integrity

Avoid narrative drift or abrupt conceptual pivots between sections:

- **Single Subject Focus**: A page's sections must deepen understanding of *one single primary subject*. For example, the `So What` section must explain the direct implications, failure modes, or trade-offs of the exact concept defined in `What`. Never hijack a transition section to introduce an unannounced new topic or framework.
- **Descriptive Headings**: Prefer descriptive, concept-focused headings (e.g., `## Why binary prevention fails in real-world systems`) over mechanical framework keywords (e.g., `## So What`). Headings should read as natural subtopics of the primary subject.
- **Smooth Logical Flow**: Transitions must bridge naturally from definition (`What`) to impact/trade-offs (`So What`), leading directly into practical action or evaluation (`Now What`).

## Mandatory page ending format

Every substantial topic page must conclude with two standardized elements in sequence:

1. **Summary Callout Box**:
   ```html
   <div class="callout">
     <span class="callout-title">What I need to remember</span>
     <p>Concise 1-2 sentence core takeaway summarizing the mental model and key decision rule.</p>
   </div>
   ```
2. **Primary References Section**:
   ```markdown
   ## Primary references

   - **[Source Title](URL)** — description of what was verified against this source.
   ```

## Choose one primary writing framework

Select the framework that best fits the topic. Descriptive headings should follow the underlying logical flow without using literal framework keywords mechanically.

### 1. What → So what → Now what

Use for foundational concepts, overviews, personal learning notes, and core decision context.

- **What:** define the primary subject, its boundary, and core components cleanly.
- **So what:** explain why this specific subject matters, what fails if it is misunderstood or ignored, and what trade-offs exist (without drifting into a new topic).
- **Now what:** provide the actionable checklist, decision matrix, or operational rule to apply the concept.

### 2. Compare & Contrast

Use for evaluating competing models, algorithms, protocols, or design options (e.g., RBAC vs ABAC vs ReBAC, Symmetric vs Asymmetric, Passkeys vs TOTP).

- **Context & Comparison Boundary:** define the competing options and the exact operational boundary separating them.
- **Mechanism & Trade-off Analysis:** contrast operational mechanics, performance, security guarantees, and failure modes in a clear matrix or comparative breakdown.
- **Selection Matrix / Decision Rule:** provide explicit criteria for when to select each option given specific real-world constraints.

### 3. 5W1H

Use when actors, context, timing, operating sequence, or governance boundaries are essential—for example, protocols, standards, incidents, and administrative responsibilities.

- **Who:** actors and responsibilities.
- **What:** data, action, or system involved.
- **When:** timing, lifecycle, or trigger.
- **Where:** boundary, environment, or trust zone.
- **Why:** purpose, risk, and threat model.
- **How:** underlying mechanism and verification.

### 4. Problem → Analysis → Solution → Validation

Use for implementation guides, system architecture choices, troubleshooting, security control deployments, and hands-on demonstrations.

- **Problem:** describe the failure, requirement, or threat precisely with a real-world scenario.
- **Analysis:** identify the root cause, assumptions, system constraints, and engineering trade-offs.
- **Solution:** demonstrate the control or code implementation and explain how it directly resolves the cause.
- **Validation:** demonstrate verification using tests/commands, state what the test proves, and state what remains unproven.

### 5. Threat → Attack Mechanics → Defensive Control → Residual Risk

Use for attack-focused deep-dives, cryptographic mode weaknesses, vulnerability research, and security flaw analysis (e.g., CBC Padding Oracle, Length Extension, Prompt Injection).

- **Threat & Vulnerability:** define the attack vector, security weakness, and impact boundary.
- **Attack Mechanics:** explain step-by-step how the exploit works practically or mathematically (using code, diagrams, or payloads).
- **Defensive Control:** present the exact mitigation, patch, or defense mechanism.
- **Residual Risk & Verification:** document edge cases, limitations of the fix, and commands to verify immunity.

Use a secondary framework only when it materially improves clarity.

## Structure and level of detail

- Lead with the conclusion or mental model.
- Keep paragraphs short and focused on one idea.
- Use headings that state the concept or question clearly.
- Prefer a compact list or table for exact comparisons; use animation or diagrams only when relationships or sequences are easier to understand visually.
- Keep the main explanation concise, but retain details that affect security, correctness, implementation, or a decision.
- Show what a result proves and what it does **not** prove.
- Avoid filler, repeated conclusions, dramatic language, and vague claims such as “secure,” “best practice,” or “industry standard” without scope.

## Accuracy and references

- Verify security-sensitive or time-sensitive claims against current primary sources.
- Prefer standards bodies, specifications, vendor documentation, and original research over secondary summaries.
- Place references next to the claims they support and summarize them in the ending `## Primary references` section.
- Distinguish a standard requirement from my own recommendation or working rule.
- Label legacy, deprecated, restricted, or unsafe examples clearly.
- Keep runnable code and displayed output consistent. If values are random, explain the invariant behavior rather than promising identical bytes.

## Final self-review

Before considering a page complete, check:

1. Can I understand the mental model in under a minute?
2. Are unfamiliar terms and prerequisites restored briefly?
3. Is the chosen framework appropriate and easy to follow without narrative drift?
4. Are commonly confused concepts separated cleanly?
5. Do examples and commands prove what the text claims?
6. Are important limitations and failure cases included?
7. Are US spelling and direct technical voice consistent throughout?
8. Are material claims supported by primary references in the standardized ending section?

