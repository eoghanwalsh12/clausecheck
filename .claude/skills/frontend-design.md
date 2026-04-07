---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## ClauseCheck Design System

This skill has been applied to ClauseCheck with the following committed direction. Maintain this system for all new pages and updates:

### Aesthetic: Dark Legal Editorial
Premium legal-tech feel. Deep charcoal-navy backgrounds, warm parchment text, antique gold accents. Think Bloomberg Terminal authority meets a luxury law firm's stationery.

### Color Palette (CSS Variables)
```
--background: #0d1117      (deep charcoal-navy)
--foreground: #e8e3d8      (warm parchment)
--card: #141924            (card surface)
--primary: #c4a248         (antique gold)
--primary-foreground: #0d1117
--accent: #1b2438          (hover/highlight)
--muted: #16202f           (muted surface)
--muted-foreground: #7a8ba8
--border: #1e2d45          (subtle border)
--destructive: #e05252
--warning: #e8a83e
--success: #4ade80
--ring: #c4a248
```

### Typography
- **Display/Headings**: `Playfair Display` (loaded via `next/font/google` as `--font-playfair`)
- **Body**: `Geist Sans` (local, `--font-geist-sans`)
- **Mono**: `Geist Mono` (local, `--font-geist-mono`)
- Apply `font-family: var(--font-playfair), Georgia, serif` to h1, h2, h3

### Background
Clean `--background` color, no blobs or texture. A subtle radial gradient at the top via the root layout can be used sparingly.

### Key Patterns
- Cards: `bg-[var(--card)] border border-[var(--border)] rounded-xl`
- Primary buttons: `bg-[var(--primary)] text-[var(--primary-foreground)]` (gold)
- Secondary buttons: `border border-[var(--border)] hover:bg-[var(--accent)]`
- Inputs: `bg-[var(--muted)] border border-[var(--border)]` with `focus:ring-1 focus:ring-[var(--ring)]`
- Muted text: `text-[var(--muted-foreground)]`
- Hover states: `hover:bg-[var(--accent)]`
- Active/selected: `bg-[var(--primary)] text-[var(--primary-foreground)]`
