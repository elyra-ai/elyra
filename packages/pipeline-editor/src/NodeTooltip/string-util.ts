/*
 * Copyright 2018-2020 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Turn anything into a pretty string.
 * Example:
 * true -> "Yes"
 * [1, 2, 3] -> "1\n2\n3"
 * "hello" -> "hello"
 */
export const toPrettyString = (o: any): string => {
  if (Array.isArray(o)) {
    return o.join("\n");
  }

  if (typeof o === "boolean") {
    return o ? "Yes" : "No";
  }

  return o;
};

export const hasValue = (o: any): boolean => {
  if (o === undefined || o === null) {
    return false;
  }

  if (Array.isArray(o)) {
    return o.length > 0;
  }

  if (typeof o === "boolean") {
    return true;
  }

  return o !== "";
};
