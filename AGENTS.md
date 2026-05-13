# Release Commit Rules

This repository uses `semantic-release` on `main`.

- `fix:` -> patch release
- `feat:` -> minor release
- `feat!:` or `BREAKING CHANGE:` -> major release
- `chore:` -> no release

When changes should publish to npm, use `fix:` or `feat:` commit types instead of `chore:`.
