.PHONY: help clean sdist release clean-docker

SHELL:=/bin/bash

VERSION:=0.0.1

WHEEL_FILE:=dist/enterprise_scheduler_extension-$(VERSION)-py2.py3-none-any.whl
WHEEL_FILES:=$(shell find . -type f ! -path "./build/*" ! -path "./etc/*" ! -path "./docs/*" ! -path "./.git/*" ! -path "./.idea/*" ! -path "./dist/*" ! -path "./.image-docker" )

TAG:=dev

help:
# http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean: ## Make a clean source tree
	-rm -rf dist
	-rm -rf build
	-rm -rf *.egg-info
	-find enterprise_scheduler_extension -name __pycache__ -exec rm -fr {} \;
	-find enterprise_scheduler_extension -name '*.pyc' -exec rm -fr {} \;

bdist:
	make $(WHEEL_FILE)

$(WHEEL_FILE): $(WHEEL_FILES)
	@echo $(WHEEL_FILES)
	python setup.py bdist_wheel $(POST_SDIST) \
		&& rm -rf *.egg-info

sdist:
	python setup.py sdist $(POST_SDIST) \
		&& rm -rf *.egg-info

dist: bdist sdist ## Make binary and source distribution to dist folder

release: POST_SDIST=upload
release: bdist sdist ## Make a wheel + source release on PyPI

docker-image: .image-docker ## Build elyra/nb2kg_scheduler:dev docker image
.image-docker: etc/docker/* $(WHEEL_FILE)  
	@make clean-docker-image bdist
	@mkdir -p build/docker
	cp etc/docker/* build/docker
	cp dist/enterprise_scheduler_extension* build/docker
	@(cd build/docker; docker build -t elyra/nb2kg_scheduler:$(TAG) . )
	@touch .image-docker
	@-docker images elyra/nb2kg_scheduler:$(TAG)

clean-docker-image: ## Remove elyra/nb2kg_scheduler:dev docker image
	@rm -f .image-docker
	@-docker rmi -f elyra/nb2kg_scheduler:$(TAG)

