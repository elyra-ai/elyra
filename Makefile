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

docker-image: .image-docker ## Build elyra/jupyter_scheduler:dev docker image
.image-docker: etc/docker/* $(WHEEL_FILE)
	@make clean-docker-image bdist
	@mkdir -p build/docker
	cp etc/docker/* build/docker
	cp dist/enterprise_scheduler_extension* build/docker
	@(cd build/docker; docker build -t elyra/jupyter_scheduler:$(TAG) . )
	@touch .image-docker
	@-docker images elyra/jupyter_scheduler:$(TAG)

clean-docker-image: ## Remove elyra/jupyter_scheduler:dev docker image
	@rm -f .image-docker
	@-docker rmi -f elyra/jupyter_scheduler:$(TAG)

