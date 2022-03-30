#
# Copyright 2018-2022 Elyra Authors
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

.PHONY: help purge uninstall-src uninstall clean
.PHONY: lint-dependencies lint-server prettier-check-ui eslint-check-ui prettier-ui eslint-ui lint-ui lint
.PHONY: dev-link dev-unlink
.PHONY: build-dependencies yarn-install build-ui package-ui build-server install-server-package install-server
.PHONY: install install-all install-examples install-gitlab-dependency check-install watch release
.PHONY: test-dependencies pytest test-server test-ui-unit test-integration test-integration-debug test-ui test
.PHONY: docs-dependencies docs
.PHONY: elyra-image publish-elyra-image kf-notebook-image publish-kf-notebook-image
.PHONY: container-images publish-container-images validate-runtime-images
SHELL:=/bin/bash

# Python execs
PYTHON?=python3
PYTHON_PIP=$(PYTHON) -m pip

TAG:=3.7.0
ELYRA_IMAGE=elyra/elyra:$(TAG)
KF_NOTEBOOK_IMAGE=elyra/kf-notebook:$(TAG)

# Contains the set of commands required to be used by elyra
REQUIRED_RUNTIME_IMAGE_COMMANDS?="curl python3"
REMOVE_RUNTIME_IMAGE?=0  # Invoke `make REMOVE_RUNTIME_IMAGE=1 validate-runtime-images` to have images removed after validation
UPGRADE_STRATEGY?=only-if-needed

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

uninstall-src: # Uninstalls source extensions if they're still installed
	- jupyter labextension unlink --no-build @elyra/services
	- jupyter labextension unlink --no-build @elyra/ui-components
	- jupyter labextension unlink --no-build @elyra/metadata-common
	- jupyter labextension unlink --no-build @elyra/script-editor
	- jupyter labextension uninstall --no-build @elyra/theme-extension
	- jupyter labextension uninstall --no-build @elyra/code-snippet-extension
	- jupyter labextension uninstall --no-build @elyra/metadata-extension
	- jupyter labextension uninstall --no-build @elyra/pipeline-editor-extension
	- jupyter labextension uninstall --no-build @elyra/python-editor-extension
	- jupyter labextension uninstall --no-build @elyra/r-editor-extension
	- jupyter labextension uninstall --no-build @elyra/code-viewer-extension
	- jupyter labextension unlink --no-build @elyra/pipeline-services
	- jupyter labextension unlink --no-build @elyra/pipeline-editor

uninstall: uninstall-src
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
	# remove Apache Airflow example components
	- $(PYTHON_PIP) uninstall -y elyra-examples-airflow-catalog
	# remove GitLab dependency
	- $(PYTHON_PIP) uninstall -y python-gitlab

clean: purge uninstall ## Make a clean source tree and uninstall extensions

## Lint targets

lint-dependencies:
	@$(PYTHON_PIP) install -q -r lint_requirements.txt

lint-server: lint-dependencies
	flake8 elyra

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
	yarn link @elyra/pipeline-services
	yarn link @elyra/pipeline-editor

dev-unlink:
	yarn unlink @elyra/pipeline-services
	yarn unlink @elyra/pipeline-editor
	yarn install --force

## Build and install targets

build-dependencies:
	@$(PYTHON_PIP) install -q --upgrade pip
	@$(PYTHON_PIP) install -q -r build_requirements.txt

yarn-install:
	yarn install

build-ui: # Build packages
	yarn lerna run build --stream

package-ui: build-dependencies yarn-install lint-ui build-ui

build-server: # Build backend
	$(PYTHON) -m setup bdist_wheel sdist

install-server-package:
	$(PYTHON_PIP) install --upgrade --upgrade-strategy $(UPGRADE_STRATEGY) --use-deprecated=legacy-resolver "$(shell find dist -name "elyra-*-py3-none-any.whl")[kfp-tekton]"

install-server: build-dependencies lint-server build-server install-server-package ## Build and install backend

install: package-ui install-server check-install ## Build and install

install-all: package-ui install-server install-examples install-gitlab-dependency check-install ## Build and install, including examples

install-examples: ## Install example pipeline components 
	# install Kubeflow Pipelines example components
	# -> https://github.com/elyra-ai/examples/tree/master/component-catalog-connectors/kfp-example-components-connector
	- $(PYTHON_PIP) install --upgrade elyra-examples-kfp-catalog
	# install Apache Airflow example components
	# -> https://github.com/elyra-ai/examples/tree/master/component-catalog-connectors/airflow-example-components-connector
	- $(PYTHON_PIP) install --upgrade elyra-examples-airflow-catalog

install-gitlab-dependency:
	# install GitLab support for Airflow
	- $(PYTHON_PIP) install --upgrade python-gitlab

check-install:
	jupyter server extension list
	jupyter labextension list

watch: ## Watch packages. For use alongside jupyter lab --watch
	yarn lerna run watch --parallel

release: yarn-install build-ui build-server ## Build wheel file for release

## Test targets

test-dependencies:
	@$(PYTHON_PIP) install -q -r test_requirements.txt

pytest:
	$(PYTHON) -m pytest -v elyra

test-server: test-dependencies pytest # Run python unit tests

test-ui-unit: # Run frontend jest unit tests
	yarn test:unit

test-integration: # Run frontend cypress integration tests
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
	if [ "$(TAG)" == "dev" ]; then \
		cp etc/docker/elyra/Dockerfile.dev build/docker/Dockerfile; \
		git -C ./ ls-files --exclude-standard -oi --directory > .git/ignores.tmp; \
		rsync -ah --progress --delete --delete-excluded ./ build/docker/elyra/ \
			 --exclude ".git" \
			 --exclude ".github" \
			 --exclude-from ".git/ignores.tmp"; \
		rm -f .git/ignores.tmp; \
	fi
	docker buildx build \
        --progress=plain \
        --output=type=docker \
		--tag docker.io/$(ELYRA_IMAGE) \
		--tag quay.io/$(ELYRA_IMAGE) \
		--build-arg TAG=$(TAG) \
		build/docker/;

publish-elyra-image: elyra-image # Publish Elyra stand-alone container image
	# this is a privileged operation; a `docker login` might be required
	docker push docker.io/$(ELYRA_IMAGE)
	docker push quay.io/$(ELYRA_IMAGE)

kf-notebook-image: # Build elyra image for use with Kubeflow Notebook Server
	@mkdir -p build/docker-kubeflow
	cp etc/docker/kubeflow/Dockerfile build/docker-kubeflow/Dockerfile
	@mkdir -p build/docker-kubeflow/elyra
	if [ "$(TAG)" == "dev" ]; then \
		cp etc/docker/kubeflow/Dockerfile.dev build/docker-kubeflow/Dockerfile; \
		git -C ./ ls-files --exclude-standard -oi --directory > .git/ignores.tmp; \
		rsync -ah --progress --delete --delete-excluded ./ build/docker-kubeflow/elyra/ \
			 --exclude ".git" \
			 --exclude ".github" \
			 --exclude-from ".git/ignores.tmp"; \
		rm -f .git/ignores.tmp; \
	fi
	docker buildx build \
        --progress=plain \
        --output=type=docker \
		--tag docker.io/$(KF_NOTEBOOK_IMAGE) \
		--tag quay.io/$(KF_NOTEBOOK_IMAGE) \
		--build-arg TAG=$(TAG) \
		build/docker-kubeflow;

publish-kf-notebook-image: kf-notebook-image # Publish elyra image for use with Kubeflow Notebook Server
	# this is a privileged operation; a `docker login` might be required
	docker push docker.io/$(KF_NOTEBOOK_IMAGE)
	docker push quay.io/$(KF_NOTEBOOK_IMAGE)

container-images: elyra-image kf-notebook-image ## Build all container images
	docker images $(ELYRA_IMAGE)
	docker images quay.io/$(ELYRA_IMAGE)
	docker images $(KF_NOTEBOOK_IMAGE)
	docker images quay.io/$(KF_NOTEBOOK_IMAGE)

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
		fail=0; \
		for cmd in $$required_commands ; do \
			echo Checking $$image in $$file for $$cmd... ; \
			docker inspect $$image > /dev/null 2>&1 ; \
			if [ $$? -ne 0 ]; then \
				echo Image $$image is not present, pulling... ; \
			fi; \
			docker run --rm $$image which $$cmd > /dev/null 2>&1 ; \
			if [ $$? -ne 0 ]; then \
				echo ERROR: Image $$image did not meet criteria for command: $$cmd ; \
				fail=1; \
			fi; \
		done; \
		if [ $(REMOVE_RUNTIME_IMAGE) -eq 1 ]; then \
			echo Removing image $$image... ; \
			docker rmi $$image > /dev/null ; \
		fi; \
		if [ $$fail -eq 1 ]; then \
			exit 1; \
		fi; \
	done
