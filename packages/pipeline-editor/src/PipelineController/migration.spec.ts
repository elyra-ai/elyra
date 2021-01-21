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

import {
  convertPipelineV0toV1,
  convertPipelineV1toV2,
  convertPipelineV2toV3
} from "./migration";

describe("@elyra/pipeline-editor", () => {
  describe("convertPipelineV0toV1", () => {
    it("should rename `title` key to `name`", () => {
      const v0 = {
        pipelines: [
          {
            app_data: {
              title: "title"
            },
            nodes: []
          }
        ]
      };
      const expected = {
        pipelines: [
          {
            app_data: {
              name: "title",
              version: 1
            },
            nodes: []
          }
        ]
      };
      const actual = convertPipelineV0toV1(v0 as any);
      expect(actual).toEqual(expected);
    });

    it("should delete deprecated keys", () => {
      const v0 = {
        pipelines: [
          {
            app_data: {
              title: "title",
              export: "export",
              export_format: "export_format",
              export_path: "export_path"
            },
            nodes: []
          }
        ]
      };
      const expected = {
        pipelines: [
          {
            app_data: {
              name: "title",
              version: 1
            },
            nodes: []
          }
        ]
      };
      const actual = convertPipelineV0toV1(v0 as any);
      expect(actual).toEqual(expected);
    });

    it("should rename all node keys", () => {
      const v0 = {
        pipelines: [
          {
            app_data: {
              title: "title"
            },
            nodes: [
              {
                app_data: {
                  artifact: "artifact",
                  image: "image",
                  vars: "vars",
                  file_dependencies: "file_dependencies",
                  recursive_dependencies: "recursive_dependencies"
                }
              }
            ]
          }
        ]
      };
      const expected = {
        pipelines: [
          {
            app_data: {
              name: "title",
              version: 1
            },
            nodes: [
              {
                app_data: {
                  filename: "artifact",
                  runtime_image: "image",
                  env_vars: "vars",
                  dependencies: "file_dependencies",
                  include_subdirectories: "recursive_dependencies"
                }
              }
            ]
          }
        ]
      };
      const actual = convertPipelineV0toV1(v0 as any);
      expect(actual).toEqual(expected);
    });
  });

  describe("convertPipelineV1toV2", () => {
    it("should change all node paths to relative", () => {
      const v1 = {
        pipelines: [
          {
            app_data: {
              name: "name",
              version: 1
            },
            nodes: [
              { app_data: { filename: "/user/niko/project/notebook.ipynb" } }
            ]
          }
        ]
      };
      const expected = {
        pipelines: [
          {
            app_data: {
              name: "name",
              version: 2
            },
            nodes: [{ app_data: { filename: "notebook.ipynb" } }]
          }
        ]
      };
      const actual = convertPipelineV1toV2(
        v1 as any,
        "/user/niko/project/untitled.pipeline"
      );
      expect(actual).toEqual(expected);
    });
  });

  describe("convertPipelineV2toV3", () => {
    it("should only bump version", () => {
      const v2 = {
        pipelines: [
          {
            app_data: {
              name: "name",
              version: 2
            },
            nodes: []
          }
        ]
      };
      const expected = {
        pipelines: [
          {
            app_data: {
              name: "name",
              version: 3
            },
            nodes: []
          }
        ]
      };
      const actual = convertPipelineV2toV3(v2 as any);
      expect(actual).toEqual(expected);
    });
  });
});
