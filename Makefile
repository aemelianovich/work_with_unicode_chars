install:
	npm install

build:
	rm -rf dist && \
	npm run build
run:
	node --es-module-specifier-resolution=node ./dist/index.js

run-scenario1:
	node --es-module-specifier-resolution=node ./example/scenario_1.js

test:
	npm test

test-watch:
	npm test -- --watch

test-coverage:
	npm test -- --coverage --coverageProvider=v8

test-index:
	npm test -- __tests__/index.test.js	

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix	

publish:
	npm publish --dry-run
.PHONY: test