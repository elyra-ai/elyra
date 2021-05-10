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

// TODO: this will be fetched from the server.
import nodes from "./nodes";

// const SERVICE = 'pipeline';

export const submitPipeline = (): void => {
  // POST elyra/pipeline/schedule
};

export const exportPipeline = (): void => {
  // POST elyra/pipeline/export
};

export const useComponents = (
  _runtime: string
): { data: typeof nodes; error?: any } => {
  return { data: nodes, error: undefined };
};
