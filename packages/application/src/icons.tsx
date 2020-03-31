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

import { LabIcon } from '@jupyterlab/ui-components';

import dragDropSvg from '../style/dragdrop.svg';
import elyraSvg from '../style/codait-piebrainlogo-jupyter-color.svg';
import pipelineSvg from '../style/pipeline-flow.svg';

export const dragDropIcon = new LabIcon({
  name: 'elyra:dragdrop',
  svgstr: dragDropSvg
});
export const elyraIcon = new LabIcon({ name: 'elyra:elyra', svgstr: elyraSvg });
export const pipelineIcon = new LabIcon({
  name: 'elyra:pipeline',
  svgstr: pipelineSvg
});
