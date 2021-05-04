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

import useSWR from 'swr';

const SERVICE = 'metadata';

interface Response<T extends keyof Requests> {
  data: Requests[T] | undefined;
  error: any;
}

type Request<T extends keyof Requests> = Pick<Requests, T>;

interface Requests {
  'runtime-images': RuntimeImage[];
  runtimes: Runtime[];
}

interface RuntimeImage {
  name: string;
  display_name: string;
  metadata: {
    image_name: string;
  };
}

interface Runtime {
  bloop: string;
}

const useMetadata = <T extends keyof Requests>(x: T): Response<T> => {
  const { data, error } = useSWR<Request<T>>(`/${SERVICE}/${x}`);
  return { data: data?.[x], error };
};

// TODO: sort runtime images on the server.
export const useRuntimeImages = (): Response<'runtime-images'> => {
  return useMetadata('runtime-images');
};

export const useRuntimes = (): Response<'runtimes'> => {
  return useMetadata('runtimes');
};
