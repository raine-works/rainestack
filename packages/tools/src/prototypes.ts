/**
 * Global Array prototype extensions for common convenience methods.
 *
 * Import this module once at the application entry point to make
 * these methods available on all arrays:
 *
 * ```ts
 * import "@rainestack/tools/prototypes";
 *
 * const items = [1, 2, 3];
 * items.isEmpty(); // false
 * items.flush();   // items is now []
 * ```
 *
 * @module prototypes
 */

declare global {
	interface Array<T> {
		/** Returns `true` when the array has no elements. */
		isEmpty(): boolean;

		/** Removes all elements from the array in place by setting `length` to 0. */
		flush(): void;
	}
}

/** Returns `true` when the array has no elements. */
Array.prototype.isEmpty = function <T>(this: T[]): boolean {
	return this.length === 0;
};

/**
 * Removes all elements from the array in place by setting its
 * `length` to 0. Unlike reassigning to `[]`, this mutates the
 * original reference so all holders of that reference see the change.
 */
Array.prototype.flush = function <T>(this: T[]): void {
	this.length = 0;
};

export {};
