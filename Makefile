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

.PHONY: help clean yarn-install test-dependencies lint lerna-build npm-packages bdist install test install-backend docker-image

SHELL:=/bin/bash

VERSION:=0.0.1

TAG:=dev

IMAGE=elyra/elyra:$(TAG)

help:
# http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean: ## Make a clean source tree
	rm -rf build *.egg-info yarn-error.log
	rm -rf $$(find . -name dist)
	rm -rf $$(find . -name *.tgz)
	rm -rf $$(find . -name lib)
	rm -rf $$(find . -name node_modules)
	rm -rf $$(find . -name tsconfig.tsbuildinfo)
	rm -rf $$(find . -name *.lock)
	rm -rf $$(find . -name package-lock.json)
	rm -rf $$(find . -name .pytest_cache)

# Prepares Elyra for build/packaging/installation
yarn-install:
	rm -f yarn.lock package-lock.json
	yarn cache clean
	yarn

test-dependencies: yarn-install
	@pip install -q -r test_requirements.txt

lint: test-dependencies ## Run linters
	flake8 elyra
	yarn run prettier
	yarn run eslint

lerna-build: lint
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && lerna run build

npm-packages: lerna-build
	mkdir -p dist
	$(call PACKAGE_LAB_EXTENSION,application)
	$(call PACKAGE_LAB_EXTENSION,notebook-scheduler)
	$(call PACKAGE_LAB_EXTENSION,pipeline-editor)
	$(call PACKAGE_LAB_EXTENSION,python-runner)
	cd dist && curl -O $$(npm view @jupyterlab/git@0.9.0 dist.tarball --userconfig=./npm_config) && cd -
	cd dist && curl -O $$(npm view @jupyterlab/toc@2.0.0 dist.tarball --userconfig=./npm_config) && cd -

bdist: npm-packages
	python setup.py bdist_wheel

install: bdist ## Build distribution and install
	pip install --upgrade dist/elyra-*-py3-none-any.whl
	$(call UNLINK_LAB_EXTENSION,application)
	$(call UNINSTALL_LAB_EXTENSION,notebook-scheduler-extension)
	$(call UNINSTALL_LAB_EXTENSION,pipeline-editor-extension)
	$(call UNINSTALL_LAB_EXTENSION,python-runner-extension)
	jupyter lab clean
	$(call LINK_LAB_EXTENSION,application)
	$(call INSTALL_LAB_EXTENSION,notebook-scheduler)
	$(call INSTALL_LAB_EXTENSION,pipeline-editor)
	$(call INSTALL_LAB_EXTENSION,python-runner)
	jupyter lab build
	jupyter serverextension list
	jupyter labextension list

test: lint ## Run unit tests
	pytest -v elyra

install-backend: ## Build and install backend
	python setup.py bdist_wheel --dev
	pip install --upgrade dist/elyra-*-py3-none-any.whl

docker-image: ## bdist ## Build docker image
	@mkdir -p build/docker
	cp etc/docker/Dockerfile build/docker/Dockerfile
	cp -r dist/*.whl build/docker/
	DOCKER_BUILDKIT=1 docker build -t $(IMAGE) build/docker/ --progress plain

define UNLINK_LAB_EXTENSION
	- jupyter labextension unlink --no-build @elyra/$1
endef

define LINK_LAB_EXTENSION
	cd packages/$1 && jupyter labextension link --no-build .
endef

define UNINSTALL_LAB_EXTENSION
	- jupyter labextension uninstall --no-build @elyra/$1
endef

define INSTALL_LAB_EXTENSION
	jupyter labextension install --no-build dist/*$1*
endef

define PACKAGE_LAB_EXTENSION
	export PATH=$$(pwd)/node_modules/.bin:$$PATH && cd packages/$1 && npm run dist && mv *.tgz ../../dist
endef
