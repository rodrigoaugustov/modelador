# Design System Strategy: The Precision Architect

## 1. Overview & Creative North Star
The "Precision Architect" is the creative North Star for this design system. In the world of data modeling, complexity is the enemy. This system rejects the cluttered, line-heavy aesthetic of legacy enterprise software in favor of a **High-End Editorial** experience. 

We are moving away from "The Spreadsheet Look" and toward "The Digital Blueprint." By utilizing intentional asymmetry, tonal layering instead of borders, and high-contrast typography, we create an environment where technical data feels curated rather than dumped. The goal is to provide a "quiet" interface that recedes when the user is focused on logic, yet provides high-fidelity feedback during interaction.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a sophisticated neutral range (`surface` to `surface-container-highest`) to minimize cognitive load, with `primary` (#0053db) acting as a surgical strike of color for intent.

### The "No-Line" Rule
To achieve a premium, modern feel, **1px solid borders are prohibited for sectioning.** We define boundaries through background color shifts. 
*   **Editor Canvas:** Use `surface` (#f7f9fb).
*   **Side Panels:** Use `surface-container-low` (#f0f4f7) to subtly distinguish the workspace from tools.
*   **Toolbars:** Use `surface-container` (#e8eff3) to create a clear "anchor" at the top of the viewport.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
*   **Level 0 (Base):** `surface`
*   **Level 1 (Panels):** `surface-container-low`
*   **Level 2 (In-panel Cards/Groups):** `surface-container-highest`
*   **Level 3 (Modals/Popovers):** `surface-container-lowest` (#ffffff) with Glassmorphism.

### The "Glass & Gradient" Rule
For floating elements like "Add Entity" menus or property popovers, use **Glassmorphism**. Apply `surface-container-lowest` at 85% opacity with a `backdrop-blur` of 12px. This prevents the UI from feeling "pasted on" and allows the underlying data model to softly bleed through. For primary CTAs, apply a subtle linear gradient from `primary` (#0053db) to `primary_dim` (#0048c1) to add a "jewel-like" depth.

---

## 3. Typography: Technical Clarity
We utilize a dual-font strategy to balance character and readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `headline-sm` (1.5rem) for panel titles and `display-sm` (2.25rem) for empty-state messaging. The wide apertures of Manrope convey a modern, open feel.
*   **Data & Body (Inter):** The workhorse. Use `body-md` (0.875rem) for property labels and `label-sm` (0.6875rem) for metadata. Inter’s high x-height ensures that complex strings of data remain legible even at small scales.
*   **Hierarchy:** Always use `on_surface_variant` (#566166) for labels to create a clear visual distinction from the actual data values, which should remain in `on_surface` (#2a3439).

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders are replaced by **Ambient Depth**.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. This "soft lift" feels more architectural and less like a standard web template.
*   **Ambient Shadows:** For high-elevation elements (Modals), use a multi-layered shadow: `0px 10px 30px rgba(42, 52, 57, 0.06)`. Note the use of the `on_surface` color as the shadow tint rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-contrast modes), use `outline-variant` (#a9b4b9) at **15% opacity**. This creates a "Ghost Border" that defines the shape without interrupting the visual flow.

---

## 5. Components: Editor-Specific UI

### Toolbars & Property Grids
*   **Toolbars:** Horizontal strips using `surface-container`. Icons should use `on_surface_variant`. Active states use `primary_container` (#dbe1ff) with `on_primary_container` (#0048bf) text.
*   **Property Grids:** Forbid the use of divider lines between rows. Use a 4px vertical gap and a subtle background change (`surface-container-high`) on hover to indicate the active row.

### Buttons & Interaction
*   **Primary Button:** `primary` background, `on_primary` text. Use `xl` (0.75rem) roundedness to make it feel approachable.
*   **Secondary/Tertiary:** Avoid boxes. Use `label-md` with `primary` text and no background. On hover, apply a `surface-container-highest` ghost background.
*   **Chips:** Use `secondary_container` (#d3e4fe) with `on_secondary_container` (#435368). These should be perfectly pill-shaped (`full` roundedness).

### Technical Input Fields
*   **Text Inputs:** Use `surface-container-lowest` with a `sm` (0.125rem) roundedness to keep the technical, "sharp" feel. The focus state should not be a thicker border, but a subtle glow using `primary` at 20% opacity and a `primary` "Ghost Border."

### The "Schema Card" (Custom Component)
For the visual editor nodes:
*   **Header:** `surface-container-highest` background, `title-sm` typography.
*   **Body:** `surface-container-lowest` background. 
*   **Interaction:** On select, the card should scale by 1.02x and gain a `primary` 2px outer glow (not a border).

---

## 6. Do’s and Don’ts

### Do:
*   **Use Whitespace as a Divider:** Trust the `body-md` line height and layout margins to separate data points.
*   **Nesting Surfaces:** Always move from darker/muted backgrounds (`surface-dim`) to lighter foregrounds (`surface-container-lowest`) to guide the eye "upward."
*   **Subtle Accents:** Use `tertiary` (#5b5d78) for non-essential technical tags (e.g., "Foreign Key" indicators) to keep them distinct from primary actions.

### Don’t:
*   **Never use 100% Opaque Borders:** This shatters the "editorial" feel and makes the app look like an old-school IDE.
*   **Avoid Pure Black/Grey Shadows:** Always tint shadows with the `on_surface` token to maintain a professional, tonal depth.
*   **No Grid Lines:** In the property grid or sidebars, do not use lines to separate content. Use the spacing scale (e.g., `8px` or `16px`) to create distinction.