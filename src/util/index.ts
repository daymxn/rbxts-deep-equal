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
import { t } from "@rbxts/t";
import { FailureData, FailureType } from "@src/types";

/**
 * A property of type `defined[]`.
 *
 * @typeParam T - Type of object whose property is being used.
 *
 * @public
 */
export type ArrayProperty<T> = {
  [K in keyof T]: T[K] extends defined[] ? K : never;
}[keyof T];

/** @internal */
export function isArray(element: unknown): element is defined[] {
  return t.array(t.any)(element);
}

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
export function checkValueProperty<T>(left: T, right: T, key: keyof T): Option<FailureData> {
  const leftValue = left[key];
  const rightValue = right[key];

  if (leftValue !== rightValue) {
    return Option.some({
      failType: FailureType.DIFFERENT_VALUES,
      leftValue,
      rightValue,
      leftMissing: [],
      rightMissing: [],
      leftType: typeOf(leftValue),
      rightType: typeOf(rightValue),
      path: key as string,
    });
  }
  return Option.none();
}

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
export function checkReferenceProperty<T>(left: T, right: T, key: keyof T): Option<FailureData> {
  const leftValue = left[key];
  const rightValue = right[key];

  if (leftValue !== rightValue) {
    return Option.some({
      failType: FailureType.DIFFERENT_REFERENCE,
      leftValue,
      rightValue,
      leftMissing: [],
      rightMissing: [],
      leftType: typeOf(leftValue),
      rightType: typeOf(rightValue),
      path: key as string,
    });
  }
  return Option.none();
}

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
export function checkArrayProperty<T>(
  left: T,
  right: T,
  key: ArrayProperty<T>,
  checkRightMissing: boolean = true
): Option<FailureData> {
  const leftValue = left[key] as defined[];
  const rightValue = right[key] as defined[];

  const [leftMissing, rightMissing] = diffArray(leftValue, rightValue, checkRightMissing);

  if (leftMissing.isEmpty() && rightMissing.isEmpty()) return Option.none();

  return Option.some({
    failType: FailureType.MISSING_ARRAY_VALUE,
    leftValue,
    rightValue,
    leftMissing,
    rightMissing,
    leftType: typeOf(leftValue),
    rightType: typeOf(rightValue),
    path: key as string,
  });
}

function diffArray<T extends defined>(
  left: T[],
  right: T[],
  checkRightMissing: boolean = true,
  earlyExit: boolean = false
): LuaTuple<[T[], T[]]> {
  const leftMissing = right.filter((it) => !left.includes(it));
  if (earlyExit && !leftMissing.isEmpty()) {
    return $tuple(leftMissing, []);
  }
  if (checkRightMissing) {
    const rightMissing = left.filter((it) => !right.includes(it));
    return $tuple(leftMissing, rightMissing);
  }

  return $tuple(leftMissing, []);
}

/**
 * @internal
 */
export function slice<T extends defined>(array: ReadonlyArray<T>, start = 0, endPos = array.size()) {
  const size = array.size();

  start = start < 0 ? size + start : start;
  endPos = endPos < 0 ? size + endPos : endPos;

  return array.move(math.max(0, start), endPos - 1, 0, []);
}

const SPECIAL_CHARS = ["$", "%", "^", "*", "(", ")", ".", "[", "]", "+", "-", "?"];
const SPECIAL_CHARS_PATTERN = `[${SPECIAL_CHARS.map((it) => `%${it}`).join("")}]`;

function escape(str: string) {
  return str.gsub(SPECIAL_CHARS_PATTERN, "%%%0")[0];
}

function trimStart(str: string, substr: string = " ") {
  const escapedSubstr = escape(substr);
  const pattern = `^${escapedSubstr}+`;

  return str.gsub(pattern, "")[0];
}

function trimEnd(str: string, substr: string = " ") {
  const escapedSubstr = escape(substr);
  const pattern = `${escapedSubstr}+$`;

  return str.gsub(pattern, "")[0];
}

/**
 * @internal
 */
export function trim(str: string, substr: string = " ") {
  return trimEnd(trimStart(str, substr), substr);
}
