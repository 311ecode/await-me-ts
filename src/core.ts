export const RETURN_STYLES = {
  FALSE_STYLE: 'false-style',
  TRUE_STYLE: 'true-style',
  GO_STYLE: 'goStyle',
  ERROR_STYLE: 'errorStyle',
  ONLY_ERROR: 'only-error',
  BOOLEAN: 'boolean',
} as const;

export type ReturnStyle = typeof RETURN_STYLES[keyof typeof RETURN_STYLES];

// New: Explicit interface to ensure the returned function is generic
export interface AsyncWrappedFunction {
  <T>(promise: Promise<T>): Promise<any>;
}

export interface ConditionalHandler<T = any, E = any> {
  ifTrue: (error: E) => boolean;
  doIt: (error: E) => void;
}

export interface AsyncHandlerConfig<T = any, E = any> {
  returnStyle?: ReturnStyle;
  conditionalHandlerChain?: ConditionalHandler<T, E>[];
  defaultHandler?: (error: E) => any;
}

export function createAsyncHandler<E = any>(config: AsyncHandlerConfig<any, E> = {}): AsyncWrappedFunction {
  const {
    returnStyle = RETURN_STYLES.GO_STYLE,
    conditionalHandlerChain = [],
    defaultHandler = (e: E) => { throw e; }
  } = config;

  // The implementation now strictly follows the generic interface
  const handler: AsyncWrappedFunction = async function<T>(promise: Promise<T>): Promise<any> {
    try {
      const data = await promise;
      switch (returnStyle) {
        case RETURN_STYLES.GO_STYLE: return [null, data];
        case RETURN_STYLES.ONLY_ERROR: return 0;
        case RETURN_STYLES.BOOLEAN: return true;
        default: return data;
      }
    } catch (error: any) {
      let executedConditional = false;
      for (const { ifTrue, doIt } of conditionalHandlerChain) {
        if (ifTrue(error)) {
          try { doIt(error); } catch (hErr) { }
          executedConditional = true;
          break;
        }
      }

      switch (returnStyle) {
        case RETURN_STYLES.GO_STYLE: return [error, null];
        case RETURN_STYLES.ONLY_ERROR: return 1;
        case RETURN_STYLES.BOOLEAN: return false;
        case RETURN_STYLES.FALSE_STYLE:
        case RETURN_STYLES.TRUE_STYLE:
          if (!executedConditional) {
            try { defaultHandler(error); } catch (hErr) { }
          }
          return returnStyle === RETURN_STYLES.FALSE_STYLE ? false : true;
        case RETURN_STYLES.ERROR_STYLE: return error;
        default:
          if (!executedConditional) return defaultHandler(error);
          throw error;
      }
    }
  };

  return handler;
}
