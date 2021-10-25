#
# Copyright 2018-2021 Elyra Authors
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

.PHONY: help purge install uninstall clean test-dependencies lint-server lint-ui lint yarn-install eslint-ui eslint-check-ui prettier-ui prettier-check-ui flake lint-server-dependencies dev-link dev-unlink
.PHONY: build-ui build-server install-server watch install-extensions build-jupyterlab install-server-package check-install only-install-server
.PHONY: test-server test-ui test-integration test-integration-debug test docs-dependencies docs dist-ui release pytest
.PHONY: validate-runtime-images elyra-image publish-elyra-image kf-notebook-image
.PHONY: publish-kf-notebook-image container-images publish-container-images

SHELL:=/bin/bash

TAG:=3.2.2
ELYRA_IMAGE=elyra/elyra:$(TAG)
KF_NOTEBOOK_IMAGE=elyra/kf-notebook:$(TAG)

# Contains the set of commands required to be used by elyra
REQUIRED_RUNTIME_IMAGE_COMMANDS?="curl python3"
REMOVE_RUNTIME_IMAGE?=0  # Invoke `make REMOVE_RUNTIME_IMAGE=1 validate-runtime-images` to have images removed after validation
UPGRADE_STRATEGY?=only-if-needed

help:
# http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

purge:
	rm -rf build *.egg-info yarn-error.log
	rm -rf node_modules lib dist
	rm -rf $$(find packages -name node_modules -type d -maxdepth 2)
	rm -rf $$(find packages -name dist -type d)
	rm -rf $$(find packages -name lib -type d)
	rm -rf $$(find . -name __pycache__ -type d)
	rm -rf $$(find . -name tsconfig.tsbuildinfo)
	rm -rf $$(find . -name package-lock.json)
	rm -rf $$(find . -name .pytest_cache)
	rm -rf $(yarn cache dir)

# NOTE: We can't use "lerna run lab:uninstall" because we may have deleted node_modules.
uninstall:
	$(call UNLINK_LAB_EXTENSION,@elyra/services)
	$(call UNLINK_LAB_EXTENSION,@elyra/ui-components)
	$(call UNLINK_LAB_EXTENSION,@elyra/metadata-common)
	$(call UNLINK_LAB_EXTENSION,@elyra/script-editor)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/theme-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/code-snippet-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/metadata-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/pipeline-editor-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/python-editor-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/r-editor-extension)
	- jupyter labextension unlink @elyra/pipeline-services
	- jupyter labextension unlink @elyra/pipeline-editor
	pip uninstall -y jupyterlab-git
	pip uninstall -y jupyter-lsp
	- jupyter labextension uninstall @krassowski/jupyterlab-lsp
	pip uninstall -y jupyterlab-lsp
	pip uninstall -y python-lsp-server
	pip uninstall -y jupyter-resource-usage
	- jupyter labextension uninstall @jupyter-server/resource-usage
	pip uninstall -y elyra
	- jupyter lab clean

clean: purge uninstall ## Make a clean source tree and uninstall extensions

test-dependencies:
	python -m pip install --upgrade pip
	@pip install -q -r test_requirements.txt

lint-server: test-dependencies
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

lint: lint-ui prettier-ui lint-server ## Run linters

dev-link:
	yarn link @elyra/pipeline-services
	yarn link @elyra/pipeline-editor
	cd node_modules/@elyra/pipeline-editor && jupyter labextension link --no-build .
	cd node_modules/@elyra/pipeline-services && jupyter labextension link --no-build .

dev-unlink:
	yarn unlink @elyra/pipeline-services
	yarn unlink @elyra/pipeline-editor
	jupyter labextension uninstall @elyra/pipeline-services
	jupyter labextension uninstall @elyra/pipeline-editor
	yarn install --force

yarn-install:
	yarn install

build-ui: # Build packages
	yarn lerna run build --stream

build-server: # Build backend
	python setup.py bdist_wheel sdist

build: build-server build-ui

install-ui: yarn-install lint-ui build-ui install-extensions build-jupyterlab # Install packages

install-extensions:
	yarn lerna run lab:install --stream

build-jupyterlab:
	jupyter lab build

prepare-server:
	pip install --upgrade pip wheel

only-install-server: prepare-server build-server install-server-package

install-server: lint-server only-install-server ## Build and install backend only

install-server-package:
	pip install --upgrade --upgrade-strategy $(UPGRADE_STRATEGY) --use-deprecated=legacy-resolver "$(shell find dist -name "elyra-*-py3-none-any.whl")[all]"

install: install-server install-ui check-install ## Build and install

check-install:
	jupyter serverextension list
	jupyter server extension list
	jupyter labextension list

watch: ## Watch packages. For use alongside jupyter lab --watch
	yarn lerna run watch --parallel

pytest:
	pytest -v elyra

test-server: install-server test-dependencies pytest # Run unit tests

test-ui: lint-ui test-ui-unit test-integration # Run frontend tests

test-ui-unit: # Run frontend jest unit tests
	yarn test:unit

test-integration: # Run frontend cypress integration tests
	yarn test:integration

test-integration-debug: # Open cypress integration test debugger
	yarn test:integration:debug

test: test-server test-ui ## Run all tests (backend, frontend and cypress integration tests)

docs-dependencies:
	@pip install -q -r docs/requirements.txt

docs: docs-dependencies ## Build docs
	make -C docs clean html

dist-ui: yarn-install build-ui
	mkdir -p dist
	$(call PACKAGE_LAB_EXTENSION,theme)
	$(call PACKAGE_LAB_EXTENSION,code-snippet)
	$(call PACKAGE_LAB_EXTENSION,metadata)
	$(call PACKAGE_LAB_EXTENSION,pipeline-editor)
	$(call PACKAGE_LAB_EXTENSION,python-editor)
	$(call PACKAGE_LAB_EXTENSION,r-editor)

release: dist-ui build-server ## Build wheel file for release

elyra-image: # Build Elyra stand-alone container image
	@mkdir -p build/docker
	cp etc/docker/elyra/Dockerfile build/docker/Dockerfile
	cp etc/docker/elyra/start-elyra.sh build/docker/start-elyra.sh
	DOCKER_BUILDKIT=1 docker build -t docker.io/$(ELYRA_IMAGE) -t quay.io/$(ELYRA_IMAGE) build/docker/ --progress plain --build-arg TAG=$(TAG)

publish-elyra-image: elyra-image # Publish Elyra stand-alone container image
    # this is a privileged operation; a `docker login` might be required
	docker push docker.io/$(ELYRA_IMAGE)
	docker push quay.io/$(ELYRA_IMAGE)

kf-notebook-image: # Build elyra image for use with Kubeflow Notebook Server
	DOCKER_BUILDKIT=1 docker build -t docker.io/$(KF_NOTEBOOK_IMAGE) -t quay.io/$(KF_NOTEBOOK_IMAGE) \
	etc/docker/kubeflow/ --progress plain

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
	pip install jq ; \
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


define UNLINK_LAB_EXTENSION
	- jupyter labextension unlink --no-build $1
endef

define UNINSTALL_LAB_EXTENSION
	- jupyter labextension uninstall --no-build $1
endef

define PACKAGE_LAB_EXTENSION
	cd packages/$1 && yarn dist && mv *.tgz ../../dist
endef
