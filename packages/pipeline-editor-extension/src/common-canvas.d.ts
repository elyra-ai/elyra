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

declare module '@elyra/canvas';

interface ITipPaletteItemEvent {
  nodeTemplate: any;
}

interface ITipPaletteCategory {
  category: any;
}

interface ITipNode {
  pipelineId: string;
  node: any;
}

interface ITipPort {
  pipelineId: string;
  node: any;
  port: any;
}

interface ITipLink {
  pipelineId: string;
  link: any;
}

type ITipEvent =
  | ITipPaletteItemEvent
  | ITipPaletteCategory
  | ITipNode
  | ITipPort
  | ITipLink;

interface ICanvasEditEvent {
  editType: string;
  editSource: 'canvas' | 'contextmenu';
  pipelineId: string;
  [key: string]: any;
}

type IClickType = 'DOUBLE_CLICK' | 'SINGLE_CLICK_CONTEXTMENU' | 'SINGLE_CLICK';

type ICanvasClickEvent =
  | {
      clickType: IClickType;
      objectType: 'canvas';
      selectedObjectIds: string[];
    }
  | {
      clickType: IClickType;
      objectType: 'node' | 'link' | 'comment';
      selectedObjectIds: string[];
      id: string;
      pipelineId: string;
    };

type IContextMenu = IContextMenuItem[];

interface IContextMenuItem {
  action: string;
  label: string;
}

interface IContextMenuEvent {
  type: string;
  selectedObjectIds: string[];
  targetObject: any;
}

type NodeTypeDef =
  | IExecutionNodeDef
  | ISupernodeDef
  | IBindingEntryNodeDef
  | IBindingExitNodeDef
  | IModelNodeDef;

/**
 * WDP Pipeline Flow Schema
 */
interface IPipeline {
  /**
   * Document type
   */
  doc_type: string;
  /**
   * Pipeline-flow schema version
   */
  version: '3.0';
  /**
   * Refers to the JSON schema used to validate documents of this type
   */
  json_schema?: 'http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json';
  /**
   * Preferred authoring application
   */
  open_with_tool?: string;
  /**
   * Document identifier, GUID recommended
   */
  id?: string;
  /**
   * Parameters for the flow document
   */
  parameters?: {
    [k: string]: any;
  };
  /**
   * Reference to the primary (main) pipeline flow within the document
   */
  primary_pipeline: string;
  /**
   * Array of pipelines
   */
  pipelines: IPipelineDef[];
  /**
   * Array of data record schemas used in the document
   */
  schemas?: any[];
  /**
   * Array of runtime objects referred to in the document
   */
  runtimes?: IRuntimeDef[];
  /**
   * Array of parameterized property references
   */
  external_parameters?: any[];
  app_data?: IAppDataDef;
}
/**
 * Definition of a single pipeline flow
 */
interface IPipelineDef {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * User-readable name
   */
  name?: string;
  /**
   * Reference to the id of the runtime associated with the operations in the current pipeline
   */
  runtime_ref: string;
  /**
   * Array of pipeline nodes
   */
  nodes: NodeTypeDef[];
  /**
   * Parameters for the pipeline
   */
  parameters?: {
    [k: string]: any;
  };
  app_data?: IAppDataDef;
}
/**
 * Definition of a single execution pipeline node
 */
interface IExecutionNodeDef {
  /**
   * Unique identifier for node within the current pipeline
   */
  id: string;
  /**
   * Node type - always 'execution_node' for non-model pipeline elements
   */
  type: 'execution_node';
  /**
   * Operator type identifier
   */
  op: string;
  inputs?: IPortDef[];
  outputs?: IPortDef[];
  /**
   * Input parameters for the operator
   */
  parameters?: {
    [k: string]: any;
  };
  /**
   * Optional reference to the id of the runtime associated with the current node
   */
  runtime_ref?: string;
  app_data?: IAppDataDef;
}
/**
 * Port definition (input/output) on a node
 */
interface IPortDef {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Optional data record schema reference associated with the port
   */
  schema_ref?: string;
  /**
   * Array of links going into the node. Applies to input ports and exit bindings only.
   */
  links?: ILinkDef[];
  /**
   * Parameters for the port
   */
  parameters?: {
    [k: string]: any;
  };
  app_data?: IAppDataDef;
}
/**
 * Node link definition
 */
interface ILinkDef {
  /**
   * id of a node this link connects to
   */
  node_id_ref: string;
  /**
   * optional port id of a node this link connects to
   */
  port_id_ref?: string;
  /**
   * optional link name (used in parameter sets when there are multiple input sources)
   */
  link_name?: string;
  app_data?: IAppDataDef;
}
/**
 * Object containing app-specific data
 */
interface IAppDataDef {
  ui_data?: {
    [k: string]: any;
  };
  [k: string]: any;
}
/**
 * Definition of a supernode which serves as the entry point for a sub-pipeline
 */
interface ISupernodeDef {
  /**
   * Unique identifier for the supernode within the current pipeline
   */
  id: string;
  /**
   * Node type - always 'super_node' for supernode elements
   */
  type: 'super_node';
  /**
   * Name of the tool which can be used to view or edit the sub-flow for this supernode. The default is 'canvas'
   */
  open_with_tool?: string;
  /**
   * Refers to the sub-flow associated with this supernode
   */
  subflow_ref: {
    /**
     * Reference to an external sub-flow. When not present the sub-flow is assumed to be in the current document. A value of 'app_defined' indicates a sub-flow identifier is present, but the controlling application will serve up the sub-pipeline in the form of a new pipeline-flow document (no sub-flow is present in the document).
     */
    url?: string;
    /**
     * Sub-flow identifier reference
     */
    pipeline_id_ref: string;
    [k: string]: any;
  };
  inputs?: IBoundPortDef[];
  outputs?: IBoundPortDef[];
  /**
   * Input parameters for the supernode
   */
  parameters?: {
    [k: string]: any;
  };
  app_data?: IAppDataDef;
}
/**
 * Port definition (input/output) on a node with optional pipeline port binding for supernodes
 */
interface IBoundPortDef {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Optional data record schema associated with the port
   */
  schema_ref?: string;
  /**
   * Array of links going into the node. Applies to input ports and exit bindings only.
   */
  links?: ILinkDef[];
  /**
   * Optional node id binding within the current document.
   */
  subflow_node_ref?: string;
  /**
   * Parameters for the binding port
   */
  parameters?: {
    [k: string]: any;
  };
  app_data?: IAppDataDef;
}
/**
 * Defines an entry point (source) for a pipeline. Bindings can be concrete: the concrete_binding element is present on the port; or bindings can be abstract: bindings are performed externally via configuration or a wrapper document.
 */
interface IBindingEntryNodeDef {
  /**
   * Unique identifier for the binding within the current pipeline
   */
  id: string;
  /**
   * Node type - always 'binding' for binding elements
   */
  type: 'binding';
  outputs?: IPortDef[];
  app_data?: IAppDataDef;
  connection?: {
    [k: string]: any;
  };
  data_asset?: {
    [k: string]: any;
  };
  /**
   * Binding node type identifier
   */
  op?: string;
  /**
   * Parameters for the binding entry node
   */
  parameters?: {
    [k: string]: any;
  };
}
/**
 * Defines an exit point (sink) for a pipeline. Bindings can be concrete: the concrete_binding element is present on the port; or bindings can be abstract: bindings are performed externally via configuration or a wrapper document.
 */
interface IBindingExitNodeDef {
  /**
   * Unique identifier for the binding within the current pipeline
   */
  id: string;
  /**
   * Node type - always 'binding' for binding elements
   */
  type: 'binding';
  inputs?: IPortDef[];
  app_data?: IAppDataDef;
  connection?: {
    [k: string]: any;
  };
  data_asset?: {
    [k: string]: any;
  };
  /**
   * Binding node type identifier
   */
  op?: string;
  /**
   * Parameters for the binding exit node
   */
  parameters?: {
    [k: string]: any;
  };
}
/**
 * Definition of a single predictive model node
 */
interface IModelNodeDef {
  /**
   * Unique identifier for the model within the current pipeline
   */
  id: string;
  /**
   * Node type - always 'model_node' for model pipeline elements
   */
  type: 'model_node';
  /**
   * Reference to the binary model
   */
  model_ref?: string;
  inputs: IPortDef[];
  outputs?: IPortDef[];
  /**
   * Input parameters for the operator
   */
  parameters?: {
    [k: string]: any;
  };
  /**
   * Reference to the runtime associated with the current node
   */
  runtime_ref?: string;
  app_data?: IAppDataDef;
}
/**
 * Runtime associated with the operations in the current pipeline
 */
interface IRuntimeDef {
  /**
   * Unique internal runtime identifier
   */
  id: string;
  /**
   * The runtime name
   */
  name: string;
  /**
   * The runtime version. When not present the latest version is assumed
   */
  version?: string;
  app_data?: IAppDataDef;
  [k: string]: any;
}
