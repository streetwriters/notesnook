# Block virtualization test harness

Drives the real virtualization modules (`src/extensions/virtualization/*`) on a
plain ProseMirror view in headless Chrome and asserts the design-doc
correctness claims (docs/editor-performance).

```bash
# from packages/editor
node_modules/.bin/esbuild .paging-test/entry.ts --bundle --format=iife \
  --outfile=.paging-test/bundle.js --loader:.ts=ts
node .paging-test/run.mjs
```

Requires Google Chrome (override with `CHROME_PATH=...`) and `playwright-core`
installed anywhere in the monorepo. Checks: placeholder rendering, off-screen
content absent from DOM but present in state, select-all spans the whole doc,
scroll materialization, caret-block always rendered, off-screen editing, state
integrity, and a 400-op random-edit stress pass.
