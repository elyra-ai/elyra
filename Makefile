#
# Copyright 2018-2020 IBM Corporation
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

.PHONY: help purge uninstall clean test-dependencies lint-server lint-ui lint yarn-install build-ui build-server install-server
.PHONY: install-external-extensions install watch test-server test-ui test-ui-debug test docs-dependencies docs dist-ui release
.PHONY: docker-image, validate-runtime-images

SHELL:=/bin/bash

GIT_VERSION:=0.22.3
TOC_VERSION:=4.0.0

TAG:=dev
IMAGE=elyra/elyra:$(TAG)

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
	rm -rf $$(find . -name *.tgz)
	rm -rf $$(find . -name tsconfig.tsbuildinfo)
	rm -rf $$(find . -name *.lock)
	rm -rf $$(find . -name package-lock.json)
	rm -rf $$(find . -name .pytest_cache)
	rm -rf $(yarn cache dir)

uninstall:
	$(call UNLINK_LAB_EXTENSION,@elyra/application)
	$(call UNLINK_LAB_EXTENSION,@elyra/ui-components)
	$(call UNLINK_LAB_EXTENSION,@elyra/metadata-common)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/theme-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/code-snippet-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/metadata-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/pipeline-editor-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/python-editor-extension)
	$(call UNINSTALL_LAB_EXTENSION,@jupyterlab/toc)
	pip uninstall -y jupyterlab-git
	pip uninstall -y elyra
	- jupyter lab clean

clean: purge uninstall ## Make a clean source tree and uninstall extensions

test-dependencies:
	@pip install -q -r test_requirements.txt

lint-server: test-dependencies
#	flake8 elyra

lint-ui:
	yarn run prettier
	yarn run eslint

lint: lint-ui lint-server ## Run linters

yarn-install:
	yarn

build-ui: yarn-install lint-ui ## Build packages
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && lerna run build

build-server: lint-server ## Build backend
	python setup.py bdist_wheel sdist

build: build-server build-ui

install-server: build-server ## Install backend
	pip install --upgrade --upgrade-strategy $(UPGRADE_STRATEGY) dist/elyra-*-py3-none-any.whl

install-ui: build-ui
	$(call LINK_LAB_EXTENSION,application)
	$(call LINK_LAB_EXTENSION,ui-components)
	$(call LINK_LAB_EXTENSION,metadata-common)
	$(call INSTALL_LAB_EXTENSION,theme)
	$(call INSTALL_LAB_EXTENSION,code-snippet)
	$(call INSTALL_LAB_EXTENSION,metadata)
	$(call INSTALL_LAB_EXTENSION,pipeline-editor)
	$(call INSTALL_LAB_EXTENSION,python-editor)

install-external-extensions:
#	pip install --upgrade jupyterlab-git==$(GIT_VERSION)

install: install-server install-ui install-external-extensions ## Build and install
	jupyter lab build
	jupyter serverextension list
	jupyter labextension list

watch: ## Watch packages. For use alongside jupyter lab --watch
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && lerna run watch --parallel

test-server: install-server ## Run unit tests
	pytest -v elyra

test-ui: lint-ui test-ui-unit test-ui-integration ## Run frontend tests

test-ui-integration: ## Run frontend cypress integration tests
	npm run test:integration

test-ui-unit: ## Run frontend jest unit tests
	npm run test:unit

test-ui-debug: ## Open cypress integration test debugger
	npm run test:integration:debug

test: test-server test-ui ## Run all tests

docs-dependencies:
	@pip install -q -r docs/requirements.txt

docs: docs-dependencies ## Build docs
	make -C docs html

dist-ui: build-ui
	mkdir -p dist
	$(call PACKAGE_LAB_EXTENSION,theme)
	$(call PACKAGE_LAB_EXTENSION,code-snippet)
	$(call PACKAGE_LAB_EXTENSION,metadata)
	$(call PACKAGE_LAB_EXTENSION,pipeline-editor)
	$(call PACKAGE_LAB_EXTENSION,python-editor)
#	cd dist && curl -o jupyterlab-git-$(GIT_VERSION).tgz $$(npm view @jupyterlab/git@$(GIT_VERSION) dist.tarball) && cd -

release: dist-ui build-server ## Build wheel file for release

docker-image: ## Build docker image
	@mkdir -p build/docker
	cp etc/docker/elyra/Dockerfile build/docker/Dockerfile
	cp etc/docker/elyra/start-elyra.sh build/docker/start-elyra.sh
	DOCKER_BUILDKIT=1 docker build -t $(IMAGE) build/docker/ --progress plain

validate-runtime-images: ## Validates delivered runtime-images meet minimum criteria
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

define LINK_LAB_EXTENSION
	cd packages/$1 && jupyter labextension link --no-build .
endef

define UNINSTALL_LAB_EXTENSION
	- jupyter labextension uninstall --no-build $1
endef

define INSTALL_LAB_EXTENSION
	cd packages/$1 && jupyter labextension install --no-build .
endef

define PACKAGE_LAB_EXTENSION
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && cd packages/$1 && npm run dist && mv *.tgz ../../dist
endef
