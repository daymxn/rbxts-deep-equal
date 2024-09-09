/* eslint-disable headers/header-format */
/**
 * Configurable deep equal function for ROBLOX projects.
 *
 * @remarks
 * Exports the {@link deepEqual} function as the primary entry point.
 *
 * @packageDocumentation
 */

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

export { deepEqual } from "./algorithm/deep-equal";
export {
  DeepEqualConfig,
  getDefaultDeepEqualConfig,
  resetDefaultDeepEqualConfig,
  setDefaultDeepEqualConfig,
} from "./config";
export { CheckerType, CustomChecker, CustomCheckerMap, FailureData, FailureType, ReferenceTypes } from "./types";
export { ArrayProperty, checkArrayProperty, checkReferenceProperty, checkValueProperty } from "./util";
