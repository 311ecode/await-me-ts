# ⚡ AI Refactoring Guide: await-me-ts

Use this guide to identify "Naked Awaits" or "Try/Catch Noise" and replace them with high-performance derivatives.

---

## 🔍 Refactoring Logic (The AI Decision Tree)

### 1. Pattern: Side-Effect / Fire-and-Forget
**Visual Smell:** `try { await doSomething(); } catch { ... }` where the return value isn't used.
**Tool:** `isSuccess(promise, config?)`
**Implementation:**
```ts
// Before
try {
  await api.updateProfile(data);
  toast.success("Saved");
} catch (e) {
  console.error(e);
}

// After
if (await isSuccess(api.updateProfile(data), { success: "Saved", error: "Failed" })) {
  closeModal();
}

```

### 2. Pattern: Standard Data Fetching

**Visual Smell:** `let data; try { data = await fetch(); } ...`
**Tool:** `valueOf<T>(promise, config?)`
**Requirement:** Use ONLY if `T` cannot naturally be `false`.
**Implementation:**

```ts
// Before
const user = await api.getUser(id).catch(() => null);
if (!user) return;

// After
const user = await valueOf(api.getUser(id), "User not found");
if (!user) return; // Flow stops on failure or null-ish result

```

### 3. Pattern: Truthy/Falsy Data & Complex Results

**Visual Smell:** Functions returning `boolean`, `number`, or `null` as valid data.
**Tool:** `toResult<T>(promise, config?)`
**Implementation:**

```ts
// Before
try {
  const isPremium = await checkSub(id);
  if (isPremium === false) showAds();
} catch (e) {
  handleError(e);
}

// After
const res = await toResult(checkSub(id));
if (!res.success) return handleError(res.error); 
if (res.data === false) showAds(); // res.data is safe from 'the false-positive trap'

```

---

## 🛠️ Configuration & Side Effects

The `config` argument (LogConfig) is a powerful way to inject logic without adding lines.

| Config Input | AI Action |
| --- | --- |
| `string` | Treat as `console.error(string, error)` on failure. |
| `{ error: string }` | Simple error log. |
| `{ success: string }` | Simple success log. |
| `{ success: { fn: Function, params: [] } }` | Execute side-effect on success. |

**Example of complex AI implementation:**

```ts
const user = await valueOf(signIn(), {
  success: { fn: redirect, params: ['/dashboard'] },
  error: "Sign-in failed. Please check credentials."
});

```

## ⚠️ Safety Constraints for AI Agents

1. **Avoid the "Falsy Trap":** Do NOT use `valueOf` if the underlying promise can resolve to `false` or `0` as a valid success state. Use `toResult` instead.
2. **Generic Enforcement:** Always prefer passing the type, e.g., `valueOf<User>(...)`, to maintain the TypeScript "Happy Path."
3. **No Nested Try/Catch:** If the AI finds itself writing a `try/catch` inside a handler, it should move that logic to a `conditionalHandlerChain` using `createAsyncHandler`.

---

