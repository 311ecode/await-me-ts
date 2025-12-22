import { createAsyncHandler, RETURN_STYLES } from '../core.ts';

// Internal handler typed for Go-style [Error, Data]
const internalHandler = createAsyncHandler({
  returnStyle: RETURN_STYLES.GO_STYLE,
});

type LogEntry = string | { fn: (...args: any[]) => void; params?: any[] };
type LogConfig = string | { error?: LogEntry; success?: LogEntry };

function executeAction(entry: LogEntry | undefined, method: 'error' | 'log', payload?: any) {
  if (!entry) return;
  if (typeof entry === 'object' && typeof entry.fn === 'function') {
    const params = Array.isArray(entry.params) ? entry.params : [];
    entry.fn(...params);
    return;
  }
  if (typeof entry === 'string') console[method](entry, payload || '');
}

function handleLog(config: LogConfig | undefined, type: 'error' | 'success', payload?: any) {
  if (!config) return;
  if (typeof config === 'string') {
    if (type === 'error') executeAction(config, 'error', payload);
    return;
  }
  if (type === 'error' && config.error) executeAction(config.error, 'error', payload);
  else if (type === 'success' && config.success) executeAction(config.success, 'log');
}

/**
 * Returns the data <T> or false on failure.
 */
export async function valueOf<T>(promise: Promise<T>, config?: LogConfig): Promise<T | false> {
  const [err, data] = await internalHandler<T>(promise);
  if (err) { 
    handleLog(config, 'error', err); 
    return false; 
  }
  handleLog(config, 'success');
  return data as T;
}

/**
 * Returns true if the operation succeeded, false otherwise.
 */
export async function isSuccess(promise: Promise<any>, config?: LogConfig): Promise<boolean> {
  const [err] = await internalHandler(promise);
  if (err) { 
    handleLog(config, 'error', err); 
    return false; 
  }
  handleLog(config, 'success');
  return true;
}

/**
 * Returns an object { success, data, error }.
 * Safe for APIs that might return literal 'false' or 'null' as valid data.
 */
export async function toResult<T, E = any>(promise: Promise<T>, config?: LogConfig): Promise<{ success: boolean; data: T | null; error: E | null }> {
  const [err, data] = await internalHandler<T>(promise);
  if (err) {
    handleLog(config, 'error', err);
    return { success: false, data: null, error: err as E };
  }
  handleLog(config, 'success');
  return { success: true, data: data as T, error: null };
}
