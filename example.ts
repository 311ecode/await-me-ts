import { createAsyncHandler, RETURN_STYLES } from './src/index.ts';

const fetchSuccess = (data: any) => new Promise(resolve => setTimeout(() => resolve(data), 10));
const fetchFailure = (code: number, message: string) => 
    new Promise((_, reject) => {
        setTimeout(() => {
            const error = new Error(message) as any;
            error.code = code;
            reject(error);
        }, 10);
    });

// --- FALSE_STYLE Wrapper (The "Safe" Shield) ---
const safeWrapper = createAsyncHandler({
    returnStyle: RETURN_STYLES.FALSE_STYLE,
    conditionalHandlerChain: [
        {
            ifTrue: (e: any) => e.code === 404,
            doIt: (e: any) => console.warn(`>>> [SAFE] 404 handled.`)
        }
    ],
    // Instead of throwing, we log and let the library return 'false'
    defaultHandler: (e: any) => {
        console.error(`>>> [SAFE] Critical Error Logged: ${e.message}. (Shielding)`);
    }
});

async function runExamples() {
    console.log("--- 1. Success Path ---");
    const result1 = await safeWrapper(fetchSuccess({ id: 1 }));
    console.log(`Result: ${JSON.stringify(result1)}`);
    
    console.log("\n--- 2. Handled Failure (404) ---");
    const result2 = await safeWrapper(fetchFailure(404, 'Not Found'));
    console.log(`Result: ${result2}`); // returns false

    console.log("\n--- 3. Critical Failure (500) ---");
    // No try/catch needed here because the library shields us
    const result3 = await safeWrapper(fetchFailure(500, 'Server Explosion'));
    
    if (result3 === false) {
        console.log("Result: false (The shield worked, no crash occurred)");
    }
}

runExamples();
