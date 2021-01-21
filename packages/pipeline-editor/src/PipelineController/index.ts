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

import { CanvasController } from "@elyra/canvas";

import { createPalette } from "./create-palette";
import {
  ElyraOutOfDateError,
  PipelineOutOfDateError,
  UnknownVersionError
} from "./errors";
import {
  convertPipelineV0toV1,
  convertPipelineV1toV2,
  convertPipelineV2toV3
} from "./migration";
import { INode } from "./types";
import {
  ILink,
  checkCircularReferences,
  validateProperties
} from "./validation";

const PIPELINE_CURRENT_VERSION = 3;

class PipelineController extends CanvasController {
  private nodes: INode[] = [];
  private currentType = "";

  open(pipelineJson: any) {
    const palette = createPalette([
      { op: "bloop", label: "thing", description: "beep beep" }
    ]);
    this.setPipelineFlowPalette(palette);

    // if pipeline is null create a new one from scratch.
    if (pipelineJson === null) {
      const emptyPipeline = this.getPipelineFlow();
      emptyPipeline.pipelines[0].app_data.version = PIPELINE_CURRENT_VERSION;
      this.setPipelineFlow(emptyPipeline);
      return;
    }

    const version = pipelineJson.pipelines[0].app_data?.version ?? 0;

    if (version === PIPELINE_CURRENT_VERSION) {
      this.setPipelineFlow(pipelineJson);
      return;
    }

    // the pipeline was last edited in a "more recent release"
    // the user should update his version of Elyra to consume the pipeline
    if (version > PIPELINE_CURRENT_VERSION) {
      throw new ElyraOutOfDateError();
    }

    // in this case, pipeline was last edited in a "old" version of Elyra and
    // it needs to be updated/migrated.
    if (version < PIPELINE_CURRENT_VERSION) {
      throw new PipelineOutOfDateError();
    }

    // we should only reach here if the version isn't a number
    throw new UnknownVersionError();
  }

  private _getNode(nodeID: string): any {
    const pipelineId = this.getPrimaryPipelineId();
    const node = this.getNode(nodeID, pipelineId);
    if (node) {
      return node;
    }
    // If the node is in a supernode, search supernodes for it
    const superNodes = this.getSupernodes(pipelineId);
    for (const superNode of superNodes) {
      const superNodePipelineID = superNode.subflow_ref.pipeline_id_ref;
      const node = this.getNode(nodeID, superNodePipelineID);
      if (node) {
        return node;
      }
    }
  }

  addNode(op: string): void {
    const nodeTemplate = this.getPaletteNode(op);
    console.log(nodeTemplate);
    const data = {
      editType: "createNode",
      offsetX: 40,
      offsetY: 40,
      nodeTemplate: this.convertNodeTemplate(nodeTemplate)
    };
    this.editActionHandler(data);
  }

  /**
   * Migrate pipeline to the latest version.
   */
  migrate(): void {
    let convertedPipeline = this.getPipelineFlow();
    const initialVersion =
      convertedPipeline.pipelines[0].app_data?.version ?? 0;
    if (initialVersion < 1) {
      // original pipeline definition without a version
      console.info("Migrating pipeline to version 1.");
      convertedPipeline = convertPipelineV0toV1(convertedPipeline);
    }
    if (initialVersion < 2) {
      // adding relative path on the pipeline filenames
      console.info("Migrating pipeline to version 2.");
      convertedPipeline = convertPipelineV1toV2(
        convertedPipeline,
        this.context.path
      );
    }
    if (initialVersion < 3) {
      // Adding python script support
      console.info("Migrating pipeline to version 3 (current version).");
      convertedPipeline = convertPipelineV2toV3(convertedPipeline);
    }
    this.setPipelineFlow(convertedPipeline);
  }

  _styleNode(node: any): void {
    const pipelineId = this.getPrimaryPipelineId();
    const nodeToBeStyled = { [pipelineId]: [node.id] };

    const defaultStyle = {
      body: { default: "" },
      selection_outline: { default: "" },
      label: { default: "" }
    };

    const errorStyle = {
      body: { default: "stroke: var(--jp-error-color1);" },
      selection_outline: { default: "stroke: var(--jp-error-color1);" },
      label: { default: "fill: var(--jp-error-color1);" }
    };

    const image =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="#da1e28" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#ffffff"></circle><path d="M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2	c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z"></path><path d="M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8	c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z" data-icon-path="inner-path" opacity="0"></path></svg>'
      );

    const indicator = {
      id: "error",
      image: image,
      outline: false,
      position: "topRight",
      x_pos: -24,
      y_pos: -8
    };

    if (node.app_data.invalidNodeError !== undefined) {
      this.setObjectsStyle(nodeToBeStyled, errorStyle, true);
      this.setNodeDecorations(node.id, [indicator], pipelineId);
    } else {
      this.setObjectsStyle(nodeToBeStyled, defaultStyle, true);
      this.setNodeDecorations(node.id, [], pipelineId);
    }
  }

  /**
   * Checks if there are any circular references between pipeline nodes.
   */
  checkCircularReferences(): void {
    const links: ILink[] = this.getLinks();

    const taintedLinks = checkCircularReferences(links);

    // reset styles.
    const pipelineId = this.getPrimaryPipelineId();
    const allSeenLinks = { [pipelineId]: links.map(l => l.id) };
    const defaultStyle = { line: { default: "" } };
    this.setLinksStyle(allSeenLinks, defaultStyle, true);

    // set error styles
    const cycleLinks = { [pipelineId]: [...taintedLinks] };
    const errorStyle = {
      line: {
        default: "stroke-dasharray: 13; stroke: var(--jp-error-color1);"
      }
    };
    this.setLinksStyle(cycleLinks, errorStyle, true);
  }

  checkEachNode(): void {
    const nodes = this.getNodes();
    for (const node of nodes) {
      const nodeDef = this.nodes.find(n => n.op === node.op);
      if (nodeDef) {
        const error = validateProperties(nodeDef, node);
        node.app_data.invalidNodeError = error;

        node.label =
          nodeDef.labelField && node.app_data[nodeDef.labelField]
            ? node.app_data[nodeDef.labelField]
            : nodeDef.label;
        node.description = nodeDef.description;
        node.image = nodeDef.image;
      } else {
        node.app_data.invalidNodeError = `"${node.op}" is an unsupported node type`;
        node.label = "unsupported node";
        node.description = undefined;

        const image =
          "data:image/svg+xml;utf8," +
          encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" viewBox="0 0 22 22">
          <text
          x="11"
          y="16.5"
          text-anchor="middle"
          fill="red"
          font-family="'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif"
          font-size="15px"
        >
          ?
        </text>
      </svg>`);
        node.image = image;
      }
      this._styleNode(node);
    }
  }

  /**
   * Validates entire pipeline.
   * Checks:
   * - circular reference
   * - node properties
   */
  validate(): void {
    this.checkCircularReferences();
    this.checkEachNode();
  }

  properties(nodeID: string): { label: string; value: any }[] {
    const node = this._getNode(nodeID);
    const nodeDef = this.nodes.find(n => n.op === node.op);

    const properties = (nodeDef?.properties ?? []).map(p => {
      return {
        label: p.label,
        value: node.app_data[p.id]
      };
    });

    return properties;
  }
}

export * from "./types";
export * from "./errors";

export default PipelineController;
