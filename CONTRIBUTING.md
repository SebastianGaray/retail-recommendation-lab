# Contributing

Install Python 3.12, Java 17, `uv`, and Node.js 22 or later. Run `make install` before development.
Source code, identifiers, comments, commit messages, and technical documentation must be written in
English. Spanish is reserved for translated visitor-facing content.

Before opening a pull request, regenerate and validate the artifacts, then run `make lint`,
`make typecheck`, `make coverage`, `make audit`, `make build`, and `make test-e2e`. Never commit raw
events, credentials, local environments, dependency directories, or generated caches.
