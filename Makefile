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
	-rm -f yarn.lock package-lock.json

build: ## Build distribution
	-rm -f yarn.lock package-lock.json
	-python setup.py bdist_wheel
	-yarn install
	-yarn run build

install: build ## Build distribution and install
	-pip install --upgrade -e .
	-jupyter serverextension enable --py enterprise_scheduler_extension --sys-prefix
	-jupyter labextension install


