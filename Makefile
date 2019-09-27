#
# Copyright 2018-2019 IBM Corporation
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

.PHONY: help clean build install clean-docker

SHELL:=/bin/bash

VERSION:=0.0.1

TAG:=dev

help:
# http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean: ## Make a clean source tree
	-rm -rf build
	-rm -rf *.egg-info
	-rm -rf yarn.lock
	-rm -rf yarn-error.log
	-rm -rf $$(find . -name dist)
	-rm -rf $$(find . -name lib)
	-rm -rf $$(find . -name node_modules)
	-rm -rf $$(find . -name tsconfig.tsbuildinfo)
	-rm -rf $$(find . -name *.lock)
	-rm -rf $$(find . -name package-lock.json)

build: ## Build distribution
	-rm -f yarn.lock package-lock.json
	-python setup.py bdist_wheel
	-yarn
	-export PATH=$$(pwd)/node_modules/.bin:$PATH
	-lerna run build

install: build ## Build distribution and install
	-pip install --upgrade dist/ai_workspace-*-py3-none-any.whl
	-pip install --upgrade jupyterlab-git
	-jupyter serverextension enable --py jupyterlab_git
	-$(call INSTALL_LAB_EXTENSION,notebook-scheduler)
	-$(call INSTALL_LAB_EXTENSION,python-runner)
	-$(call INSTALL_LAB_EXTENSION,pipeline-editor)
	-jupyter labextension install @jupyterlab/git --no-build --debug
	-jupyter lab build

define INSTALL_LAB_EXTENSION
	-cd packages/$1 && jupyter labextension link --no-build --debug .
endef
