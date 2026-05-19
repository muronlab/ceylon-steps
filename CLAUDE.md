# Ceylon Step — engineering rules

This is a three-project monorepo (`ceylon-step-back`, `ceylon-steps-front`, `ceylon-steps-admin`). The backend is the single source of truth — both frontends are API clients. Read the root [README.md](README.md) for a full project overview.

You are expected to work like a senior engineer on this codebase: think about architecture, security, and cross-project consistency on every change. Do not treat the three projects as independent — they are one product.

The rules below are mandatory. They are split into focused files for clarity.

@.claude/rules/01-architecture.md
@.claude/rules/02-security.md
@.claude/rules/03-cross-project-consistency.md
@.claude/rules/04-definition-of-done.md

## Quick reminders

- **Backend is the contract.** When a DTO, route, enum, or error shape changes in `ceylon-step-back`, the matching code in **both** `ceylon-steps-front` and `ceylon-steps-admin` is part of the same change. See [03-cross-project-consistency.md](.claude/rules/03-cross-project-consistency.md).
- **Next.js 16 is not the Next.js you know.** Both frontends have an `AGENTS.md` warning about breaking changes from older Next versions. Read it before touching frontend code.
- **No secrets in code, ever.** Placeholders only. If you suspect a leak, tell the user to rotate immediately.
- **British English** in code comments, docs, and user-facing text. Currency LKR primary, USD in parentheses for international contexts. Dates `DD MMM YYYY`.
