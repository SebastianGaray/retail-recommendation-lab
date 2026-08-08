.PHONY: install generate generate-events pipeline validate validate-artifacts dev test-python test-pipeline test-web test-e2e coverage audit lint typecheck build

install:
	uv sync --project pipeline --dev
	npm ci

generate:
	uv run --project pipeline generate-catalog

generate-events:
	uv run --project pipeline generate-events

pipeline: generate
	uv run --project pipeline run-pipeline

validate:
	uv run --project pipeline validate-catalog

validate-artifacts:
	uv run --project pipeline validate-artifacts

dev:
	npm run dev

test-python:
	uv run --project pipeline pytest

test-pipeline:
	uv run --project pipeline pytest pipeline/tests

test-web:
	npm test

test-e2e:
	npm run test:e2e

coverage:
	uv run --project pipeline pytest --cov=retail_recommendation_lab --cov-config=pipeline/pyproject.toml --cov-report=term-missing --cov-report=xml --cov-fail-under=70
	npm run test:coverage --workspace apps/web

audit:
	uv run --project pipeline pip-audit
	npm audit --audit-level=high

lint:
	uv run --project pipeline ruff check pipeline
	uv run --project pipeline ruff format --check pipeline
	npm run lint

typecheck:
	uv run --project pipeline pyright --project pipeline/pyrightconfig.json
	npm run typecheck

build:
	npm run build
