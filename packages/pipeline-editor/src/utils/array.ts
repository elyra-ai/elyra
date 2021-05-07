/*
 * Copyright 2018-2021 Elyra Authors
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
 * Break an array into an array of "chunks", each "chunk" having "n" elements.
 * The final "chuck" may have less than "n" elements.
 * Example:
 * chunkArray(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 4)
 * -> [['a', 'b', 'c', 'd'], ['e', 'f', 'g']]
 */
export function chunkArray<T>(arr: T[], n: number): T[][] {
  return Array.from(Array(Math.ceil(arr.length / n)), (_, i) =>
    arr.slice(i * n, i * n + n)
  );
}
