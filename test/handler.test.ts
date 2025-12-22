import test from 'node:test';
import assert from 'node:assert/strict';

import { createAsyncHandler, RETURN_STYLES } from '../src/index.ts';

// --- Mock Async Functions ---
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

// --- GO_STYLE Tests ---

test('GO_STYLE: should return [null, data] on success', async () => {
    const goWrapper = createAsyncHandler({ returnStyle: RETURN_STYLES.GO_STYLE });
    const successData = { user: 'Bob' };
    const [err, data] = await goWrapper(fetchSuccess(successData));
    
    assert.strictEqual(err, null);
    assert.deepStrictEqual(data, successData);
});

test('FALSE_STYLE: should return false when conditional handler matches', async () => {
    let handlerExecuted = false;
    const falseWrapper = createAsyncHandler({ 
        returnStyle: RETURN_STYLES.FALSE_STYLE,
        conditionalHandlerChain: [
            {
                ifTrue: (e: any) => e.code === 404,
                doIt: () => { handlerExecuted = true; }
            }
        ]
    });
    const result = await falseWrapper(fetchFailure(404, 'Post not found'));
    
    assert.strictEqual(result, false);
    assert.strictEqual(handlerExecuted, true);
});

test('ONLY_ERROR: should return 0 on success', async () => {
    const onlyErrorWrapper = createAsyncHandler({ returnStyle: RETURN_STYLES.ONLY_ERROR });
    const result = await onlyErrorWrapper(fetchSuccess(123));
    assert.strictEqual(result, 0);
});
