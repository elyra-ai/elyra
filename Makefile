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
.PHONY: install-external-extensions install watch test-server test-ui test-ui-debug test docs-dependencies docs docker-image

SHELL:=/bin/bash

VERSION:=0.0.1

TAG:=dev

IMAGE=elyra/elyra:$(TAG)

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
	$(call UNINSTALL_LAB_EXTENSION,@elyra/theme-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/code-snippet-extension-experimental)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/pipeline-editor-extension)
	$(call UNINSTALL_LAB_EXTENSION,@elyra/python-runner-extension)
	$(call UNINSTALL_LAB_EXTENSION,@jupyterlab/toc)
	pip uninstall -y jupyterlab-git
	pip uninstall -y elyra
	jupyter lab clean

clean: purge uninstall ## Make a clean source tree and uninstall extensions

test-dependencies:
	@pip install -q -r test_requirements.txt

lint-server: test-dependencies
	flake8 elyra

lint-ui:
	yarn run prettier
	yarn run eslint

lint: lint-ui lint-server ## Run linters

yarn-install:
	yarn

build-ui: yarn-install lint-ui ## Build packages
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && lerna run build

build-server: lint-server ## Build backend
	python setup.py bdist_wheel

install-server: ## Install backend
	pip install --upgrade dist/elyra-*-py3-none-any.whl

install-external-extensions:
	pip install --upgrade jupyterlab-git==0.20.0
	jupyter labextension install --no-build @jupyterlab/toc@4.0.0

install: build-ui build-server install-server install-external-extensions ## Build and install
	$(call LINK_LAB_EXTENSION,application)
	$(call LINK_LAB_EXTENSION,ui-components)
	$(call INSTALL_LAB_EXTENSION,theme)
	$(call INSTALL_LAB_EXTENSION,code-snippet)
	$(call INSTALL_LAB_EXTENSION,pipeline-editor)
	$(call INSTALL_LAB_EXTENSION,python-runner)
	jupyter lab build
	jupyter serverextension list
	jupyter labextension list

watch: ## Watch packages. For use alongside jupyter lab --watch
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && lerna run watch --parallel

test-server: lint-server ## Run unit tests
	pytest -v elyra

test-ui: lint-ui ## Run frontend tests
	npm test

test-ui-debug: lint-ui
	npm run test-debug

test: test-server test-ui ## Run all tests

docs-dependencies:
	@pip install -q -r docs/requirements.txt

docs: docs-dependencies ## Build docs
	make -C docs html

docker-image: ## Build docker image
	@mkdir -p build/docker
	cp etc/docker/Dockerfile build/docker/Dockerfile
	cp -r dist/*.whl build/docker/
	DOCKER_BUILDKIT=1 docker build -t $(IMAGE) build/docker/ --progress plain

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
