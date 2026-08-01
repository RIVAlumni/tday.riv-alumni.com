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

# Naming Guidelines

- Use `snake_case` for function, variable and type names
- Naming usually optimizes for longest common prefix (see https://github.com/ggml-org/ggml/pull/302#discussion_r1243240963)

  ```cpp
  // not OK
  int small_number;
  int big_number;

  // OK
  int number_small;
  int number_big;
  ```

- The general naming pattern is `<class>_<method>`, with `<method>` being `<action>_<noun>`

  ```cpp
  llama_model_init();           // class: "llama_model",         method: "init"
  llama_sampler_chain_remove(); // class: "llama_sampler_chain", method: "remove"
  llama_sampler_get_seed();     // class: "llama_sampler",       method: "get_seed"
  llama_set_embeddings();       // class: "llama_context",       method: "set_embeddings"
  llama_n_threads();            // class: "llama_context",       method: "n_threads"
  llama_adapter_lora_free();    // class: "llama_adapter_lora",  method: "free"
  ```

  - The `get` `<action>` can be omitted
  - The `<noun>` can be omitted if not necessary
  - The `_context` suffix of the `<class>` is optional. Use it to disambiguate symbols when needed
  - Use `init`/`free` for constructor/destructor `<action>`
