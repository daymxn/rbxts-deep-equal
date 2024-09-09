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

import { Option } from "@rbxts/rust-classes";
import type { deepEqual } from "./algorithm";
import { DeepEqualConfig } from "./config";

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
export const ReferenceTypes = {
  function: "Callback",
  BasePart: "BasePart",
  Instance: "Instance",
  OverlapParams: "OverlapParams",
  RaycastParams: "RaycastParams",
  RaycastResult: "RaycastResult",
  RBXScriptConnection: "RBXScriptConnection",
  RBXScriptSignal: "RBXScriptSignal",
  userdata: "userdata",
  thread: "thread",
  vector: "vector",
  buffer: "buffer",
  table: "table",
};

/**
 * Enum representing why a {@link deepEqual} call failed.
 *
 * @public
 */
export enum FailureType {
  /**
   * Two properties or values had different types.
   *
   * @remarks
   * You can inspect the {@link FailureData.leftType} and
   * {@link FailureData.rightType} properties to find out
   * what the types were.
   */
  DIFFERENT_TYPES,

  /**
   * Two properties or passed values had different values.
   *
   * @remarks
   * You can inspect the {@link FailureData.leftValue} and
   * {@link FailureData.rightValue} properties to find out
   * what the values were.
   */
  DIFFERENT_VALUES,

  /**
   * Two properties or passed values pointed to different references.
   *
   * @remarks
   * The same as {@link FailureType.DIFFERENT_VALUES | DIFFERENT_VALUES},
   * except for _reference_ types.
   */
  DIFFERENT_REFERENCE,

  /**
   * There were elements missing in one array that were in another.
   *
   * @remarks
   * You can inspect the {@link FailureData.leftMissing} and
   * {@link FailureData.rightMissing} properties to find out
   * what values were missing.
   */
  MISSING_ARRAY_VALUE,

  /**
   * There was a property in one object but not another.
   *
   * @remarks
   * You can inspect the {@link FailureData.path} to see
   * which property was missing.
   */
  MISSING,
}

/**
 * Object containing specific data on why a comparison failed.
 *
 * @public
 */
export interface FailureData {
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
 * Alias type matching the types of values that can be compared against
 * in a {@link CustomChecker}.
 *
 * @public
 */
export type CheckerType = keyof CheckableTypes;

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
export type CustomCheckerMap<T extends CheckerType = CheckerType> = {
  [K in T]?: CustomChecker<K>;
};

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
export type CustomChecker<T extends CheckerType> = (
  config: DeepEqualConfig,
  leftValue: CheckableTypes[T],
  rightValue: CheckableTypes[T]
) => Option<FailureData>;
