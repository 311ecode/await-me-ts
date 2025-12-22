# ⚡ await-me-ts

**High-performance declarative async error handling — TypeScript-first**

Write clean, linear "happy path" code without nested `try/catch` blocks.

**Current status:** experimental / early v1 (December 2025)  
**Target audience:** TypeScript users on modern Node.js (22+ with `--experimental-strip-types`)  
**Bundle size:** ~1.2–1.8 kB (minified)

### Looking for the browser / older Node / production-ready bundle?

→ Go to [**await-me** — the pre-bundled, ES2015+ JavaScript distribution](https://www.npmjs.com/package/await-me)

## Core Idea in 30 seconds

```ts
// Before (classic pain)
let user;
try {
  user = await db.users.find(id);
} catch (e) {
  if (e.code === 404) return notFound();
  logger.error(e);
  return serverError();
}

// After (await-me-ts)
const user = await valueOf(
  db.users.find(id),
  { error: "User fetch failed" }
);

if (!user) return notFound();
console.log(user.name); // ← no try/catch, happy path
```

## The "Big Three" — 90% of use-cases

| Function       | Success return          | Failure return         | Best for                                      | Safe with falsy values? |
|----------------|--------------------------|------------------------|-----------------------------------------------|--------------------------|
| `valueOf<T>`   | `T`                      | `false`                | Most data fetching                            | **No**                   |
| `isSuccess`    | `true`                   | `false`                | Mutations, status checks, fire-and-forget     | **Yes**                  |
| `toResult<T>`  | `{ success: true, data: T }` | `{ success: false, error }` | When `false`/`null`/ `0` are valid results | **Yes**                  |

### Real-world quick examples

```ts
// 1. Classic data fetch
const profile = await valueOf(getProfile(id), "Profile unavailable");
if (!profile) return;

// 2. Mutation / side-effect
if (await isSuccess(deletePost(id), { success: "Post deleted" })) {
  refreshFeed();
}

// 3. Safe with boolean / null / 0 values
const isActive = await toResult(checkSubscription(userId));
if (!isActive.success) return;
if (!isActive.data) showUpgradeWall();
```

## All Return Styles (customizable)

```ts
import { createAsyncHandler, RETURN_STYLES } from 'await-me-ts';

const custom = createAsyncHandler({
  returnStyle: RETURN_STYLES.FALSE_STYLE, // ← most popular
  // ... other options
});
```

| Style           | Success            | Failure            | Typical feeling                     |
|-----------------|--------------------|--------------------|-------------------------------------|
| `FALSE_STYLE`   | value              | `false`            | "if (!x) return" — very common      |
| `GO_STYLE`      | `[null, value]`    | `[err, null]`      | Go/Rust explicit style              |
| `BOOLEAN`       | `true`             | `false`            | Pure status                         |
| `ONLY_ERROR`    | `0`                | `1`                | Unix exit codes                     |
| `ERROR_STYLE`   | value              | `Error`            | Middleware + eventual throw         |

## Powerful conditional error handling (waterfall)

```ts
const safeApi = createAsyncHandler({
  returnStyle: RETURN_STYLES.FALSE_STYLE,
  conditionalHandlerChain: [
    { ifTrue: e => e?.code === 404, doIt: () => {} },                    // silent expected
    { ifTrue: e => e?.code === 401, doIt: () => redirectToLogin() },
    { ifTrue: e => e?.code === 429, doIt: () => showRateLimitToast() }
  ],
  defaultHandler: err => {
    sentry.captureException(err);
    console.error("Critical:", err);
  }
});

const data = await safeApi(fetch("/api/sensitive"));
if (!data) return; // ← already handled smartly
```

## Smart logging & side-effects

```ts
await valueOf(
  saveDraft(content),
  {
    success: { fn: () => toast.success("Saved!") },
    error:   "Failed to save draft"
  }
);
```

## Installation & modern Node usage

```bash
npm install await-me-ts
```

```bash
node --experimental-strip-types src/index.ts
```

## Philosophy & Trade-offs

✅ **Pros**

- Removes almost all `try/catch` noise
- Very linear readable code
- Excellent for expected errors (404, 403, 429, validation…)
- Tiny runtime overhead
- Good TypeScript inference in most cases

⚠️ **Cons / gotchas**

- `valueOf` is **not safe** when legitimate value can be `false`/`null`/`0`
- Conditional chain is **first match wins** (order matters!)
- No built-in timeout/retry (use your favorite library before wrapping)
- Still young library — API might change (2025–2026)

## Alternatives comparison (2025 perspective)

Library                   | Style                     | Zero try/catch | Conditional dispatch | Distinguish falsy success | Bundle size (approx)
-------------------------|---------------------------|----------------|-----------------------|----------------------------|----------------------
`await-me-ts`            | false / go / result       | Yes            | Yes                   | Yes (with `toResult`)      | ~1.2–1.8 kB
`neverthrow`             | Result type               | Partial        | No                    | Yes                        | ~3–4 kB
`ts-results` / `result`  | Railway oriented          | Partial        | Limited               | Yes                        | ~2–5 kB
`effect` / `Effect-TS`   | Full FP effect system     | Yes            | Yes                   | Yes                        | 30+ kB
classic try/catch + libs | —                         | No             | Manual                | Yes                        | —


Happy shielding! 🛡️
