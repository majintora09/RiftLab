# Task Request

Status:
Completed on 2026-06-18.

## Objective

Perform a focused bugfix and usability pass.

The goal is to improve content readability, mobile usability, and Team Builder functionality before adding new features.

---

## Scope

### 1. Character Page Formatting

Current imported content is rendering incorrectly.

Examples:

* "This pickNeutralThis pickControl..."
* Assist descriptions merging together.
* Missing separators between imported content blocks.

Implement proper structured rendering using CONTENT_GUIDELINES.md.

Assist sections should render as:

Provides:

* Item
* Item

Best For:

* Item
* Item

Why:

* Explanation

Tags:
[Tag]
[Tag]

DHC notes should render using structured sections rather than paragraphs.

---

### 2. Mobile Team Builder

Current mobile mode only displays one fighter slot even when 3/3 fighters are locked.

Expected:

All three team members remain visible.

Acceptable layouts:

* Vertical stack
* Compact cards

Not acceptable:

* Only one visible fighter

Investigate:

* Mobile rendering logic
* Responsive breakpoints
* Hidden or overflowed slots

---

### 3. Knowledge Map Mobile UX

Current mobile Knowledge Map sidebar is too large.

Users must scroll excessively before seeing the selected node.

Replace the permanent sidebar with a mobile-friendly solution.

Preferred:

* Collapsible drawer
* Slide-out panel
* Open Browser button

Goal:

Show selected node information immediately on mobile.

---

## Out Of Scope

Do not:

* Add AI features
* Add new pages
* Rebuild the visual identity
* Implement Movie Room automation
* Implement admin editing yet

This is a bugfix and polish pass only.

---

## Success Criteria

* Character page content renders cleanly.
* Assist descriptions are readable.
* DHC notes are structured.
* Mobile Team Builder shows all 3 fighters.
* Knowledge Map is usable on mobile.
* Existing desktop experience remains intact.

---

## Notes

Prioritize usability over new features.

This task should improve the quality of the existing experience before expanding functionality.

Update CHANGELOG.md after completion.

Generate a fresh Netlify deployment ZIP.
