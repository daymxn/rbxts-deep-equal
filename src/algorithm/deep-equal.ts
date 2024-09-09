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

import { baselineConfig, DeepEqualConfig, getDefaultDeepEqualConfig, mergeConfigs } from "@src/config";
import { FailureData } from "@src/types";
import { trim } from "@src/util";
import { deepEqualNested } from "./deep-equal-nested";

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
export function deepEqual(
  left: unknown,
  right: unknown,
  config: Partial<DeepEqualConfig> = {}
): FailureData | undefined {
  const actualConfig = {
    ...mergeConfigs(baselineConfig, getDefaultDeepEqualConfig(), config),
    _cache: new WeakMap(),
  } as DeepEqualConfig;

  return deepEqualNested(actualConfig, "", left, right)
    .map((it) => ({
      ...it,
      path: trim(it.path, "."),
    }))
    .asPtr();
}
