.PHONY: install test check build
install:
	pnpm install --frozen-lockfile
test:
	pnpm test
check:
	pnpm quality:full
build:
	pnpm build
