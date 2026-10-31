# Antigravity Premium Design Skills Library

A reusable skill pack for building distinctive, premium websites with Next.js, React, and Tailwind CSS.

## Included skills

| Skill | Purpose |
|---|---|
| `frontend-design` | Overall visual design and implementation quality |
| `product-ux` | User journeys, information architecture, and content hierarchy |
| `design-system` | Tokens, typography, color, spacing, and component consistency |
| `art-direction` | Original visual identity and composition |
| `motion-design` | Purposeful, accessible animation |
| `responsive-accessibility` | Responsive behavior and accessibility |
| `nextjs-tailwind-engineering` | Next.js, React, and Tailwind implementation practices |
| `visual-qa` | Browser-based visual and interaction review |

## Install

Copy the `.agents` directory into the root of your project:

```text
your-project/
└── .agents/
    └── skills/
        ├── frontend-design/SKILL.md
        ├── product-ux/SKILL.md
        ├── design-system/SKILL.md
        ├── art-direction/SKILL.md
        ├── motion-design/SKILL.md
        ├── responsive-accessibility/SKILL.md
        ├── nextjs-tailwind-engineering/SKILL.md
        └── visual-qa/SKILL.md
```

Antigravity should be able to discover project-level skills from `.agents/skills/`. If your installed Antigravity version uses a different skills location, follow its current Agent Skills documentation and move the folders without changing their contents.

## Recommended agent workflow

1. Read the relevant skills before planning or editing.
2. Inspect the project, references, assets, routes, dependencies, and existing design system.
3. Write a short product UX blueprint and art-direction brief.
4. Define or extend design tokens before building page components.
5. Implement one complete representative page/flow before duplicating patterns.
6. Build responsive layouts and real interaction states.
7. Use motion only when it supports comprehension or feedback.
8. Run the app and inspect rendered pages in a browser.
9. Fix visual and functional defects, then run lint/type-check/build.
10. Report what was verified and list any remaining limitations.

## Suggested prompt for Antigravity

Read all relevant skills in `.agents/skills/` before starting. Treat them as project standards.

I want a premium, visually distinctive website with the clarity, restraint, typography, interaction quality, and engineering polish associated with Apple, Linear, and Vercel—but do not copy their pages or brand assets.

First inspect the existing project and any supplied references. Do not start coding immediately. Produce:
- a concise product and audience understanding,
- a page/route inventory,
- a UX and content hierarchy blueprint,
- an original art-direction brief,
- a token proposal for color, typography, spacing, radius, borders, and motion,
- a component and interaction plan,
- responsive and accessibility considerations,
- implementation and verification steps.

Then implement in small, reviewable stages. Preserve existing architecture and established design decisions unless a change is necessary and explained. Use realistic content, avoid generic AI landing-page patterns, and ensure every visible control works.

Do not claim the design is finished until you have run it and reviewed the actual rendered pages at desktop and mobile sizes using available browser tools. Fix the most important visual issues, test interactions, run relevant project checks, and report exactly what was and was not verified.

If project requirements or references are ambiguous, ask only the most important clarifying question. Do not invent business facts, testimonials, metrics, customers, or product capabilities.
