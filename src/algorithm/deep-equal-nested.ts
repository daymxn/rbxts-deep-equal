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

import Object from "@rbxts/object-utils";
import { Option } from "@rbxts/rust-classes";
import { DeepEqualConfig } from "@src/config";
import { FailureData, FailureType, ReferenceTypes } from "@src/types";
import { isArray, slice } from "@src/util";
import { hasCircularReference } from "./has-circular-reference";

function findMissingElements(config: DeepEqualConfig, path: string, left: defined[], right: defined[]) {
  const missingElements: defined[] = [];
  const matchedIndicies: boolean[] = []; // track matched element indexies for perf savings

  const rightSize = right.size();

  left.forEach((leftValue, leftIndex) => {
    let isMissing = true;

    for (const i of $range(0, rightSize)) {
      if (matchedIndicies[i]) continue; // skip already matched elements

      const result = deepEqualNested(config, `${path}[${leftIndex}]`, leftValue, right[i]);
      if (result.isNone()) {
        matchedIndicies[i] = true;
        isMissing = false;
        break; // found a match, no need to continue
      }
    }

    if (isMissing) {
      missingElements.push(leftValue);
    }
  });

  return missingElements;
}

/** @internal */
export function deepEqualNested(
  config: DeepEqualConfig,
  path: string,
  left: unknown,
  right: unknown
): Option<FailureData> {
  // exit early if they point to the same object
  if (left === right) return Option.none();

  const leftType = typeOf(left);
  const rightType = typeOf(right);

  if (hasCircularReference(config, left, right)) {
    return Option.none(); // treat circular references as equivalent
  }

  if (config.ignore?.includes(leftType) || config.ignore?.includes(rightType)) return Option.none();

  if (leftType !== rightType) {
    return Option.some({
      failType: FailureType.DIFFERENT_TYPES,
      leftValue: left,
      leftType,
      rightValue: right,
      rightType,
      leftMissing: [],
      rightMissing: [],
      path,
    });
  }

  if (!config.referenceOnly?.includes(leftType)) {
    if (config.customCheckers && leftType in config.customCheckers) {
      return config.customCheckers[leftType]!(config, left as never, right as never);
    }

    if (!(leftType in ReferenceTypes)) {
      // strict comparison from the first line is valid for primitives, so they already failed
      return Option.some({
        failType: FailureType.DIFFERENT_VALUES,
        leftValue: left,
        leftType,
        rightValue: right,
        rightType,
        leftMissing: [],
        rightMissing: [],
        path,
      });
    }
  }

  if (isArray(left) && isArray(right)) {
    if (config.inOrder) {
      const leftSize = left.size();

      for (let index = 0; index < leftSize; index++) {
        const result = deepEqualNested(config, `${path}[${index}]`, left[index], right[index]);
        if (result.isSome()) return result;
      }

      const rightSize = right.size();

      if (leftSize !== rightSize) {
        const leftMissing = slice(right, left.size());

        return Option.some({
          failType: FailureType.MISSING_ARRAY_VALUE,
          leftValue: left,
          leftType,
          rightValue: right,
          rightType,
          leftMissing,
          rightMissing: [],
          path,
        });
      }
    } else {
      const rightMissing = findMissingElements(config, path, left, right);
      const leftMissing = config.checkRightMissing ? findMissingElements(config, path, right, left) : [];

      if (leftMissing.isEmpty() && rightMissing.isEmpty()) return Option.none();

      return Option.some({
        failType: FailureType.MISSING_ARRAY_VALUE,
        leftValue: left,
        leftType,
        rightValue: right,
        rightType,
        leftMissing,
        rightMissing,
        path,
      });
    }
    return Option.none();
  }

  if (leftType === "table") {
    const leftValue = left as object;
    const rightValue = right as object;

    const rightEntries = Object.entries(rightValue) as Array<[keyof object, unknown]>;

    for (const [key, value] of rightEntries) {
      const subPath = `${path}.${key}`;
      if (!(key in leftValue)) {
        return Option.some({
          failType: FailureType.MISSING,
          leftValue: undefined,
          leftType: "nil",
          rightValue: value,
          rightType: typeOf(value),
          leftMissing: [],
          rightMissing: [],
          path: subPath,
        });
      }
    }

    if (!config.checkRightMissing) return Option.none();

    const leftEntries = Object.entries(leftValue) as Array<[keyof object, unknown]>;

    for (const [key, value] of leftEntries) {
      const subPath = `${path}.${key}`;
      if (!(key in rightValue)) {
        return Option.some({
          failType: FailureType.MISSING,
          leftValue: value,
          leftType: typeOf(value),
          rightValue: undefined,
          rightType: "nil",
          leftMissing: [],
          rightMissing: [],
          path: subPath,
        });
      }
      const result = deepEqualNested(config, subPath, leftValue[key], rightValue[key]);
      if (result.isSome()) return result;
    }

    return Option.none();
  }

  // at this point, they have to be roblox-specific types that are reference only
  return Option.some({
    failType: FailureType.DIFFERENT_REFERENCE,
    leftValue: left,
    leftType,
    rightValue: right,
    rightType,
    leftMissing: [],
    rightMissing: [],
    path,
  });
}
