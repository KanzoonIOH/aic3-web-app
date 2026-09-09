# Web-app image build + push.
# Override any var: make build REGISTRY=ghcr.io/acme VITE_API_URL=https://api.example.com/api

REGISTRY    ?= 10.10.1.122/agent
IMAGE       ?= aic3-web-app
TAG         ?= latest
VITE_API_URL ?= https://platform-ai.ioh.co.id/aic3-api/api

IMG := $(REGISTRY)/$(IMAGE):$(TAG)
TARFILE := $(IMAGE)-$(TAG).tar.gz

.PHONY: help build save load push release

help: ## Show this help
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-8s %s\n", $$1, $$2}'

build: ## Build the image (VITE_API_URL inlined at build time)
	docker build $(NOCACHE) --build-arg VITE_API_URL=$(VITE_API_URL) -t $(IMG) .

rebuild: NOCACHE=--no-cache ## Build from scratch, ignoring layer cache
rebuild: build

save: ## Save the image to a .tar.gz file (to copy to the server)
	docker save $(IMG) | gzip > $(TARFILE)
	@echo "Wrote $(TARFILE) -- copy it to the server, then run 'make load' there"

load: ## Load the image from the .tar.gz file (run this ON the server)
	gunzip < $(TARFILE) | docker load

push: ## Push the image to the registry (run this ON the server)
	docker push $(IMG)

copy:
	rsync -avPR $(TARFILE) root@aiplatform2:/home/ubuntu/aic3/builds

release: build push ## Build then push
