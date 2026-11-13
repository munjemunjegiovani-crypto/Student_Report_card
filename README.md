# Report card page

A printable report card for a school management system. One HTML page reads a
student's data from `data.js`, calculates the results, and prints on one A4 page.
It works in English and French.

## Files

| File | Job |
|------|-----|
| `index.html` | The page structure and the language / print buttons |
| `style.css` | The look on screen and the print rules (A4, no buttons on paper) |
| `script.js` | Loads the data, does the calculations, draws the report card |
| `data.js` | School, subjects, students (a JSON object) and which report card to show |

## Run it on your computer

Unzip the folder and double-click `index.html`. It opens in your browser. No server or install needed.

## How to use it

- **Change the student:** edit `"show_report_card_for"` in `data.js` to another student `id`.
- **Switch language:** use the English / Français buttons, or open `?lang=fr` in the link.
- **Print:** press the Print button or `Ctrl+P`. The buttons are hidden on paper and the card fits one A4 page.

## How the results are calculated

- **Weighted average** = sum of (mark × coefficient) ÷ sum of coefficients, shown with 2 decimals.
- **Rank** = 1 + the number of students with a strictly higher weighted average (tied students share a rank).
- **Class average** = the mean of all students' weighted averages.
- **Teacher's remark** per subject follows `remark_rule` in `data.js`
  (18+ Excellent, 15+ Very good, 13+ Good, 11+ Average, 10+ Fair, under 10 Weak, work harder).

## Result for the sample data (CBE-2026-0145, FOUDA Jean Bosco)

Weighted average 10.45 / 20, rank 7 of 12, class average 10.97 / 20.

## Assumptions

- `data.js` has no individual teacher comments, so the remarks come from the remark rule.
- The logo is empty in the sample data, so the page shows the school's initials.
  Put an image path in `school.logo` to show a real logo.

## Deploy

This repository is a static site: `index.html` is at the root, so no build step is needed.
Connect the GitHub repository in Netlify (build command: none, publish directory: `.`), or drag this whole folder into Netlify.
