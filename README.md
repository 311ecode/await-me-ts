# ⚡ await-me-ts

**High-performance declarative async error handling for TypeScript**  
Stop writing nested `try/catch` everywhere. Write clean, linear "happy path" code with strong type safety.

Current status: **experimental / early-stage** (Dec 2025)  
Target: Node.js 22+ with `--experimental-strip-types`

## Core Idea in 30 seconds

```ts
// Classic nightmare style
let user: User | undefined;
try {
  user = await db.users.findById(id);
} catch (err) {
  if (err.code === 404) return notFound();
  logger.error("Database exploded", err);
  return serverError();
}

// await-me-ts style (FALSE_STYLE)
const user = await valueOf(
  db.users.findById(id),
  { error: "User fetch failed" }
);

if (!user) return notFound();         // ← 404 is already handled & logged internally
console.log(user.name);               // ← happy path, no try/catch
```

## The "Big Three" — Most people only need these

| Function       | Returns on success      | Returns on failure     | Best when you want to...                                | Safe when data can be `false`/`0`/`null`? |
|----------------|--------------------------|------------------------|----------------------------------------------------------|--------------------------------------------|
| `valueOf<T>`   | `T`                      | `false`                | Quick data fetch, `false` means failure is obvious      | **NO**                                     |
| `isSuccess`    | `true`                   | `false`                | Fire-and-forget, status checks, mutations               | Yes                                        |
| `toResult<T>`  | `{ success:true, data:T }` | `{ success:false, error, data:null }` | Need to distinguish `false`/`null` as **valid** data | **YES**                                    |

### Quick comparison examples

```ts
// 1. Getting data — most common case
const profile = await valueOf(getUserProfile(id), "Profile unavailable");
if (!profile) return;

// 2. Just want to know if operation succeeded
if (await isSuccess(deleteUser(id), { success: "User deleted!" })) {
  refreshList();
}

// 3. Data can be legitimately false / null / 0
const subscription = await toResult(checkActiveSubscription(userId));
if (!subscription.success) {
  // network/db error
  return;
}
if (!subscription.data) {
  showUpgradeScreen();
}
```

## All supported Return Styles

You can customize behavior using `createAsyncHandler({ returnStyle: ... })`

| Style           | Success       | Failure         | Typical use-case                              | Readable pattern       |
|-----------------|---------------|-----------------|-----------------------------------------------|------------------------|
| `FALSE_STYLE`   | `T`           | `false`         | Most common — quick shield + happy path       | `if (!value) return`   |
| `GO_STYLE`      | `[null, T]`   | `[Error, null]` | People who like explicit Go/Rust style        | `if (err) return`      |
| `BOOLEAN`       | `true`        | `false`         | Status checks only                            | `if (await op()) {}`   |
| `ONLY_ERROR`    | `0`           | `1`             | Unix/shell style exit codes                   | (rare in TS)           |
| `ERROR_STYLE`   | `T`           | `Error`         | You want to throw anyway but with middleware  | (advanced)             |

## Advanced control: Conditional error handling (waterfall style)

```ts
const safeApiCall = createAsyncHandler({
  returnStyle: RETURN_STYLES.FALSE_STYLE,

  // First match wins — order matters!
  conditionalHandlerChain: [
    // 404 → silent (expected)
    {
      ifTrue: e => e.code === 404 || e.status === 404,
      doIt:  () => {} // nothing, very quiet
    },

    // Auth → redirect (client side usually)
    {
      ifTrue: e => e.code === 401 || e.status === 401,
      doIt:  () => redirectToLogin()
    },

    // Rate limit → special message
    {
      ifTrue: e => e.code === 429,
      doIt:  () => showToast("Rate limit exceeded. Try again in a minute.")
    }
  ],

  // Everything else → serious error
  defaultHandler: err => {
    reportToSentry(err);
    console.error("Critical API failure:", err);
  }
});

const data = await safeApiCall(fetch("/api/protected/data"));
if (!data) return; // ← handled according to rules above
```

## Logging & side-effects (very useful in practice)

All three main helpers accept second argument of type:

```ts
type LogConfig =
  | string                                 // simple message
  | {
      success?: string | { fn: Function, params?: any[] };
      error?:   string | { fn: Function, params?: any[] };
    };
```

Examples that appear in real apps very often:

```ts
// Simple string messages
await valueOf(saveDraft(), "Failed to save draft");

// Different messages + side effects
await isSuccess(
  sendAnalyticsEvent(event),
  {
    success: "Event tracked",
    error:   { fn: showErrorToast, params: ["Analytics unavailable"] }
  }
);

// Complex real-world example
const user = await valueOf(
  fetchUserWithCache(id),
  {
    success: { fn: updateUserCache, params: [id] },
    error:   [
      "User fetch failed",
      { fn: captureMessage, params: ["user_fetch_failed", { id }] }
    ]
  }
);
```

## Installation & usage (2025 / Node 22+)

```bash
npm install await-me-ts
```

```ts
// Recommended tsconfig (for --experimental-strip-types)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "stripInternal": true,
    "noEmit": true,           // only type checking
    "allowJs": true
  }
}
```

Run examples:

```bash
node --experimental-strip-types example.ts
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

