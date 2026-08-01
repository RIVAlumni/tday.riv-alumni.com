# Coding Guidelines

- Always use shadcn-svelte components where available.
- Vertical alignment makes things more readable and easier to batch edit.
- Anything reusable should be part of the `$lib` directory.
- Always sort the imports in this order
  1. External type imports (e.g., import type { Date } from '...')
  2. External module imports (e.g., import Timestamp from 'firebase/firestore')
  3. Internal module imports (e.g., import Data from '$lib/data')
  4. Relative imports (e.g., import Charts from './charts.svelte')
- Try to follow the existing patterns in the code (indentation, spaces, etc.). In case of doubt, use prettier to format the added code.
- Always use 2 spaces instead of tabs.

# Naming Conventions

- Use `camelCase` for function, variable, and method names: `getCountdownState`, `visitorAuth`
- Use `PascalCase` for types, interfaces, and Svelte components: `Registration`, `EventStats`, `DataTable`
- Use `UPPER_SNAKE_CASE` for module-level constants: `USE_EMULATORS`, `VISITOR_CONFIG`
- Use kebab-case for file names: `countdown.ts`, `input-search-qr.svelte`
- Svelte 5 rune files use `.svelte.ts` extension: `auth.svelte.ts`, `store.svelte.ts`
