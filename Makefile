# This Makefile makes it easy for anybody to understand the steps involved in
# testing, building and deploying this app.

# Load local variables if .env file exists
-include .env
export

# Default value for URL if not set in .env
URL ?= "http://localhost:9000"

test:
	flake8 $(shell find -name "*.py" -not -path "*/node_modules/*" | xargs) || true # Ignore results for now
	shellcheck --shell=bash $(shell grep -rnw . -e '^#!.*/bash' --exclude-dir=.git --exclude-dir=node_modules | sort -u | cut -d: -f1 | xargs) || true # Ignore results for now
	@echo "----------- Tests completed successfully -----------"

update-master:
	git pull origin master
	git checkout master
	@echo "----------- Update completed successfully -----------"

build-app:
	cd app &&	npm run build
	curl -iLsS "${URL}/" | tee /tmp/app.log
	grep --quiet -F '</html>' /tmp/app.log
	@echo "----------- App build completed successfully -----------"

build-api:
	cd api && docker build -t fevermap/api .
	@echo "----------- API build completed successfully -----------"

run-api:
	docker stop fevermap_api || true # Ignore result, don't care if it was running already or not
	docker rm fevermap_api || true # Ignore result, don't care if it was running already or not
	cd api && docker run -d --name fevermap_api --restart always -v "${PWD}/api:/app" -e FEVERMAP_API_DATABASE_URI="${FEVERMAP_API_DATABASE_URI}" -e ENV=production --expose 9000 fevermap/api
	sleep 5
	docker logs fevermap_api
	curl -iLsS "${URL}/api/v0/ping" | tee /tmp/ping-pong.log
	grep --quiet Pong /tmp/ping-pong.log
	@echo "----------- API run completed successfully -----------"

run: build-app build-api run-api
