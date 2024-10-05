/**
 * @license
 * Copyright 2024 Daymon Littrell-Reyes
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { deepCopy } from "@rbxts/object-utils";
import type { deepEqual } from "@src/algorithm";
import { checkers } from "@src/checkers";
import { CheckerType, CustomCheckerMap, FailureData, FailureType } from "@src/types";

/**
 * Configuration settings for the {@link deepEqual} function.
 *
 * @public
 */
export interface DeepEqualConfig {
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

/** @internal */
export const baselineConfig: DeepEqualConfig = {
  checkRightMissing: true,
  inOrder: false,
  _cache: new WeakMap(),
  customCheckers: checkers,
};

let defaultConfig: Partial<DeepEqualConfig> = {};

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
export function setDefaultDeepEqualConfig(config: Partial<DeepEqualConfig>): void {
  defaultConfig = deepCopy(config);
}

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
export function resetDefaultDeepEqualConfig() {
  defaultConfig = {};
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
export function getDefaultDeepEqualConfig(): Partial<DeepEqualConfig> {
  return defaultConfig;
}

/**
 * Merges the configuration settings of multiple {@link DeepEqualConfig} into
 * a single instance.
 *
 * @remarks
 * Since {@link DeepEqualConfig} has nested fields such as
 * {@link DeepEqualConfig.ignore | ignore} and
 * {@link DeepEqualConfig.referenceOnly | ignore}, this function
 * can be used to ensure that combining multiple configs doesn't
 * result in those fields being overwritten.
 *
 * @param configs - A variable amount of {@link DeepEqualConfig} to merge.
 * @returns A {@link DeepEqualConfig} with all the values merged.
 *
 * @public
 */
export function mergeConfigs(...configs: (Partial<DeepEqualConfig> | undefined)[]): Partial<DeepEqualConfig> {
  return configs.filterUndefined().reduce((acc, curr) => ({
    ...acc,
    ...curr,
    ignore: [...(acc?.ignore ?? []), ...(curr?.ignore ?? [])],
    referenceOnly: [...(acc?.referenceOnly ?? []), ...(curr?.referenceOnly ?? [])],
    customCheckers: {
      ...acc?.customCheckers,
      ...curr?.customCheckers,
    },
  }));
}
