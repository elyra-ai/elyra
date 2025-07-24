#
# Copyright 2018-2025 Elyra Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

.PHONY: help purge uninstall clean
.PHONY: lint-dependencies lint-server black-format prettier-check-ui eslint-check-ui prettier-ui eslint-ui lint-ui lint
.PHONY: dev-link dev-unlink
.PHONY: build-dependencies dev-dependencies yarn-install build-ui-prod build-ui-dev package-ui-prod package-ui-dev
.PHONY: build-server install-server-package install-server
.PHONY: install-prod install-dev install-all-prod install-all-dev install-examples install-gitlab-dependency check-install watch release
.PHONY: test-dependencies pytest test-server test-ui-unit test-integration test-integration-debug test-ui test
.PHONY: docs-dependencies docs
.PHONY: elyra-image elyra-image-env publish-elyra-image kf-notebook-image publish-kf-notebook-image
.PHONY: container-images publish-container-images validate-runtime-image validate-runtime-images

SHELL:=/bin/bash

# Container execs
CONTAINER_EXEC?=docker
# If using podman, use "--format docker" instead
CONTAINER_OUTPUT_OPTION?=--output=type=docker

# Python execs
PYTHON?=python3
PYTHON_PIP=$(PYTHON) -m pip
PYTHON_VERSION?=3.13

CONDA_ACTIVATE = source $$(conda info --base)/etc/profile.d/conda.sh ; conda activate

ELYRA_VERSION:=$$(grep __version__ elyra/_version.py | cut -d"\"" -f2)
TAG:=dev
IMAGE_IS_LATEST=False
ELYRA_IMAGE=elyra/elyra:$(TAG)
ELYRA_IMAGE_LATEST=elyra/elyra:latest
ELYRA_IMAGE_ENV?=elyra-image-env
KF_NOTEBOOK_IMAGE=elyra/kf-notebook:$(TAG)
KF_NOTEBOOK_IMAGE_LATEST=elyra/kf-notebook:latest

# Contains the set of commands required to be used by elyra
REQUIRED_RUNTIME_IMAGE_COMMANDS?="python3"
REMOVE_RUNTIME_IMAGE?=0  # Invoke `make REMOVE_RUNTIME_IMAGE=1 validate-runtime-images` to have images removed after validation
UPGRADE_STRATEGY?=only-if-needed

# Black CMD for code formatting
BLACK_CMD:=$(PYTHON) -m black --check --diff --color .

help:
# http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

## Clean targets

purge:
	rm -rf build *.egg-info yarn-error.log
	rm -rf node_modules lib dist
	rm -rf $$(find packages -name node_modules -type d -maxdepth 2)
	rm -rf $$(find packages -name dist -type d)
	rm -rf $$(find packages -name lib -type d)
	rm -rf $$(find packages -name *.egg-info -type d)
	rm -rf $$(find . -name __pycache__ -type d)
	rm -rf $$(find . -name tsconfig.tsbuildinfo)
	rm -rf $$(find . -name package-lock.json)
	rm -rf $$(find . -name .pytest_cache)
	rm -rf $(yarn cache dir)

uninstall:
	$(PYTHON_PIP) uninstall -y jupyterlab-git
	$(PYTHON_PIP) uninstall -y nbdime
	$(PYTHON_PIP) uninstall -y jupyter-lsp
	- jupyter labextension uninstall @krassowski/jupyterlab-lsp
	$(PYTHON_PIP) uninstall -y jupyterlab-lsp
	$(PYTHON_PIP) uninstall -y python-lsp-server
	$(PYTHON_PIP) uninstall -y jupyter-resource-usage
	- jupyter labextension uninstall @jupyter-server/resource-usage
	$(PYTHON_PIP) uninstall -y elyra
	- jupyter lab clean
	# remove Kubeflow Pipelines example components
	- $(PYTHON_PIP) uninstall -y elyra-examples-kfp-catalog
	# remove GitLab dependency
	- $(PYTHON_PIP) uninstall -y python-gitlab

clean: purge uninstall ## Make a clean source tree and uninstall extensions

## Lint targets

lint-dependencies:
	@$(PYTHON_PIP) install -q -r lint_requirements.txt

lint-server: lint-dependencies
	$(PYTHON) -m flake8 elyra .github
	@echo $(BLACK_CMD)
	@$(BLACK_CMD) || (echo "Black formatting encountered issues.  Use 'make black-format' to apply the suggested changes."; exit 1)

black-format: # Apply black formatter to Python source code
	$(PYTHON) -m black .

prettier-check-ui:
	yarn prettier:check

eslint-check-ui:
	yarn eslint:check --max-warnings=0

prettier-ui:
	yarn prettier

eslint-ui:
	yarn eslint --max-warnings=0

lint-ui: prettier-ui eslint-ui

lint: lint-ui lint-server ## Run linters

## Library linking targets

dev-link:
	- yarn link @elyra/pipeline-services
	- yarn link @elyra/pipeline-editor
	- lerna run link:dev

dev-unlink:
	- yarn unlink @elyra/pipeline-services
	- yarn unlink @elyra/pipeline-editor
	- lerna run unlink:dev
	yarn install --force

## Build and install targets

build-dependencies:
	@$(PYTHON_PIP) install -q --upgrade pip
	@$(PYTHON_PIP) install -q -r build_requirements.txt

dev-dependencies:
	@$(PYTHON_PIP) install -q --upgrade pip
	@$(PYTHON_PIP) install -q jupyter-packaging

yarn-install:
	yarn install

build-ui-prod: ## Build UI packages for production
	yarn lerna run build:prod --stream

build-ui-dev: ## Build UI packages for development
	yarn lerna run build --stream

package-ui-prod: build-dependencies yarn-install lint-ui build-ui-prod ## Package UI for production

package-ui-dev: build-dependencies dev-dependencies yarn-install dev-link lint-ui build-ui-dev ## Package UI for development

build-server: # Build backend
	$(PYTHON) -m build

uninstall-server-package:
	@$(PYTHON_PIP) uninstall elyra -y

install-server-package: uninstall-server-package
	$(PYTHON_PIP) install --upgrade --upgrade-strategy $(UPGRADE_STRATEGY) "$(shell find dist -name "elyra-*-py3-none-any.whl")[kfp-tekton]"

install-server: build-dependencies lint-server build-server install-server-package ## Build and install backend

install-prod: package-ui-prod install-server check-install ## Build and install for production

install-dev: package-ui-dev install-server check-install ## Build and install for development

install-all-prod: package-ui-prod install-server install-examples install-gitlab-dependency check-install ## Build and install for production, including examples

install-all-dev: package-ui-dev install-server install-examples install-gitlab-dependency check-install ## Build and install for development, including examples

install-examples: ## Install example pipeline components
	# install Kubeflow Pipelines example components
	# -> https://github.com/elyra-ai/examples/tree/main/component-catalog-connectors/kfp-example-components-connector
	- $(PYTHON_PIP) install --upgrade elyra-examples-kfp-catalog

install-gitlab-dependency:
	# install GitLab support for Airflow
	- $(PYTHON_PIP) install --upgrade python-gitlab

check-install:
	# Expected to fail due to elyra/ai#3058
	jupyter server extension list
	jupyter labextension list

watch: ## Watch packages. For use alongside jupyter lab --watch
	yarn lerna run watch --parallel

release: yarn-install build-ui-prod build-server ## Build wheel file for release


elyra-image-env: ## Creates a conda env consisting of the dependencies used in images
	- conda env remove -y -n $(ELYRA_IMAGE_ENV)
	conda create -y -n $(ELYRA_IMAGE_ENV) python=$(PYTHON_VERSION) --channel conda-forge
	$(CONDA_ACTIVATE) $(ELYRA_IMAGE_ENV) && \
	$(PYTHON_PIP) install -r etc/generic/requirements-elyra.txt && \
	conda deactivate;

## Test targets

test-dependencies:
	@$(PYTHON_PIP) install -q -r test_requirements.txt

pytest:
	$(PYTHON) -m pytest -v --durations=0 --durations-min=60 elyra --cov --cov-report=xml

test-server: test-dependencies pytest # Run python unit tests

test-ui-unit: # Run frontend jest unit tests
	yarn test:unit

test-instrument: # Prepare code coverage instrumentation
	yarn lerna run cy:instrument --stream

test-integration: # Run frontend cypress integration tests
	jupyter labextension disable "@jupyterlab/apputils-extension:announcements"
	yarn test:integration

test-integration-debug: # Open cypress integration test debugger
	yarn test:integration:debug

test-ui: lint-ui test-ui-unit test-integration # Run frontend tests

test: test-server test-ui ## Run all tests (backend, frontend and cypress integration tests)

## Doc targets

docs-dependencies:
	@$(PYTHON_PIP) install -q -r docs/requirements.txt

docs: docs-dependencies ## Build docs
	make -C docs clean html

## Docker targets

elyra-image: # Build Elyra stand-alone container image
	@mkdir -p build/docker
	cp etc/docker/elyra/Dockerfile build/docker/Dockerfile
	cp etc/docker/elyra/start-elyra.sh build/docker/start-elyra.sh
	cp etc/docker/elyra/requirements.txt build/docker/requirements.txt
	@mkdir -p build/docker/elyra
	cp dist/elyra-$(ELYRA_VERSION)-py3-none-any.whl build/docker/
	$(CONTAINER_EXEC) buildx build \
        --progress=plain \
        $(CONTAINER_OUTPUT_OPTION) \
		--tag docker.io/$(ELYRA_IMAGE) \
		--tag quay.io/$(ELYRA_IMAGE) \
		--build-arg TAG=$(TAG) \
		--build-arg ELYRA_VERSION=$(ELYRA_VERSION) \
		build/docker/;

publish-elyra-image: elyra-image # Publish Elyra stand-alone container image
	# this is a privileged operation; a `docker login` might be required
	$(CONTAINER_EXEC) push docker.io/$(ELYRA_IMAGE)
	$(CONTAINER_EXEC) push quay.io/$(ELYRA_IMAGE)
	# If we're building a release from main, tag latest and push
	if [ "$(IMAGE_IS_LATEST)" == "True" ]; then \
		$(CONTAINER_EXEC) tag docker.io/$(ELYRA_IMAGE) docker.io/$(ELYRA_IMAGE_LATEST); \
		$(CONTAINER_EXEC) push docker.io/$(ELYRA_IMAGE_LATEST); \
		$(CONTAINER_EXEC) tag quay.io/$(ELYRA_IMAGE) quay.io/$(ELYRA_IMAGE_LATEST); \
		$(CONTAINER_EXEC) push quay.io/$(ELYRA_IMAGE_LATEST); \
	fi

kf-notebook-image: # Build elyra image for use with Kubeflow Notebook Server
	@mkdir -p build/docker-kubeflow
	cp etc/docker/kubeflow/* build/docker-kubeflow/
	cp dist/elyra-$(ELYRA_VERSION)-py3-none-any.whl build/docker-kubeflow/
	$(CONTAINER_EXEC) buildx build \
        --progress=plain \
        $(CONTAINER_OUTPUT_OPTION) \
		--tag docker.io/$(KF_NOTEBOOK_IMAGE) \
		--tag quay.io/$(KF_NOTEBOOK_IMAGE) \
		--build-arg TAG=$(TAG) \
		--build-arg ELYRA_VERSION=$(ELYRA_VERSION) \
		build/docker-kubeflow;

publish-kf-notebook-image: kf-notebook-image # Publish elyra image for use with Kubeflow Notebook Server
	# this is a privileged operation; a `docker login` might be required
	$(CONTAINER_EXEC) push docker.io/$(KF_NOTEBOOK_IMAGE)
	$(CONTAINER_EXEC) push quay.io/$(KF_NOTEBOOK_IMAGE)
	# If we're building a release from main, tag latest and push
	if [ "$(IMAGE_IS_LATEST)" == "True" ]; then \
		$(CONTAINER_EXEC) tag docker.io/$(KF_NOTEBOOK_IMAGE) docker.io/$(KF_NOTEBOOK_IMAGE_LATEST); \
		$(CONTAINER_EXEC) push docker.io/$(KF_NOTEBOOK_IMAGE_LATEST); \
		$(CONTAINER_EXEC) tag quay.io/$(KF_NOTEBOOK_IMAGE) quay.io/$(KF_NOTEBOOK_IMAGE_LATEST); \
		$(CONTAINER_EXEC) push quay.io/$(KF_NOTEBOOK_IMAGE_LATEST); \
	fi

container-images: elyra-image kf-notebook-image ## Build all container images
	$(CONTAINER_EXEC) images $(ELYRA_IMAGE)
	$(CONTAINER_EXEC) images quay.io/$(ELYRA_IMAGE)
	$(CONTAINER_EXEC) images $(KF_NOTEBOOK_IMAGE)
	$(CONTAINER_EXEC) images quay.io/$(KF_NOTEBOOK_IMAGE)

publish-container-images: publish-elyra-image publish-kf-notebook-image ## Publish all container images

validate-runtime-images: # Validates delivered runtime-images meet minimum criteria
	@required_commands=$(REQUIRED_RUNTIME_IMAGE_COMMANDS) ; \
	$(PYTHON_PIP) install jq ; \
	for file in `find etc/config/metadata/runtime-images -name "*.json"` ; do \
		image=`cat $$file | jq -e -r '.metadata.image_name'` ; \
		if [ $$? -ne 0 ]; then \
			echo ERROR: $$file does not define the image_name property ; \
			exit 1; \
		fi; \
		make validate-runtime-image image=$$image ; \
	done

validate-runtime-image: # Validate that runtime image meets minimum criteria
	@required_commands=$(REQUIRED_RUNTIME_IMAGE_COMMANDS) ; \
	if [[ $$image == "" ]] ; then \
		echo "Usage: make validate-runtime-image image=<container-image-name>" ; \
		exit 1 ; \
	fi ; \
	$(PYTHON_PIP) install -q jq ; \
	fail=0; \
	echo "***********************************************************" ; \
	echo "Validating container image $$image" ; \
	echo "-----------------------------------------------------------" ; \
	echo "=> Loading container image ..." ; \
	$(CONTAINER_EXEC) inspect $$image > /dev/null 2>&1 ; \
	if [ $$? -ne 0 ]; then \
		echo Container image $$image is not present, pulling... ; \
		$(CONTAINER_EXEC) pull $$image ; \
		if [ $$? -ne 0 ]; then \
			echo "ERROR: pull of container image $$image failed" ; \
			exit 1; \
		fi; \
	fi; \
	for cmd in $$required_commands ; do \
        echo "=> Checking container image $$image for $$cmd..." ; \
		$(CONTAINER_EXEC) run --rm --entrypoint /bin/bash $$image -c "which $$cmd" > /dev/null 2>&1 ; \
		if [ $$? -ne 0 ]; then \
			echo "ERROR: Container image $$image does not meet criteria for command: $$cmd" ; \
			fail=1; \
			continue; \
		fi; \
		if [ $$cmd == "python3" ]; then \
			IMAGE_PYTHON3_MINOR_VERSION=`$(CONTAINER_EXEC) run --rm --entrypoint /bin/bash $$image -c "$$cmd --version" | cut -d' ' -f2 | cut -d'.' -f2` ; \
			if [[ $$IMAGE_PYTHON3_MINOR_VERSION -lt 9 ]]; then \
				echo "WARNING: Container image $$image requires Python 3.9 or greater for latest generic component dependency installation" ; \
				fail=1; \
			elif [[ $$IMAGE_PYTHON3_MINOR_VERSION -ge 9 ]]; then \
				echo "=> Checking notebook execution..." ; \
				$(CONTAINER_EXEC) run -v $$(pwd)/etc/generic:/opt/elyra/ --rm --entrypoint /bin/bash $$image -c "python3 -m pip install -r /opt/elyra/requirements-elyra.txt && \
							   python3 -c 'import urllib.request; urllib.request.urlretrieve(\"https://raw.githubusercontent.com/nteract/papermill/main/papermill/tests/notebooks/simple_execute.ipynb\", \"simple_execute.ipynb\")' && \
							   python3 -m papermill simple_execute.ipynb output.ipynb > /dev/null" ; \
				if [ $$? -ne 0 ]; then \
					echo "ERROR: Image $$image does not meet Python requirements criteria in requirements-elyra.txt" ; \
					fail=1; \
				fi; \
			else \
				echo "ERROR: Container image $$image: unable to parse Python version" ; \
				fail=1; \
			fi; \
		fi; \
	done ; \
	if [ $(REMOVE_RUNTIME_IMAGE) -eq 1 ]; then \
		echo Removing container image $$image... ; \
		$(CONTAINER_EXEC) rmi $$image > /dev/null ; \
	fi; \
	echo "-----------------------------------------------------------" ; \
	if [ $$fail -eq 1 ]; then \
		echo "=> ERROR: Container image $$image is not a suitable Elyra runtime image" ; \
		exit 1 ; \
	else \
		echo "=> Container image $$image is a suitable Elyra runtime image" ; \
	fi; \
