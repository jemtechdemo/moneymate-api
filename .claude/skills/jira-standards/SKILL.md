---
name: jira-standards
description: >
  Apply MoneyMate Jira writing standards to all issue creation, updates,
  and comments. Invoke automatically when creating or updating any Jira
  issue, epic, story, bug, or task — including adding comments or
  changing status.
---

# Jira Standards for MoneyMate

These standards ensure every Jira issue is consistent, readable, and
actionable. A developer picking up any ticket cold should immediately
understand what needs doing, why, and how to verify it is done.

---

## Description format — always use ADF

All Jira issue descriptions MUST be written in Atlassian Document Format
(ADF), not plain text or markdown strings. ADF is Jira Cloud's native
format and ensures descriptions render correctly with proper headings,
bullet points, and code blocks.

Never pass raw markdown strings (e.g. "## Heading\n- item") as description
content — these render as literal \n and ## characters in the Jira UI.

Always structure descriptions as ADF JSON:

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Goal" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Description here." }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "First item" }]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Issue templates by type

### Bug report

Required sections (in order):
1. **Summary** (ticket title) — short, specific, present tense: "Monthly total excludes last-day transactions" not "Bug in totals"
2. **Description** — one sentence explaining what is broken
3. **Steps to reproduce** — numbered list, specific enough to replicate exactly
4. **Expected behaviour** — what should happen
5. **Actual behaviour** — what currently happens
6. **Acceptance criteria** — bullet list of verifiable conditions that must be true for the bug to be closed

### Story

Required sections (in order):
1. **Summary** (ticket title) — imperative action: "Implement GET /reports/summary endpoint"
2. **Story** — one sentence user story: "As a [persona], I want [capability] so that [benefit]"
3. **Implementation notes** — bullet list of specific technical guidance for the developer
4. **Acceptance criteria** — bullet list of verifiable conditions; each item must be independently testable
5. **Story points** — numeric estimate on its own line

### Epic

Required sections (in order):
1. **Summary** (ticket title) — short noun phrase: "Monthly spending reports"
2. **Goal** — one paragraph explaining the user value
3. **Background** — context on why this is needed now
4. **Scope** — bullet list of what is included
5. **Acceptance criteria** — bullet list of done conditions for the epic as a whole

### Task / Subtask

Required sections (in order):
1. **Summary** (ticket title) — imperative verb and specific action
2. **Context** — one sentence explaining why this task exists
3. **Definition of done** — bullet list of verifiable completion criteria

---

## Writing standards

### Summaries (ticket titles)
- Use sentence case: "Fix off-by-one error in monthly filter" not "Fix Off-By-One Error"
- Be specific: name the function, endpoint, or component affected
- Use present tense for bugs: "Monthly total excludes last-day transactions"
- Use imperative for stories and tasks: "Add category breakdown to summary response"
- Maximum 80 characters
- Never use vague titles: "Fix bug", "Update code", "Improvements"

### Acceptance criteria
- Every item must be independently verifiable with a yes/no answer
- Start each item with a verb: "Returns", "Displays", "Validates", "Handles"
- Include edge cases explicitly: "Returns empty array when no transactions exist for the period"
- Never use vague criteria: "Works correctly", "Looks good", "Is fast"
- Include test coverage expectations where relevant: "Covered by unit tests"

### Comments
- Always reference what you did and why, not just what changed
- If updating ticket status, add a comment explaining the reason
- PR links must always be included when moving a ticket to In Review
- Format: "PR opened: [link]. Summary of changes: [one sentence]."

### Labels
- Use lowercase kebab-case: transactions, api-endpoint, boundary-date
- Apply at minimum: the affected module label plus the type of work label
- Bug labels: always include bug plus the affected module
- Story labels: always include the affected module

### Priority guidelines

| Priority | When to use |
|----------|-------------|
| Highest  | Production broken, data loss, security issue |
| High     | Core feature broken, blocks other work |
| Medium   | Feature gap, non-blocking bug |
| Low      | Nice-to-have, minor cosmetic issue |
| Lowest   | Future consideration, parking lot |

---

## Status workflow

| Status      | Meaning                           | Who moves it                   |
|-------------|-----------------------------------|--------------------------------|
| To Do       | Not yet started                   | PM or agent on ticket creation |
| In Progress | Actively being worked             | Agent when starting work       |
| In Review   | PR open, awaiting review          | Agent after PR opened          |
| Done        | Merged, verified, closed          | Developer or PM after merge    |

Agent rule: always update ticket status when transitioning. Never leave a
ticket in To Do after starting work, or In Progress after opening a PR.

---

## Quick reference card

| Rule               | Standard                                          |
|--------------------|---------------------------------------------------|
| Description format | ADF JSON always — never raw markdown strings      |
| Title style        | Sentence case, imperative verb, max 80 chars      |
| Acceptance criteria| Verifiable yes/no, starts with a verb             |
| Status updates     | Always update on transition, add a comment        |
| PR comments        | Include PR link when moving to In Review          |
| Labels             | Lowercase kebab-case, module plus type minimum    |
