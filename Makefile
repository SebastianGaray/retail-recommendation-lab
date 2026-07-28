.PHONY: install generate validate dev test-python test-web test-e2e lint typecheck build

install:
	uv sync --project pipeline --dev
	npm ci

generate:
	uv run --project pipeline generate-catalog

validate:
	uv run --project pipeline validate-catalog

dev:
	npm run dev

test-python:
	uv run --project pipeline pytest

test-web:
	npm test

test-e2e:
	npm run test:e2e

lint:
	uv run --project pipeline ruff check pipeline
	uv run --project pipeline ruff format --check pipeline
	npm run lint

typecheck:
	uv run --project pipeline pyright --project pipeline/pyrightconfig.json
	npm run typecheck

build:
	npm run build
