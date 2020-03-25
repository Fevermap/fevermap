#!/bin/bash

# This helper script is only run in development. I production we just ship the
# static dist/ produced by the build. Therevore the local developemnt environment
# and API_URL are hard-coded in this script.
export API_URL="http://localhost:9000"

devserverJobId=NULL
webpackJobId=NULL

run_webpack () {
	node node_modules/webpack-cli/bin/cli.js -w --mode development --env.NODE_ENV=development --env.API_URL=$API_URL &
	webpackJobId=$!
}

run_dev_server () {
	node node_modules/es-dev-server/dist/cli.js &
	devserverJobId=$!
	trap "kill -9 $devserverJobId" EXIT
}

listen_for_reset_inputs () {
	while :
	do
		if [ $webpackJobId != NULL ] && [ $devserverJobId != NULL ]
		then
			echo -en "\rPress [R] to restart webpack. Press [D] to restart dev server."
		fi

		read -t 1 -n 1 key
		if [[ $key = r ]]
		then
			echo -e "\nRESTARTING WEBPACK\n"
			kill -9 $webpackJobId
			run_webpack
		fi

		if [[ $key = d ]]
		then
			echo -e "\nRESTARTING DEV SERVER\n"
			kill -9 $devserverJobId
			run_dev_server
		fi
	done

}

run_dev_server
run_webpack
listen_for_reset_inputs
