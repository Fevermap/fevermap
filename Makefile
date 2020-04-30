# This Makefile makes it easier for anybody to understand the steps involved in
# testing, building and deploying this app.

# Load local variables if .env file exists
-include .env
export

# Default value for URLs if not set in .env
API_URL ?= "http://localhost:9000/api"
APP_URL ?= "http://localhost:6006"
PUSH_API_URL ?= "http://localhost:9001/push-api"

test:
	# Check syntax and code style in Python files and shell scripts
	# @TODO: Add JavaScript, HTML and CSS linters here as well
	# Ignore lines too long (E501) because in many cases code becomes less readable
	flake8 --ignore E501 $(shell find -name "*.py" -not -path "*/node_modules/*" | xargs)
	shellcheck --shell=bash $(shell grep -rnw . -e '^#!.*/bash' --exclude-dir=.git --exclude-dir=node_modules | sort -u | cut -d: -f1 | xargs)
	shellcheck --shell=sh $(shell grep -rnw . -e '^#!.*/sh' --exclude-dir=.git --exclude-dir=node_modules | sort -u | cut -d: -f1 | xargs)
	@echo "----------- Tests completed successfully -----------"

test-extra:
	gnitpick --target-repository https://gitlab.com/fevermap/fevermap.git
	shellcheck $(shell find -name "*.sh" -not -path "*/node_modules/*" | xargs)
	yamllint -d "{extends: default, rules: {line-length: {level: warning}}}" $(shell find -name "*.yaml" -or -name "*.yml" -not -path "*/node_modules/*" | xargs)
	@echo "----------- Extra tests completed successfully -----------"

test-api:
	# Test API submissions and responses
	# Intended only for local testing and expects http://localhost:9000 to be running.
	./api/test-api-submit.sh

test-api-stats:
	# Test read-only API requests
	# Intended only for local testing and expects http://localhost:9000 to be running.
	./api/test-api-location.sh

test-data-generate:
	# Run test data generator inside the container, where it automatically has
	# correct permissions to access the database directly (bypassing API).
	docker exec -it fevermap_api_1 /app/test-data-generator.py

update-master:
	# Ensure latest master branch is checked out. This command is run in the
	# staging and production environment.
	git pull origin master
	git checkout master
	@echo "----------- Update completed successfully -----------"

build-app:
	# Build app. Assumes NodeJS and dependencies are installed in the environment
	# where this runs. The end result is directory app/dist/, which has only
	# static files and is the PWA app itself that should be server to users.
	# This step is run in production (and staging).
	# NOTE! This step will use the API_URL environment variable.
	cd app &&	npm install && npm run build
	curl -iLsS "${APP_URL}/" | tee /tmp/app.log
	grep --quiet -F '</html>' /tmp/app.log
	@echo "----------- App build completed successfully -----------"

build-api:
	# Build container that runs the API
	# This step is run in production (and staging) but also works for development.
	cd api && docker build -t fevermap/api .
	@echo "----------- API build completed successfully -----------"

build-push-api:
    # Build container that runs the Push API
    # This step is run in production (and staging) but also works for development.
	cd push-api && docker build -t fevermap/push-api .
	@echo "----------- Push API build completed successfully ------"

run-api:
	# Ensures the API server is running as a Docker container.
	# This step is run in production (and staging).
	docker stop fevermap_api || true # Ignore result, don't care if it was running already or not
	docker rm fevermap_api || true # Ignore result, don't care if it was running already or not
	cd api && docker run -d --name fevermap_api --restart always -v "${PWD}/api:/app" \
		-e FEVERMAP_API_DATABASE_URI="${FEVERMAP_API_DATABASE_URI}" -e FLASK_ENV=production --expose 9000 fevermap/api
	sleep 5
	docker logs fevermap_api
	curl -iLsS "${API_URL}/v0/ping" | tee /tmp/ping-pong.log
	grep --quiet Pong /tmp/ping-pong.log
	@echo "----------- API run completed successfully -----------"

# This step could be run in production (and staging). For local development,
# just run `docker-composer up --build` instead.
run: build-app build-api build-push-api run-api
