# Design System Specification

## 1. Overview & Creative North Star: "The Precise Precisionist"

This design system is engineered for utility, clarity, and authoritative calm. It rejects the frantic energy of modern consumer apps in favor of a "High-End Editorial" experience—think of a bespoke financial ledger or a precision instrument’s interface. 

The Creative North Star is **The Digital Curator**. The layout is characterized by intentional asymmetry, where a heavy, authoritative sidebar anchors a light, airy canvas. We move beyond the "template" look by utilizing deep tonal layering and high-contrast typography scales that prioritize information hierarchy over decorative elements. The result is a professional environment that feels premium, intentional, and surgically clean.

---

## 2. Colors

The palette is anchored by a deep, intellectual navy and a warm, sophisticated neutral base. It is designed to minimize eye strain while maximizing legibility.

### Core Palette
*   **Primary (Brand Anchor):** `#04152b` (Deep Navy). Use this for the sidebar and high-level branding.
*   **Primary Container (Secondary in JSON):** `#1a2a40`. Used for the sidebar background to provide a solid, grounded feeling.
*   **Surface (Main Canvas) (Neutral in JSON):** `#fafaf5`. A soft, off-white that feels more premium and less clinical than pure white.
*   **Tertiary (Status):** `#005312` (On-Tertiary-Fixed-Variant). Specifically for the "Online" status indicator and success states.

### The "No-Line" Rule
To maintain a high-end feel, **do not use 1px solid borders for sectioning.** Boundaries must be defined through background color shifts. For example, a card (using `surface_container_lowest`) sits on a canvas (using `surface`) to create a boundary through contrast rather than lines.

### Surface Hierarchy & Nesting
Use the following tiers to create depth without clutter:
1.  **Level 0 (Base):** `surface` (#fafaf5) - The main background.
2.  **Level 1 (Sections):** `surface_container_low` (#f4f4ef) - Large content areas.
3.  **Level 2 (Active Elements):** `surface_container_lowest` (#ffffff) - Cards and input fields.
4.  **Level 3 (Elevated):** `surface_bright` (#fafaf5) - Floating elements or popovers.

### Glass & Signature Textures
For floating navigation elements or top bars, use **Glassmorphism**. Apply a semi-transparent `primary_container` with a `backdrop-filter: blur(12px)`. For primary action buttons, use a subtle linear gradient from `primary` (#04152b) to `primary_container` (#1a2a40) at 135 degrees to add visual "soul."

---

## 3. Typography: Editorial Authority

We use **Work Sans** across the board. It offers a clean, technical aesthetic that remains approachable.

*   **Display Scale:** Use `display-md` (2.75rem) for major tool titles. The wide tracking and heavy weight convey authority.
*   **Headline Scale:** Use `headline-sm` (1.5rem) for card titles. High contrast against the navy text (`on_surface`) is essential.
*   **The Contrast Rule:** All body text must use `on_surface_variant` (#44474d) or `primary` (#04152b). Never use pure black (#000) or mid-tones that fail WCAG AAA standards.
*   **The Japanese Context:** When rendering Japanese characters, ensure a line-height of `1.6` to `1.8` to maintain the editorial "breathing room."

---

## 4. Elevation & Depth

This system avoids "floating" everything. Instead, it uses **Tonal Layering**.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. A `surface_container_lowest` (#ffffff) card placed on a `surface` (#fafaf5) background creates a natural lift. This mimics the look of fine paper stacked on a desk.

### Ambient Shadows
Shadows are reserved only for interactive or truly "floating" components.
*   **Shadow Spec:** `0px 10px 30px rgba(26, 28, 25, 0.06)`. 
*   The shadow color is a tinted version of `on_surface`, creating an ambient, natural light effect rather than a "drop shadow."

### The "Ghost Border"
If a container requires a border for accessibility, use a **Ghost Border**: `outline_variant` at 15% opacity. Standard 100% opaque borders are strictly forbidden as they interrupt the visual flow.

---

## 5. Components

### Sidebar & Navigation
*   **Background:** `primary_container` (#1a2a40).
*   **Active Item:** Use a subtle highlight with `on_primary_fixed_variant` at 10% opacity and a `DEFAULT` (0.25rem) corner radius.
*   **Text:** Light gray (`inverse_on_surface`) for inactive items; white (`on_primary`) for active.

### Cards
*   **Style:** No borders. Background: `surface_container_lowest` (#ffffff).
*   **Padding:** Scale `6` (1.5rem) or `8` (2rem) to ensure a spacious, high-end feel.
*   **Separation:** Forbid the use of divider lines. Use vertical white space (Scale `4` or `6`) to separate internal content.

### Input Fields
*   **Style:** `surface_container_lowest` with a "Ghost Border" of 10% `outline`.
*   **Focus State:** Border changes to `primary` (#04152b) with a width of 1.5px. No "glow" effects.
*   **Corner Radius:** `full` (pill-shaped) for a balanced, professional look.

### Buttons
*   **Primary:** Gradient from `primary` to `primary_container`. White text. Radius: `full`.
*   **Secondary:** Ghost style. `outline` at 20% opacity. Text is `primary`.
*   **Status Indicator:** Use a `0.5rem` circle of `tertiary_fixed_dim` (#88d982) with a soft 4px glow of the same color to indicate "Online."

---

## 6. Do’s and Don’ts

### Do
*   **Do** prioritize white space. If a layout feels "full," increase the spacing scale.
*   **Do** use asymmetrical layouts (e.g., a narrow sidebar against a wide content area).
*   **Do** use `title-lg` for section headers to maintain an editorial hierarchy.
*   **Do** use the `tertiary` green status dot sparingly to draw attention only where necessary.

### Don’t
*   **Don't** use 1px solid borders to separate sections or list items.
*   **Don't** use pure black (#000000) for text; it is too harsh for the "Precisionist" aesthetic.
*   **Don't** use aggressive, fast animations. Transitions should be subtle (200ms - 300ms) and use an "ease-out" cubic-bezier.
*   **Don't** crowd the cards. Every data point needs room to be "inspected."