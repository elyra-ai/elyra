/*
 * Copyright 2018-2019 IBM Corporation
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
import uuid4 from 'uuid/v4';
import pipeline_template from './pipeline-template.json';
import {ISubmitNotebookOptions} from "./SubmitNotebook";

/**
 * A utilities class for static functions.
 */
export default class Utils {

  static 	getUUID() {
		return uuid4();
	}

  static generateNotebookPipeline(artifact:string, options:ISubmitNotebookOptions) {
    let template = pipeline_template;
    let generated_uuid : string = Utils.getUUID();

    let artifactFileName =  artifact.replace(/^.*[\\\/]/, '');
    let artifactName = artifactFileName.replace(/\.[^/.]+$/, '');


    template.id = generated_uuid;
    template.primary_pipeline = generated_uuid;
    template.pipelines[0].id = generated_uuid;

    template.pipelines[0].nodes[0].id = generated_uuid;
    template.pipelines[0].nodes[0].app_data.artifact = artifact;
    template.pipelines[0].nodes[0].app_data.image = 'tensorflow/tensorflow:1.12.3-py3';
    template.pipelines[0].nodes[0].app_data.vars = options.env;
    template.pipelines[0].nodes[0].app_data.dependencies = options.dependencies;
    template.pipelines[0].nodes[0].app_data.ui_data.label = artifactName;

    template.pipelines[0].app_data.title = artifactName;
    template.pipelines[0].app_data.runtime = 'kfp';
    template.pipelines[0].app_data['runtime-config'] = options.runtime_config;

    return template;
  }


}
