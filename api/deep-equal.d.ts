/**
 * Configurable deep equal function for ROBLOX projects.
 *
 * @remarks
 * Exports the {@link deepEqual} function as the primary entry point.
 *
 * @packageDocumentation
 */

/// <reference types="@rbxts/compiler-types" />
/// <reference types="@rbxts/types" />

import { Option } from '@rbxts/rust-classes';

/**
 * A property of type `defined[]`.
 *
 * @typeParam T - Type of object whose property is being used.
 *
 * @public
 */
export declare type ArrayProperty<T> = {
    [K in keyof T]: T[K] extends defined[] ? K : never;
}[keyof T];

/**
 * Compares two _array_ properties on the given object.
 *
 * @remarks
 * By default, this uses a strict comparison by roblox standards.
 *
 * Meaning, if the values of the array are _reference_ types, the comparison
 * will be by reference. But if the values of the array are _value_ types,
 * the comparison will be by value.
 *
 * @privateRemarks
 * See one of the existing checkers in the source code under the `checkers` directory
 * for an example of usage.
 *
 * @typeParam T - Type of object whose properties are being compared
 *
 * @param left - The left (or "actual") object to compare with.
 * @param right - The right (or "expected") object to compare against.
 * @param key - A string representing the _array_ property (or "key") of which to compare
 * the two objects with.
 *
 * @returns An option type with a {@link FailureData} when the arrays are not equal, or
 * an `Option.none` type when the arrays are equal.
 *
 * @see {@link checkValueProperty}, {@link checkReferenceProperty}
 *
 * @public
 */
export declare function checkArrayProperty<T>(left: T, right: T, key: ArrayProperty<T>, checkRightMissing?: boolean): Option<FailureData>;

/**
 * Alias type matching the types of values that can be compared against
 * in a {@link CustomChecker}.
 *
 * @public
 */
export declare type CheckerType = keyof CheckableTypes;

/**
 * Compares two _reference_ properties on the given object.
 *
 * @remarks
 * A _reference_ property is one that is comparable by reference, instead of value.
 *
 * Certain roblox types are compared by the reference they point to, instead of the value
 * they old.
 *
 * For example: {@link https://create.roblox.com/docs/reference/engine/classes/Instance | Instance},
 * {@link https://create.roblox.com/docs/luau/tables | Tables}, and
 * {@link https://create.roblox.com/docs/reference/engine/datatypes/OverlapParams | OverlapParams} are
 * all compared by their reference instead of their values.
 *
 * @privateRemarks
 * See one of the existing checkers in the source code under the `checkers` directory
 * for an example of usage.
 *
 * @typeParam T - Type of object whose properties are being compared
 *
 * @param left - The left (or "actual") object to compare with.
 * @param right - The right (or "expected") object to compare against.
 * @param key - A string representing the _reference_ property (or "key") of which to compare
 * the two objects with.
 *
 * @returns An option type with a {@link FailureData} when the references are not equal, or
 * an `Option.none` type when the references are equal.
 *
 * @see {@link checkValueProperty}, {@link checkArrayProperty}, {@link ReferenceTypes}
 *
 * @public
 */
export declare function checkReferenceProperty<T>(left: T, right: T, key: keyof T): Option<FailureData>;

/**
 * Compares two _value_ properties on the given object.
 *
 * @remarks
 * A _value_ property is one that is comparable by value, instead of reference.
 *
 * Obvious ones are primitive values like `string` or `boolean`, but there's also
 * certain roblox types that are also compared by value instead of reference (such as
 * `Vector3` and `CFrame`).
 *
 * @privateRemarks
 * See one of the existing checkers in the source code under the `checkers` directory
 * for an example of usage.
 *
 * @typeParam T - Type of object whose properties are being compared
 *
 * @param left - The left (or "actual") object to compare with.
 * @param right - The right (or "expected") object to compare against.
 * @param key - A string representing the _value_ property (or "key") of which to compare
 * the two objects with.
 *
 * @returns An option type with a {@link FailureData} when the values are not equal, or
 * an `Option.none` type when the values are equal.
 *
 * @see {@link checkReferenceProperty}, {@link checkArrayProperty}
 *
 * @public
 */
export declare function checkValueProperty<T>(left: T, right: T, key: keyof T): Option<FailureData>;

/**
 * A custom callback function for providing your own logic for comparing
 * given types.
 *
 * @remarks
 * Also allows you to override default behavior for given types.
 *
 * @typeParam T - The type of objects being compared.
 *
 * @param config - The {@link DeepEqualConfig} used in the compare call.
 * Can be used to toggle certain behavior based on configured settings.
 * @param leftValue - The `left` or "actual" value being compared.
 * @param rightValue - The `right` or "expected" value being compared.
 *
 * @returns An `Option.some` wrapping a {@link FailureData} if the match
 * failed, or an `Option.none` if the values are equal.
 *
 * @example
 * ```ts
 * const checkInstance: CustomChecker<"Instance"> = (config, left, right) => {
 *   if(left.Name === right.Name) return Option.none();
 *   return return Option.some({
 *     failType: FailureType.DIFFERENT_VALUES,
 *     leftValue: left.Name,
 *     rightValue: right.Name,
 *     leftMissing: [],
 *     rightMissing: [],
 *     leftType: "Instance",
 *     rightType: "Instance",
 *     path: "",
 *   });
 * };
 * ```
 *
 * @public
 */
export declare type CustomChecker<T extends CheckerType> = (config: DeepEqualConfig, leftValue: CheckableTypes[T], rightValue: CheckableTypes[T]) => Option<FailureData>;

/**
 * Object map of {@link CheckerType} to {@link CustomChecker}
 * functions.
 *
 * @public
 *
 * @example
 * ```ts
 * const checkInstance: CustomChecker<"Instance"> = (config, left, right) => {
 *   // ...
 * };
 *
 * const checkers: CustomCheckerMap = {
 *   Instance: checkInstance
 * }
 * ```
 */
export declare type CustomCheckerMap<T extends CheckerType = CheckerType> = {
    [K in T]?: CustomChecker<K>;
};

/**
 * Compares two values _deeply_ to see if they're equal.
 *
 * @remarks
 * The default `===` comparator of roblox performs a strict
 * comparison. This means that certain values are only
 * considered equal if they point to the same object, even
 * if they point to different objects but contains the same values.
 *
 * A deep comparison is one that recursively checks the values of
 * two objects to see if they're equal- even if they point to different
 * instances of said object.
 *
 * This function is also able to differentiate between arrays and tables.
 *
 * @param left - The left (or "actual") value to compare with.
 * @param right - The right (or "expected") value to compare against.
 * @param config - An optional {@link DeepEqualConfig} for configuring certain
 * behaviors.
 *
 * @returns A {@link FailureData} with data containing why and where the comparison failed,
 * or undefined if the values are equal.
 *
 * @example
 * Arrays
 * ```ts
 * const result = deepEqual([1,2,3], [1,2,4]);
 *
 * print(result.failType); // MISSING_ARRAY_VALUE
 * print(result.leftMissing); // [4]
 * print(result.rightMissing); // [3]
 * ```
 *
 * @example
 * Objects
 * ```ts
 * const result = deepEqual({
 *   name: "daymon"
 *   age: 100;
 * }, {
 *   name: "daymon",
 *   age: 200
 * });
 *
 * print(result.failType) // FailureType.DIFFERENT_VALUES
 * print(result.leftValue); // 100
 * print(result.rightValue); // 200
 * print(result.path); // age
 * ```
 *
 * @public
 */
export declare function deepEqual(left: unknown, right: unknown, config?: Partial<DeepEqualConfig>): FailureData | undefined;

/**
 * Configuration settings for the {@link deepEqual} function.
 *
 * @public
 */
export declare interface DeepEqualConfig {
    /**
     * An array of {@link CheckerType | types} to ignore.
     *
     * @remarks
     * When the `left` or `right` is any of these types,
     * it will be skipped; effectively "ignoring" it for the
     * purposes of checking if two objects are equal.
     */
    readonly ignore?: ReadonlyArray<CheckerType>;
    /**
     * An array of {@link CheckerType | types} to only compare by reference.
     *
     * @remarks
     * Some roblox types are compared by value instead of reference. Adding
     * said types to this array will instead force them to be compared by reference
     * instead, with a {@link FailureType.DIFFERENT_REFERENCE | DIFFERENT_REFERENCE}
     * failure type attached.
     */
    readonly referenceOnly?: ReadonlyArray<CheckerType>;
    /**
     * An object that maps to custom callback functions for given types.
     *
     * Allows you to override or provider your own logic for comparing
     * given types.
     *
     * @example
     * ```ts
     * const checkInstance: CustomChecker<"Instance"> = (config, left, right) => {
     *   if(left.Name === right.Name) return Option.none();
     *   return return Option.some({
     *     failType: FailureType.DIFFERENT_VALUES,
     *     leftValue: left.Name,
     *     rightValue: right.Name,
     *     leftMissing: [],
     *     rightMissing: [],
     *     leftType: "Instance",
     *     rightType: "Instance",
     *     path: "",
     *   });
     * };
     *
     * deepEqual(Workspace.Part1, Workspace.Part2, {
     *   customCheckers: {
     *     Instance: checkInstance
     *   }
     * });
     * ```
     */
    readonly customCheckers?: CustomCheckerMap<CheckerType>;
    /**
     * Check for missing values from the right in comparison to the left.
     *
     * Only really applicable to arrays and objects.
     *
     * @remarks
     * When comparing two arrays, `checkRightMissing` will also check if there
     * are any values missing from the right array that are present in the left
     * array.
     *
     * When comparing two objects (non array tables), `checkRightMissing` will also check
     * if there are any properties missing from the right object that are present
     * in the left object.
     *
     * @defaultValue `true`
     *
     * @example
     * Arrays
     * ```ts
     * const result = deepEqual([1,2,3], [1,2,4], { checkRightMissing: true });
     * print(result.leftMissing); // [4]
     * print(result.rightMissing); // [3]
     * ```
     *
     * @example
     * Objects
     * ```ts
     * const result = deepEqual({
     *   name: "daymon"
     * }, {
     *   name: "daymon",
     *   age: 100
     * }, { checkRightMissing: true });
     * print(result.leftValue); // undefined
     * print(result.rightValue); // 100
     * print(result.path); // age
     * ```
     */
    readonly checkRightMissing: boolean;
    /**
     * Compares arrays in order instead of by missing.
     *
     * @remarks
     * By default, arrays are compared by missing elements, throwing a
     * {@link FailureType.MISSING_ARRAY_VALUE | MISSING_ARRAY_VALUE} with
     * the {@link FailureData.leftMissing | leftMissing} and
     * {@link FailureData.rightMissing | rightMissing} populated.
     *
     * When `inOrder` is enabled, {@link deepEqual} will instead throw
     * a {@link FailureType.DIFFERENT_VALUES | DIFFERENT_VALUES} without
     * the {@link FailureData.leftMissing | leftMissing} and
     * {@link FailureData.rightMissing | rightMissing} populated.
     *
     * The {@link FailureData.leftValue | leftValue} and
     * {@link FailureData.rightValue | rightValue} will point to the elements
     * that were missing, and the {@link FailureData.path | path} will contain
     * the index at which the failure occurred.
     *
     * Useful when working with arrays of complex types, or when you want to
     * assert that an array is "exactly in order".
     *
     * @defaultValue `false`
     */
    readonly inOrder: boolean;
    /** @internal */
    readonly _cache: WeakMap<object, WeakMap<object, boolean>>;
}

/**
 * Object containing specific data on why a comparison failed.
 *
 * @public
 */
export declare interface FailureData {
    /**
     * An enum categorizing why the comparison failed.
     *
     * @remarks
     * e.g., was it because of different types, different values,
     * missing array elements, or something else?
     */
    failType: FailureType;
    /**
     * The `left` value in the comparison that failed.
     *
     * @remarks
     * May or may not be the original `left` (or "actual") value
     * provided to the function. Especially when comparing
     * nested objects.
     *
     * You can look at the {@link FailureData.path | path} property
     * to find out _where_ the comparison failed.
     */
    leftValue: unknown;
    /** The type of the `left` value where the comparison failed. */
    leftType: string;
    /**
     * The `right` value in the comparison that failed.
     *
     * @remarks
     * May or may not be the original `right` (or "expected") value
     * provided to the function. Especially when comparing
     * nested objects.
     *
     * You can look at the {@link FailureData.path | path} property
     * to find out _where_ the comparison failed.
     */
    rightValue: unknown;
    /** The type of the `right` value where the comparison failed. */
    rightType: string;
    /**
     * An array of elements that were present in the `right` array
     * but not the `left`.
     *
     * @remarks
     * Only relevant when comparing two arrays, is empty otherwise.
     */
    leftMissing: unknown[];
    /**
     * An array of elements that were present in the `left` array
     * but not the `right`.
     *
     * @remarks
     * Only relevant when comparing two arrays, is empty otherwise.
     */
    rightMissing: unknown[];
    /**
     * The object path to where the comparison failed.
     *
     * @remarks
     * Only relevant when comparing nested structures
     * (properties, tables, or nested arrays), is empty otherwise.
     *
     * Also may be present when the {@link DeepEqualConfig.inOrder | inOrder}
     * setting is enabled and comparing two arrays- as it will point to the
     * path of the element instead of using `leftMissing` and `rightMissing`.
     */
    path: string;
}

/**
 * Enum representing why a {@link deepEqual} call failed.
 *
 * @public
 */
export declare enum FailureType {
    /**
     * Two properties or values had different types.
     *
     * @remarks
     * You can inspect the {@link FailureData.leftType} and
     * {@link FailureData.rightType} properties to find out
     * what the types were.
     */
    DIFFERENT_TYPES = 0,
    /**
     * Two properties or passed values had different values.
     *
     * @remarks
     * You can inspect the {@link FailureData.leftValue} and
     * {@link FailureData.rightValue} properties to find out
     * what the values were.
     */
    DIFFERENT_VALUES = 1,
    /**
     * Two properties or passed values pointed to different references.
     *
     * @remarks
     * The same as {@link FailureType.DIFFERENT_VALUES | DIFFERENT_VALUES},
     * except for _reference_ types.
     */
    DIFFERENT_REFERENCE = 2,
    /**
     * There were elements missing in one array that were in another.
     *
     * @remarks
     * You can inspect the {@link FailureData.leftMissing} and
     * {@link FailureData.rightMissing} properties to find out
     * what values were missing.
     */
    MISSING_ARRAY_VALUE = 3,
    /**
     * There was a property in one object but not another.
     *
     * @remarks
     * You can inspect the {@link FailureData.path} to see
     * which property was missing.
     */
    MISSING = 4
}

/**
 * Gets the current (user configured) default config,
 * as set by {@link setDefaultDeepEqualConfig}.
 *
 * All usages of {@link deepEqual} will inherit
 * from this config.
 *
 * @see {@link setDefaultDeepEqualConfig}, {@link resetDefaultDeepEqualConfig}
 *
 * @public
 */
export declare function getDefaultDeepEqualConfig(): Partial<DeepEqualConfig>;

/**
 * Helper const mapping to all the roblox types that are
 * compared by reference instead of by value.
 *
 * @remarks
 * Allows you to use the `in` keyword to quickly check
 * if a type is a reference type.
 *
 * @example
 * ```ts
 * if(typeOf(left) in ReferenceTypes) {
 *   // is a reference type
 * } else {
 *   // is a value type
 * }
 * ```
 *
 * @public
 */
export declare const ReferenceTypes: {
    function: string;
    BasePart: string;
    Instance: string;
    OverlapParams: string;
    RaycastParams: string;
    RaycastResult: string;
    RBXScriptConnection: string;
    RBXScriptSignal: string;
    userdata: string;
    thread: string;
    vector: string;
    buffer: string;
    table: string;
};

/**
 * Resets the default deep equal config to an empty object.
 *
 * @remarks
 * Would be the same as never calling {@link setDefaultDeepEqualConfig}.
 *
 * @see {@link setDefaultDeepEqualConfig}, {@link getDefaultDeepEqualConfig}
 *
 * @public
 */
export declare function resetDefaultDeepEqualConfig(): void;

/**
 * Sets the default deep equal config.
 *
 * All usages of {@link deepEqual} will inherit
 * from this config.
 *
 * @remarks
 * Overwrites the existing default config, it does _not_ merge
 * them.
 *
 * @param config - A partial {@link DeepEqualConfig} to set as the default
 * config.
 *
 * @see {@link resetDefaultDeepEqualConfig}, {@link getDefaultDeepEqualConfig}
 *
 * @public
 */
export declare function setDefaultDeepEqualConfig(config: Partial<DeepEqualConfig>): void;

export { }
