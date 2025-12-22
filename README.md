# ⚡ await-me-ts

The high-performance core engine for declarative async error handling in TypeScript. Stop nesting `try/catch` and start writing linear "Happy Path" code.

---

## 🏗️ The "Big Three" Derivatives
For 90% of use cases, these pre-configured utilities provide the cleanest syntax.

### 1. `valueOf<T>`
Returns the data or `false` on failure.
* **Best for:** Standard data fetching where `false` isn't a valid piece of data.
* **Signature:** `async function valueOf<T>(promise: Promise<T>, config?: LogConfig): Promise<T | false>`

```typescript
const user = await valueOf(fetchUser(1), "User not found");
if (!user) return; 
console.log(user.name);

```

### 2. `isSuccess`

Returns a simple `boolean`.

* **Best for:** Fire-and-forget actions or simple validation.
* **Signature:** `async function isSuccess(promise: Promise<any>, config?: LogConfig): Promise<boolean>`

```typescript
if (await isSuccess(db.users.delete(id), { success: "Deleted!" })) {
    notify("User removed");
}

```

### 3. `toResult<T>`

Returns an object: `{ success: boolean; data: T | null; error: E | null }`.

* **Best for:** APIs that might return `false` or `0` as valid successful data.

---

## 🚦 Understanding `RETURN_STYLES`

The `returnStyle` determines the shape of the output when using `createAsyncHandler`.

| Style | Success Output | Failure Output | Use Case |
| --- | --- | --- | --- |
| `GO_STYLE` | `[null, T]` | `[Error, null]` | Classic Go-lang pattern. |
| `FALSE_STYLE` | `T` | `false` | Data-or-False (Shielding logic). |
| `BOOLEAN` | `true` | `false` | Pure status checks. |
| `ONLY_ERROR` | `0` | `1` | Unix-style exit codes. |

---

## ⚙️ Advanced Control: `createAsyncHandler`

### 🌊 The Waterfall: `conditionalHandlerChain`

The `conditionalHandlerChain` follows a **"First Match Wins"** logic. It iterates through your array of handlers and stops as soon as one `ifTrue` returns `true`.

**Key Behaviors to Remember:**

1. **Stop on Match:** Once a condition is met, no subsequent handlers in the chain are checked.
2. **Shielding the Default:** If a handler matches, the `defaultHandler` is **not** executed. This is perfect for silencing "expected" errors (like 404s).
3. **Fallthrough:** If no conditions match, the `defaultHandler` runs (if defined).

### Example: Multi-Stage Handling

```typescript
const safeFetch = createAsyncHandler({
    returnStyle: RETURN_STYLES.FALSE_STYLE,
    conditionalHandlerChain: [
        {
            ifTrue: (err) => err.code === 404,
            doIt: () => console.warn("Missing: Silently skipping logs.")
        },
        {
            ifTrue: (err) => err.code === 401,
            doIt: () => redirectToLogin()
        }
    ],
    defaultHandler: (err) => reportToSentry(err)
});

```

## 🛠️ Performance & Environment

* **Native TS Support:** Optimized for Node.js 22.7+ using `--experimental-strip-types`.
* **JS Distribution:** For pre-bundled CJS/ESM, see [`await-me`](https://www.google.com/search?q=https://www.npmjs.com/package/await-me).

All derivatives use a shared internal Go-style handler to minimize memory overhead.
