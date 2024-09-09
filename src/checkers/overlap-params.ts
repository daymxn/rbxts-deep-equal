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

import { CustomChecker } from "@src/types";
import { checkArrayProperty, checkValueProperty } from "@src/util";

/** @internal */
export const checkOverlapParams: CustomChecker<"OverlapParams"> = (config, left, right) => {
  return checkValueProperty(left, right, "FilterType")
    .orElse(() => checkValueProperty(left, right, "MaxParts"))
    .orElse(() => checkValueProperty(left, right, "CollisionGroup"))
    .orElse(() => checkValueProperty(left, right, "RespectCanCollide"))
    .orElse(() => checkValueProperty(left, right, "BruteForceAllSlow"))
    .orElse(() => checkArrayProperty(left, right, "FilterDescendantsInstances", config.checkRightMissing));
};
