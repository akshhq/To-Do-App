# To-Do App

A minimal, beginner-friendly to-do list built with plain HTML, CSS, and JavaScript (no frameworks, no build step).

## File structure

```
todo-app/
├── index.html   → page structure (markup only)
├── style.css    → all styling and layout
├── script.js    → all app logic (DOM manipulation, CSV storage)
└── README.md    → this file
```

## How to run it

Just open `index.html` in any browser. Because the three files sit in the same folder and are linked by relative paths, everything works locally with no server or install step.

## How it works

- **Storage**: tasks are saved to `localStorage` as a real CSV string (`id,text,deadline,completed,createdAt`), parsed and written with hand-written helper functions in `script.js` — no CSV library needed.
- **Checkboxes**: toggle a task's `completed` state and move it into the Completed view.
- **Deadlines**: a native date picker; each task shows a badge that turns amber ("Today") or red ("Overdue") automatically.
- **Bottom-left button**: switches between the active list and the completed/history list.
- **Bottom-right button**: a round `+` button that opens a bottom sheet to add a new task.

## Editing it

- Change colors/fonts → `style.css` (all values are defined once at the top as CSS variables under `:root`).
- Change behavior (add fields, sorting, etc.) → `script.js`.
- Change layout/markup → `index.html`.
