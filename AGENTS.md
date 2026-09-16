# AI Agent Instructions

The PDFA-lab project is a toolchain for PDF manipulation and analysis, with
a loose focus on functionality required to upgrade PDF documents to the PDF/A
standard. It is meant as a supplement, not as an alternative to 'pdf-lib'.
Since 'pdf-lib' is currently unmaintainted, it uses the fork `@cantoo/pdf-lib`
under the hood.

## Monorepo Layout

| Directory                  | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `packages/core/`.          | The core functionality                          |
| `packages/fontkit/`        | A drop-in replacement for `@pdf-lib/fontkit`    |
| `apps/cli/`                | The command-line interface                      |

## Essential Commands

```bash
pnpm install                    # Install dependencies
pnpm test                       # Run Vitest tests (all packages)
pnpm check                      # Biome check (all packages)
pnpm check:fix                  # Biome check with automatic fix (all packages)
pnpm build                      # Build for publishing (all packages)
```

## Code Conventions

### General

- **ESM with `.js` extensions** in imports
- **`interface` over `type`** where possible
- **JSDoc required** on exported functions (first overload only for overload sets)
- **`// @__NO_SIDE_EFFECTS__`** before pure factory functions for tree-shaking
- **Tabs for indentation, spaces for formatting**

### `type` vs `interface`

When in doubt, prefer `interface` over `type`. Rationale: Interfaces offer
better compiler performance and allow downstream consumers to extend
definitions via declaration merging.

Use `type`:

* When an `interface` lacks a required language feature, such as:
  * Union types or discriminated unions.
  * Template literal types.
  * Conditional types using `infer`.
* When extension via declaration merging must be explicitly prevented.
* When the type is an array.
* For standalone function types (e.g., callbacks or event handlers). Rationale: Explicit type aliases are cleaner and more readable than anonymous interface signatures.
* For native arrays or standard utility mappings like `Record<K, T>` or `Partial<T>`. Rationale: Wrapping these constructs in an interface introduces unnecessary boilerplates and syntax friction.

Performance penalties of `type` combinations do not need to be heavily weighed, as compiler performance differences will probably mostly vanish with TypeScript 7.

## Other Rules

- **Source code is the single source of truth.** All documentation must match `{apps,packages}/*/src/`.
- **Lint and format after modifying code.** Run `pnpm run check` resp. `pnpm run check:fix` so that the source code meets the project styleguides.
- **Use the GitHub CLI for GitHub-related tasks.** Prefer `gh` for pull requests, issues, checks, and other GitHub operations.

## Background

Currently, 'pdf-lib' does not support upgrading PDF documents to PDF/A.
Because of the new e-invoicing requirements in the European union, set forth
in the European standard EN1931, there is a growing interest in upgrading
PDF documents to PDF/A. However, this feature would blow up 'pdf-lib'
significantly. Given the assumption that the vast majority of users of 'pdf-lib'
do not need this functionality, it is implemented in a separate project.

The project is work in progress. Upgrading a PDF document roughly requires
the following steps:

1. embed all currently not embedded fonts into the PDF document
2. embed a colour scheme if not present
3. embed XMP metadata satisfying the PDF/A requirements
4. apply a couple of other cosmetic changes to the PDF

Step number 1 is by far the most complex one. It can be sub-divided into these
steps for fonts that are currently not embedded:

1. extract all glyphs from all text blocks of the PDF document
2. map them to a degradation chain of Unicode code points
3. try to map them to glyphs present in a suitable replacement font
4. embed the resulting font subset

## About `fontkit`

Font embedding heavily relied on `@pdf-lib/fontkit` but this module is
unmaintained and has known bugs that make it less and less useful. The
drop-in replace in `packages/fontkit` aims at fixing this bug and migrating
the legacy code base to modern TypeScript standards.

## Language

Australian/British English is used throughout all components of the software.

Source code comments use proper language, terminating sentences with a full
stop, exclamation mark, or question mark. Formal spelling like "is not",
"cannot" is preferred over the informal versions like "isn't" or "can't".

Do not use spaces around slashes, when they separate two single words like
"with/without" or "Factur-X/ZUGFeRD". Use spaces, when they separate
multi-word phrases like in "Purpose / General Mode of Operation", even when just
one of the two is a multi-word phrase.

Always put a space before a unit or a percent sign. It is "5 m", "50 %",
and "37.2 °C".

Do not use spaces around phrases in any kind of parentheses.

Good:

- CIDFont (with subtypes CIDFontType0 and CIDFontType2)
- `if (Object.prototype.hasOwnProperty.call(something, 'else'))`

Bad:

- ~~CIDFont (with subtypes CIDFontType0 and CIDFontType2)~~
- ~~`if ( Object.prototype.hasOwnProperty.call( something, 'else' ) )`~~

## Issue Guidelines

Many issues are filed by people without a strong technical background. They often
file issues that are related to multiple problems, often unrelated. That
causes extra work for the maintainers.

This is less of a problem for a pull request, unless the commits are squashed
or cannot be reverted independently.

If an issue contains multiple unrelated problems (e.g. different bugs or
feature requests), suggest splitting it into separate issues.

For pull requests, do not request splitting unless it is clearly feasible
without extra work for the contributor.

Do not use labels like `invalid`, `invalid-multi-issue`, or `wontfix` that can
sound embarrassing for users and contributors. Apply labels based on the
touched topics instead.

## Agent Skills

This repository includes agent skills in `.agents/skills/` following the
[Agent Skills](https://agentskills.io) open standard.

**Naming:** Skills prefixed with repo- are local to this repository. Only these
should be invoked automatically by AI agents in this repo. External skills may
exist but require explicit usage.

In order to avoid duplication, most of the in-depth explanations for AI agents
are present in the correspondings skills in the `.agents/skills/` directory.
