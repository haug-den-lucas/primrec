# Primitive Recursive Simulator

A web-based interactive simulator for defining and evaluating **primitive recursive functions**. Functions can be defined using primitive recursion or composition from basic primitive recursive functions (successor $s(n) = n + 1$, zero/constant functions, and projection/parameter functions).

## Features

- **Modern UI**: Built with Bootstrap 5 and Vue 3 for a smooth, reactive user experience.
- **Interactive Function Builder**: Construct primitive recursive functions step-by-step with visual tree components.
- **Predefined & Custom Functions**: Built-in definitions for `add` and `mult`, with support for creating custom functions.
- **Import / Export**: Save and load function definitions in JSON format or persist them via `localStorage`.

## Tech Stack

- **HTML5 & CSS3** (Custom styles in `css/own.css`)
- **Bootstrap 5** for UI styling and layout
- **Vue 3** for reactive DOM rendering and state management
- **JavaScript ES6+ Modules** (`js/data.js`, `js/calc.js`, `js/app.js`)

## Usage

Simply serve the repository using any standard static HTTP server (e.g. `python3 -m http.server`) and open `index.html` in your browser.

## Notes & Limitations

- The evaluation engine simulates primitive recursion step-by-step. Complex recursive expressions with large inputs may encounter call stack limitations.
- Contributions and improvements are welcome! Feel free to open a pull request.
