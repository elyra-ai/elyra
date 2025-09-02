<!--
{% comment %}
Copyright 2018-2025 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
{% endcomment %}
-->

# Elyra Architecture

This document provides a comprehensive overview of the Elyra software architecture, 
including its major components, relationships, and key properties.

## Overview

Elyra is a set of AI-centric extensions to JupyterLab that provides enhanced functionality for data science workflows.
It enables users to create, edit, and run complex machine learning pipelines in distributed runtime environments such as 
Kubeflow Pipelines and Apache Airflow.

## High-Level Architecture

Elyra follows a modular, extensible architecture built on top of JupyterLab's extension framework. 
The system is composed of several major subsystems that work together to provide a comprehensive data science platform.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  Frontend (Browser)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  JupyterLab Extensions                                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐   │
│  │ Pipeline Editor │ │ Script Editors  │ │ Code Snippets   │ │ Metadata UI  │   │
│  │                 │ │ (Python/R/Scala)│ │                 │ │              │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              JupyterLab Core                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           Backend (Jupyter Server)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Elyra Server Extension (ElyraApp)                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐   │
│  │ Pipeline        │ │ Metadata        │ │ Component       │ │ Content      │   │
│  │ Processing      │ │ Management      │ │ Catalog         │ │ Management   │   │
│  │ Engine          │ │ Service         │ │ Service         │ │ Service      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              Jupyter Server                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                             Storage Layer                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ File System     │ │ Metadata Store  │ │ Component Cache │ │ Pipeline        ││
│  │ (Notebooks,     │ │ (JSON Files)    │ │ (Local Cache)   │ │ Snapshot        ││
│  │ Scripts, etc.)  │ │                 │ │                 │ │ (s3/minio)      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘│
├─────────────────────────────────────────────────────────────────────────────────┤
│                            External Runtimes                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                    │
│  │ Kubeflow        │ │ Apache Airflow  │ │ Local Runtime   │                    │
│  │ Pipelines       │ │                 │ │                 │                    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Components (JupyterLab Extensions)

#### Pipeline Editor Extension
- **Purpose**: Low code/No code Visual pipeline designer and editor
- **Key Properties**: 
  - Low code/No code drag-and-drop interface for pipeline creation
  - Node-based workflow representation
  - Supports Jupyter Notebooks, Scripts, and runtime-specific components
  - Integration with JupyterLab file browser
- **Relationships**: Communicates and Integrates with Pipeline Processing Engine via REST API

#### Script Editors (Python/R/Scala)
- **Purpose**: Enhanced script editing with runtime execution capabilities 
- **Key Properties**:
  - Syntax highlighting and code completion
  - Direct script execution on remote runtimes
  - Integration with kernel management
- **Relationships**: Extends JupyterLab's editor framework

#### Code Snippets Extension
- **Purpose**: Reusable code-snippets management
- **Key Properties**:
  - Searchable snippet library
  - Language-agnostic snippet support
  - Integration with all editor types
- **Relationships**: Uses Metadata Service for snippet storage

#### Metadata UI Components
- **Purpose**: User interface for runtime and component configuration
- **Key Properties**:
  - Form-based metadata editing
  - Schema-driven validation
  - Dynamic form generation based on metadata schema
- **Relationships**: Directly interfaces with the Metadata Management Service

### 2. Backend Services (Jupyter Server Extension)

#### ElyraApp (Main Application)
- **Purpose**: Central orchestrator and entry point
- **Key Properties**:
  - Extends Jupyter Server Extension framework
  - Manages component lifecycle
  - Handles HTTP request routing
- **Relationships**: Coordinates all backend services and manages their initialization

#### Pipeline Processing Engine
- **Purpose**: Core pipeline execution and management system
- **Key Properties**:
  - Runtime-agnostic pipeline processing
  - Extensible processor architecture
  - Pipeline validation and transformation
- **Relationships**: 
  - Uses Metadata Service for runtime configurations
  - Interfaces with external runtime systems
  - Processes pipeline definitions from Pipeline Editor

**Sub-components:**
- **PipelineProcessor**: Abstract base for runtime-specific processors
- **KFPProcessor**: Kubeflow Pipelines implementation
- **AirflowProcessor**: Apache Airflow implementation
- **LocalProcessor**: Local execution implementation

#### Metadata Management Service
- **Purpose**: Schema-driven configuration and metadata storage
- **Key Properties**:
  - JSON Schema validation
  - Pluggable storage backends
  - Extensible schema system via entry points
  - REST API for CRUD operations
- **Relationships**: 
  - Provides configuration data to all other services
  - Uses Storage Layer for persistence
  - Supports dynamic schema registration

**Sub-components:**
- **MetadataManager**: Core metadata operations
- **SchemaManager**: Schema validation and management
- **Schemaspace**: Logical grouping of related schemas
- **SchemasProvider**: Dynamic schema provisioning

#### Component Catalog Service
- **Purpose**: Pipeline component discovery and management
- **Key Properties**:
  - Component registry and caching
  - Multiple catalog connector support
  - Automatic component discovery
  - Component metadata enrichment
- **Relationships**: 
  - Integrates with external component repositories
  - Provides components to Pipeline Editor
  - Uses caching for performance optimization

#### Content Management Service
- **Purpose**: Enhanced file and content handling
- **Key Properties**:
  - Content parsing and metadata extraction
  - File property analysis
  - Integration with Jupyter's content management
- **Relationships**: Extends Jupyter Server's content management

### 3. Storage Layer

#### File System Storage
- **Purpose**: Primary storage for notebooks, scripts, and user files
- **Key Properties**:
  - Standard file system operations
  - Integration with Jupyter's file management
  - Support for various file formats

#### Metadata Store
- **Purpose**: Persistent storage for configuration and metadata
- **Key Properties**:
  - Default implementation uses JSON files
  - Pluggable storage architecture
  - Schema-based organization
- **Default Location**: `{JUPYTER_DATA_DIR}/metadata/`

#### Component Cache
- **Purpose**: Local caching of pipeline components
- **Key Properties**:
  - Performance optimization for component loading
  - Automatic cache invalidation
  - Background cache updates

### 4. External Runtime Integration

#### Kubeflow Pipelines (KFP)
- **Integration Method**: REST API and Python SDK
- **Key Capabilities**:
  - Pipeline compilation and submission
  - Experiment and run management
  - Artifact tracking and visualization

#### Apache Airflow
- **Integration Method**: DAG generation and submission
- **Key Capabilities**:
  - Workflow scheduling and monitoring
  - Task dependency management
  - Operator-based execution model

#### Local Runtime
- **Integration Method**: Direct process execution
- **Key Capabilities**:
  - Local development and testing
  - Simplified execution model
  - No external dependencies

## Key Architectural Patterns

### 1. Extension-Based Architecture
Elyra leverages JupyterLab's extension system to provide modular functionality. Each major feature is implemented as a separate extension that can be independently developed, tested, and deployed.

### 2. Service-Oriented Design
Backend services are designed as independent modules with well-defined interfaces, enabling loose coupling and high cohesion.

### 3. Schema-Driven Configuration
The metadata system uses JSON Schema to drive configuration management, ensuring consistency and enabling dynamic UI generation.

### 4. Plugin Architecture
Both pipeline processors and component catalog connectors use a plugin pattern, allowing for easy extension with new runtime support.

### 5. Event-Driven Communication
Components communicate through well-defined APIs and event mechanisms, reducing direct dependencies.

## Security Architecture

### Authentication and Authorization
- Inherits security model from Jupyter Server
- No additional authentication mechanisms
- Relies on Jupyter's token-based authentication

### Data Security
- All sensitive configuration data (passwords, tokens) is stored in metadata
- No plaintext storage of credentials in pipeline definitions
- Runtime-specific security handled by target platforms

### Network Security
- All external communications use HTTPS where supported
- Runtime credentials managed through secure metadata storage
- No direct network exposure beyond Jupyter Server

## Scalability and Performance

### Horizontal Scalability
- Pipeline execution scales through external runtime systems
- Component catalog supports distributed repositories
- The metadata service can be configured with alternative storage backends

### Performance Optimizations
- Component caching reduces repeated network requests
- Lazy loading of pipeline components
- Efficient pipeline validation and compilation

### Resource Management
- Memory usage optimized through component caching strategies
- Background processes for cache management and updates
- Configurable resource limits through Jupyter Server

## Extension Points

### 1. Runtime Processors
New runtime systems can be integrated by implementing the `RuntimePipelineProcessor` interface and registering through entry points.

### 2. Component Catalog Connectors
Custom component repositories can be integrated through the `ComponentCatalogConnector` interface.

### 3. Metadata Schemas
New configuration schemas can be added through the `SchemasProvider` mechanism.

### 4. Storage Backends
Alternative storage implementations can be provided through the `MetadataStore` interface.

## Data Flow

### Pipeline Creation and Execution
1. User creates pipeline in Pipeline Editor (Frontend)
2. Pipeline definition sent to Pipeline Processing Engine (Backend)
3. Engine validates pipeline against schemas
4. Runtime-specific processor transforms pipeline
5. Pipeline submitted to the external runtime system
6. Results and status tracked through runtime APIs

### Component Discovery
1. Component Catalog Service queries registered connectors
2. Components cached locally for performance
3. Component metadata exposed through REST API
4. Pipeline Editor requests available components
5. User adds components to the pipeline canvas

### Metadata Management
1. User configures runtimes through the Metadata UI
2. Configuration validated against JSON schemas
3. Metadata persisted through the storage layer
4. Other services query metadata as needed
5. Changes propagated through cache invalidation

## Quality Attributes

### Maintainability
- Modular architecture with clear separation of concerns
- Comprehensive test coverage across components
- Standardized coding patterns and conventions

### Extensibility
- Plugin architecture for runtimes and components
- Schema-driven configuration system
- Entry point-based service discovery

### Reliability
- Comprehensive error handling and logging
- Graceful degradation when external services are unavailable
- Robust pipeline validation before execution

### Usability
- Intuitive visual pipeline editor
- Consistent UI patterns across extensions
- Comprehensive documentation and examples

This architecture enables Elyra to provide a comprehensive, extensible platform for AI and data science workflows while 
maintaining integration with the broader Jupyter ecosystem.
