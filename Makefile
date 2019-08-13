.PHONY: help clean build install clean-docker

SHELL:=/bin/bash

VERSION:=0.0.1

TAG:=dev

help:
# http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean: ## Make a clean source tree
	-rm -rf dist
	-rm -rf build
	-rm -rf lib
	-rm -rf *.egg-info
	-rm -rf node_modules
	-rm -rf yarn.lock
	-$(call CLEAN_LAB_EXTENSION,enterprise_scheduler_extension)
	-$(call CLEAN_LAB_EXTENSION,python-runner)
	-$(call CLEAN_LAB_EXTENSION,pipeline-editor)

build: ## Build distribution
	-rm -f yarn.lock package-lock.json
	-python setup.py bdist_wheel
#	-$(call BUILD_LAB_EXTENSION,enterprise_scheduler_extension)
	-$(call BUILD_LAB_EXTENSION,python-runner)
	-$(call BUILD_LAB_EXTENSION,pipeline-editor)

install: build ## Build distribution and install
	-pip install --upgrade -e .
	-jupyter serverextension enable --py ai_workspace --sys-prefix
#	-$(call INSTALL_LAB_EXTENSION,enterprise_scheduler_extension)
	-$(call INSTALL_LAB_EXTENSION,python-runner)
	-$(call INSTALL_LAB_EXTENSION,pipeline-editor)

define CLEAN_LAB_EXTENSION
	-rm -rf packages/$1/lib
	-rm -rf packages/$1/node_modules
	-rm -rf packages/$1/package-lock.json
	-rm -rf packages/$1/yarn.lock
	-rm -rf packages/$1/tsconfig.tsbuildinfo
endef

define BUILD_LAB_EXTENSION
	-cd packages/$1 && jlpm install
endef

define INSTALL_LAB_EXTENSION
	-cd packages/$1 && jupyter labextension link --debug .
endef
