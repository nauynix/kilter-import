/**
 * Throttle a function to be called at most once every "wait" milliseconds,
 * on the trailing edge.
 *
 * Roughly equivalent to lodash/throttle with {leading: false, trailing: true}
 */
export declare function throttleTrailing(func: () => void, wait: number): () => void;
/**
 * Throttle a function to be called at most once every "wait" milliseconds,
 * on the leading and trailing edge.
 *
 * Roughly equivalent to lodash/throttle with {leading: true, trailing: true}
 */
export declare function throttleLeadingTrailing(func: () => void, wait: number): () => void;
