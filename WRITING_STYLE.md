# Journal writing standard

## Purpose and reader

This is my personal technical field journal. I am writing for my future self, not publishing an article for a general audience. I may return after months or years, so every page must help me recall the subject quickly without assuming that I still remember its prerequisites.

## Voice and language

- Write in the first person when describing my understanding, decisions, checks, or reminders.
- Use clear, natural Singapore English with **US spelling**: `authorize`, `categorize`, `organization`, `behavior`, and `color`.
- Keep the tone practical, calm, direct, and technically precise.
- Do not force Singlish, slang, gender markers, or cultural stereotypes. The voice should feel personal through the reasoning and examples, not manufactured expressions.
- Prefer plain language. Define an acronym or specialist term the first time it appears.
- Do not write as though teaching an audience, promoting a product, or presenting an academic paper.

## Recall-first rule

Assume I have forgotten the surrounding knowledge.

- Start with a short mental model: what the subject is and what problem it addresses.
- State why it matters before going into implementation details.
- Briefly restore required background instead of saying “as we know” or assuming prior knowledge.
- Use one concrete example, scenario, command, or diagram when it improves recall.
- Separate concepts that are commonly confused and explain the boundary between them.
- End substantial pages with a short checklist, decision rule, or summary I can scan later.
- Link to deeper journal pages instead of repeating an entire prerequisite topic.

## Choose one primary writing framework

Select the framework that best fits the topic. The headings do not have to use the framework words literally, but the information flow should follow them.

### 1. What → So what → Now what

Use for foundational concepts, overviews, personal learning notes, and decision context.

- **What:** define the subject and its boundaries.
- **So what:** explain why it matters, what fails without it, and how it connects to practice.
- **Now what:** give the checklist, decision, next action, or implementation direction.

### 2. 5W1H

Use when the actors, context, timing, or operating sequence are essential—for example, protocols, standards, incidents, and governance responsibilities.

- **Who:** actors and responsibilities.
- **What:** data, action, or system involved.
- **When:** timing, lifecycle, or trigger.
- **Where:** boundary, environment, or trust zone.
- **Why:** purpose and risk.
- **How:** mechanism and verification.

### 3. Problem → Analysis → Solution → Validation

Use for implementation guides, architecture choices, troubleshooting, security controls, and practical demonstrations.

- **Problem:** describe the failure, requirement, or threat precisely.
- **Analysis:** identify cause, assumptions, constraints, and tradeoffs.
- **Solution:** show the control or implementation and explain how it addresses the cause.
- **Validation:** demonstrate the result, test failure cases, and state what remains unproven.

Use a secondary framework only when it materially improves clarity. Do not add framework headings mechanically.

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
- Place references next to the claims they support.
- Distinguish a standard requirement from my own recommendation or working rule.
- Label legacy, deprecated, restricted, or unsafe examples clearly.
- Keep runnable code and displayed output consistent. If values are random, explain the invariant behavior rather than promising identical bytes.

## Final self-review

Before considering a page complete, check:

1. Can I understand the mental model in under a minute?
2. Are unfamiliar terms and prerequisites restored briefly?
3. Is the chosen framework appropriate and easy to follow?
4. Are commonly confused concepts separated?
5. Do examples and commands prove what the text claims?
6. Are important limitations and failure cases included?
7. Are US spelling and first-person journal voice consistent?
8. Are material claims supported by primary references?
