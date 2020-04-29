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

// A list of supported docker images for submission
// TODO: replace this static list with a call to a metadata service
const dockerImages: { [key: string]: string } = {
  'elyra/tensorflow:1.15.2-py3': 'Tensorflow 1.15.2',
  'elyra/tensorflow:1.15.2-gpu-py3': 'Tensorflow 1.15.2 w/ GPU',
  'tensorflow/tensorflow:2.0.0-py3': 'Tensorflow 2.0',
  'tensorflow/tensorflow:2.0.0-gpu-py3': 'Tensorflow 2.0 w/ GPU',
  'pytorch/pytorch:1.2-cuda10.0-cudnn7-runtime': 'Pytorch 1.2 w/ CUDA-runtime',
  'pytorch/pytorch:1.2-cuda10.0-cudnn7-devel': 'Pytorch 1.2 w/ CUDA-devel',
  'amancevice/pandas:1.0.3': 'Pandas 1.0.3'
};

/**
 * A utilities class for various elyra services.
 */
export class FrontendServices {
  static getDockerImages(): { [key: string]: string } {
    return dockerImages;
  }
}
