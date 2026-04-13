---
title: Review Notes
description: Consistency checks, completeness gaps, and recommendations
---

# Review Notes

## Consistency checks

No cross-document inconsistencies found. All component descriptions align with observed file structure and package.json names.

## Completeness gaps

### Areas with limited detail (language/access limitations)

1. **Mobile app internals**: `apps/mobile` is a large React Native codebase; only top-level structure was surveyed. Detailed screen-by-screen navigation, native modules, and the share extension are not fully documented.

2. **Desktop IPC router**: `apps/desktop/src/api/` was not read in full; the complete tRPC procedure list is not enumerated in `interfaces.md`.

3. **SQL schema**: The actual Kysely migration files in `packages/core/src/database/migrations.ts` were not fully read; column-level schema details are absent from `data_models.md`.

4. **Test infrastructure**: `packages/core/src/api/__tests__/` and test configs exist but were not analyzed. Testing patterns are undocumented.

5. **Theme system tokens**: The full design token set in `packages/theme/src/theme/` was not read.

6. **CI secrets / environment variables**: Workflow files reference secrets (signing certs, API keys) that are not inventoried.

7. **`packages/streamable-fs` internals**: The chunked streaming + IndexedDB implementation was not read in detail.

## Recommendations

- Run with `check_completeness=true` focused on `apps/mobile` and `apps/desktop/src/api/` for deeper coverage.
- Add column-level schema documentation once the migration files are fully read.
- Document the test patterns in a separate `testing.md` once the test files are surveyed.
- Consider adding `packages/streamable-fs` architecture details to `architecture.md` as it is a critical piece of the attachment pipeline.
