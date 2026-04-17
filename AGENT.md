<!--
Copyright 2018-2026 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Elyra - AI Agent Guidelines

## Project Overview

Elyra is a set of AI-centric extensions to JupyterLab Notebooks. It provides
a visual pipeline editor, batch job execution for notebooks/scripts, reusable
code snippets, AI assistant integration, and hybrid runtime support.

## Repository Structure

```
elyra/                  # Main Python package
  airflow/              # Apache Airflow runtime integration
  api/                  # REST API handlers
  cli/                  # Command-line interface
  contents/             # Jupyter contents manager extensions
  kfp/                  # Kubeflow Pipelines runtime integration
  metadata/             # Metadata service (schemas, storage, handlers)
  pipeline/             # Pipeline definition, parsing, and processing
  templates/            # Jinja2 templates for pipeline generation
  tests/                # Python unit and integration tests
  util/                 # Shared utilities
  elyra_app.py          # Jupyter server extension entry point
packages/               # TypeScript/JupyterLab frontend extensions
  code-snippet/         #   Code snippet editor and management
  metadata/             #   Metadata explorer UI
  metadata-common/      #   Shared metadata utilities
  pipeline-editor/      #   Visual pipeline editor
  python-editor/        #   Python script editor
  r-editor/             #   R script editor
  scala-editor/         #   Scala script editor
  script-debugger/      #   Script debugger integration
  script-editor/        #   Base script editor (shared by language editors)
  services/             #   Frontend service clients (API wrappers)
  theme/                #   Elyra theme extension
  ui-components/        #   Shared UI components library
labextensions/          # Pre-built JupyterLab extensions
cypress/                # End-to-end integration tests (Cypress)
docs/                   # Sphinx documentation source
etc/                    # Docker, Kubernetes, and deployment configs
```

## Tech Stack

- **Backend:** Python 3.10+, Jupyter Server, Tornado
- **Frontend:** TypeScript, JupyterLab 4.x, React
- **Build:** Hatchling (Python), Lerna + Yarn (JS), Makefile orchestration
- **Testing:** pytest (backend), Jest (frontend unit), Cypress (integration)
- **Linting:** ruff/black (Python), ESLint + Prettier (TypeScript)
- **Runtimes:** Apache Airflow, Kubeflow Pipelines

## Development Setup

```bash
# Install all dependencies and build
make install-all-dev

# Run backend tests
make test-server

# Run frontend unit tests
make test-ui-unit

# Run integration tests
make test-integration

# Lint all code
make lint
```

## Coding Conventions

### Python

- Follow PEP 8; use `black` for formatting and `ruff` for linting
- Type annotations are required for all public functions
- Use `logging.getLogger(__name__)` instead of `print()`
- Catch specific exceptions; avoid bare `except:`
- Use Google-style docstrings for public classes and methods
- Tests use `pytest` with fixtures; prefer `@pytest.mark.parametrize`

### TypeScript / JupyterLab

- Follow the existing ESLint + Prettier configuration
- JupyterLab extensions follow the `@elyra/<extension-name>` namespace
- Frontend packages are managed via Lerna monorepo in `packages/`

### General

- Copyright header required on all source files (Apache 2.0)
- All commits must be signed (`git commit -s`) to comply with the
  [Developer Certificate of Origin (DCO)](https://developercertificate.org/)
- Keep PRs focused on a single concern

## Git Best Practices

- Follow the 7 rules for a great commit message:
  - Separate subject from body with a blank line
  - Limit the subject line to 50 characters
  - Capitalize the subject line
  - Do not end the subject line with a period
  - Use the imperative mood in the subject line
  - Wrap the body at 72 characters
  - Use the body to explain what and why vs. how

## Key Architectural Concepts

- **Pipeline Editor:** Visual DAG editor for defining ML/data pipelines.
  Pipeline definitions are JSON files stored in the workspace.
- **Metadata Service:** Manages runtime configurations, component catalogs,
  and code snippets. Schemas are defined in `metadata/schemas/`.
- **Runtime Processors:** Convert visual pipeline definitions into
  runtime-specific artifacts (Airflow DAGs, KFP pipelines).
- **Catalog Connectors:** Discover reusable pipeline components from various
  sources (filesystem, URLs, Airflow packages).

## Important Files

- `elyra/elyra_app.py` - Server extension entry point
- `elyra/pipeline/pipeline.py` - Core pipeline data model
- `elyra/pipeline/processor.py` - Base pipeline processor
- `elyra/metadata/manager.py` - Metadata service manager
- `Makefile` - All build, test, and release targets
- `pyproject.toml` - Python project configuration
- `package.json` - JS/TS workspace configuration

## Documentation Tone & Style

When writing or updating documentation in `docs/source/`, follow the
established tone and style conventions described below.

### Voice

- Use **third-person, impersonal, product-focused** language. The subject
  should be "Elyra" or the feature itself, not the reader.
  - *Yes:* "Elyra provides a Pipeline Visual Editor..."
  - *No:* "We give you a Pipeline Visual Editor..."
- Address the reader directly with "you" only in **instructional/procedural**
  sections (installation steps, recipes, troubleshooting), not in conceptual
  descriptions.

### Tone

- **Formal-neutral and technical.** No humor, colloquialisms, or
  personality flourishes.
- **No enthusiasm markers.** Avoid exclamation points, "exciting",
  "powerful", or other marketing language. Adjectives should be strictly
  functional (e.g., "enhanced", "reusable", "generic").
- **Understated warnings.** Use inline `Note:` or `**NOTE:**` blocks
  rather than dramatic callouts.
- **Cautious hedging** where appropriate (e.g., "might work but have not
  been tested").

### Structure

- Use **bulleted and numbered lists** liberally.
- Follow a **hierarchical heading structure** (H2 > H3 > H4 > H5) for
  reference-style content.
- Write procedural sections as **numbered step-by-step** instructions.
- Include **screenshots and GIFs** as primary illustration where
  applicable.
- Add frequent **cross-references** to other doc pages and external
  resources using relative links.
- For property/configuration reference sections, use a
  **definition-style** format: property name followed by a dash and its
  description.

### Sentence Style

- Prefer **long, information-dense sentences** that pack multiple related
  concepts together over short, choppy ones.
- Favor **noun phrases** over verb phrases where natural (e.g., "the
  conversion of multiple notebooks" rather than "converting multiple
  notebooks").

### Terminology

- *Italicize* key terms on first use (e.g., _pipeline_, _nodes_,
  _component_).
- **Bold** product names and feature names on first mention.
- Use technical terms (PVC, DAG, KubernetesPodOperator) without
  simplification — assume a **technically proficient audience** familiar
  with Jupyter, Kubernetes, and ML pipeline concepts.

### Summary

| Attribute             | Description                                        |
|-----------------------|----------------------------------------------------|
| **Formality**         | High — enterprise product documentation style      |
| **Personality**       | Minimal — intentionally neutral                    |
| **Audience**          | Intermediate-to-advanced (Jupyter, K8s, ML)        |
| **Primary mode**      | Reference/procedural, not tutorial/narrative        |
| **Brevity**           | Low — thorough, sometimes verbose explanations     |
| **Consistency**       | High — follow the shared template across sections  |

## Testing Guidelines

- All new features must include tests
- Backend tests go in `elyra/tests/` mirroring the source structure
- Use `conftest.py` fixtures for shared test setup
- Integration tests using Cypress are in `cypress/`
- Run `make test-server` before submitting backend changes
- Run `make test-ui-unit` before submitting frontend changes
