# Primitive Recursive Simulator

A web-based interactive simulator for defining and evaluating **primitive recursive functions**. Functions can be defined using primitive recursion or composition from basic primitive recursive functions (successor $s(n) = n + 1$, zero/constant functions, and projection/parameter functions).

**Try it out [here](https://lucashaug.de/primrec/)**


## Features

- **Interactive Function Builder**: Construct primitive recursive functions step-by-step with visual tree components.
- **Predefined & Custom Functions**: Built-in definitions for `add` and `mult`, with support for creating custom functions.
- **Import / Export**: Save and load function definitions in JSON format or persist them via `localStorage`.

## Notes & Limitations

- The evaluation engine simulates primitive recursion step-by-step. Complex recursive expressions with large inputs may encounter call stack limitations.
- Contributions and improvements are welcome! Feel free to open a pull request.
