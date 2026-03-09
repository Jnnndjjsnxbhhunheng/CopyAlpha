.PHONY: dev build test lint lint-fix harvest forge consult install clean

install:
	npm install

dev:
	npx ts-node src/cli.ts

build:
	npx tsc

test:
	npx jest

lint:
	npx eslint src/ --ext .ts

lint-fix:
	npx eslint src/ --ext .ts --fix

harvest:
	npx ts-node src/cli.ts harvest $(ARGS)

forge:
	npx ts-node src/cli.ts forge $(ARGS)

consult:
	npx ts-node src/cli.ts consult $(ARGS)

clean:
	rm -rf dist/ coverage/
