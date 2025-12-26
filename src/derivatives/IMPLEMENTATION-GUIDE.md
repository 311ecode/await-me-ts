# 📖 Implementation Guide: Simplified Async Patterns

While the core `createAsyncHandler` provides maximum flexibility for complex error dispatching, most daily tasks fall into two categories:
1. **Fetching data** (where we want the result).
2. **Checking status** (where we only care if an operation succeeded).

---

## 🏗️ Semantic Selection: Which one to use?

| Use Case | Recommended Derivative | Logic |
| :--- | :--- | :--- |
| **Data Retrieval** | `valueOf(promise, ...)` | Returns `<T>` or `false`. |
| **Action Validation** | `isSuccess(promise, ...)` | Returns `true` or `false`. |
| **Ambiguous Data** | `toResult(promise, ...)` | Returns `{ success, data, error }`. |

---

## ⚡ The "Audit Your Awaits" Initiative

The biggest risk in modern JavaScript is a "naked" `await`—a promise call without a surrounding `try/catch`. These are silent time bombs. 

**Audit your code: everywhere you see `const x = await ...`, consider replacing it with a derivative.**



### 1. The `valueOf` Pattern (Data-First)
Best for fetching objects or strings where a `false` return clearly indicates a failure.

```javascript
import { valueOf } from 'await-me-ts/derivatives';

const user = await valueOf(fetchUser(id), "User not found");
if (!user) return; // Flow stops if fetch failed

```

### ⚠️ The "False-Positive" Trap

**Warning:** If your API can return a literal `false` as valid data (e.g., `await checkSubscriptionStatus()`), `valueOf` is **not** suitable because you cannot distinguish success-returning-false from a crash.

In these cases, use the **Result Object** pattern:

### 2. The `toResult` Pattern (Class-like Structure)

If you need to distinguish between a "Failure" and a "Success that returned a falsy value," use `toResult`.

#### ✅ Safe for Boolean/Number Data

```javascript
import { toResult } from 'await-me-ts/derivatives';

const result = await toResult(checkSubscription(id));

if (!result.success) {
    console.error("Network failed", result.error);
    return;
}

// Now result.data can safely be 'false' or '0'
if (result.data === false) {
    promptUpgrade();
}

```

---

### 3. The `isSuccess` Pattern (Logic-First)

Replace awaits where the returned value is just a confirmation of work.

```javascript
import { isSuccess } from 'await-me-ts/derivatives';

// Replaces try/catch block just to get a boolean status
if (await isSuccess(db.users.delete(id))) {
    notify("User removed successfully");
}

```

---

## 🛠️ Advanced Logging & Side Effects

All derivatives support a secondary `messageOrConfig` argument. This allows you to attach side effects without breaking the one-liner flow.

```javascript
const ok = await isSuccess(saveRecord(data), {
    success: { fn: refreshUI, params: [currentId] },
    error: "Database write failed"
});

```

## 🎯 Summary

**If you see an `await`, wrap it.**

* Use **`valueOf`** for quick data retrieval.
* Use **`toResult`** if the data itself could be `false` or `null`.
* Use **`isSuccess`** when you only care about the operation succeeding.
