---
description: Protocol for auto-updating local project knowledge.
---

# Knowledge Auto-Update Protocol

Invoked when the Agent discovers a new architectural pattern or rule.

## 1. Diagnose Rule
Identify the exact file in `.agents/workflows/` or `.gemini/antigravity/knowledge/` that requires updating based on new learnings (e.g., Zod validation enforcement).

## 2. Local Update
Update the file locally using dense, concise English bullet points. Do NOT automatically commit or push.

## 3. Report
Notify the user in chat: 
> "Learned [PATTERN] for [REASON]. Updated `.agents/` / KIs locally."
