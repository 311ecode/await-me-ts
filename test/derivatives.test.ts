import test from 'node:test';
import assert from 'node:assert/strict';

// Import directly from the TS source
import { valueOf, isSuccess, toResult } from '../src/derivatives/index.ts';

// --- Mock Setup ---
const fetchSuccess = <T>(data: T): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), 1));

const fetchFailure = (code: number, message: string): Promise<never> => 
    new Promise((_, reject) => {
        setTimeout(() => {
            const error = new Error(message) as any;
            error.code = code;
            reject(error);
        }, 1);
    });

// Utility to spy on console
function spyConsole() {
    const originalError = console.error;
    const originalLog = console.log;
    const calls = { error: [] as any[][], log: [] as any[][] };

    console.error = (...args: any[]) => { calls.error.push(args); };
    console.log = (...args: any[]) => { calls.log.push(args); };

    return {
        calls,
        restore: () => {
            console.error = originalError;
            console.log = originalLog;
        }
    };
}

// --- valueOf Tests ---

test('valueOf: should return data on success', async () => {
    const successData = { count: 10 };
    const result = await valueOf(fetchSuccess(successData));
    assert.deepStrictEqual(result, successData);
});

test('valueOf: should return false on failure', async () => {
    const result = await valueOf(fetchFailure(500, 'Error'));
    assert.strictEqual(result, false);
});

test('valueOf: should log error message if provided as string', async () => {
    const spy = spyConsole();
    try {
        const result = await valueOf(fetchFailure(500, 'Boom'), 'Custom Error Msg');
        assert.strictEqual(result, false);
        assert.strictEqual(spy.calls.error.length, 1);
        assert.strictEqual(spy.calls.error[0][0], 'Custom Error Msg');
    } finally {
        spy.restore();
    }
});

test('valueOf: should log success/error based on config object', async () => {
    const spy = spyConsole();
    try {
        await valueOf(fetchSuccess({}), { success: 'Got it!' });
        assert.strictEqual(spy.calls.log[0][0], 'Got it!');

        await valueOf(fetchFailure(500, 'Err'), { error: 'Missed it!' });
        assert.strictEqual(spy.calls.error[0][0], 'Missed it!');
    } finally {
        spy.restore();
    }
});

test('isSuccess: should return true on success', async () => {
    const result = await isSuccess(fetchSuccess('payload'));
    assert.strictEqual(result, true);
});

test('toResult: should distinguish between failure and successful falsy data', async () => {
    const resultOk = await toResult(fetchSuccess(false));
    assert.strictEqual(resultOk.success, true);
    assert.strictEqual(resultOk.data, false);
    assert.strictEqual(resultOk.error, null);

    const resultFail = await toResult(fetchFailure(500, 'Crash'));
    assert.strictEqual(resultFail.success, false);
    assert.strictEqual(resultFail.data, null);
    assert.ok(resultFail.error instanceof Error);
});
