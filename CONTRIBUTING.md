# Contributing to SEEMADRISHTI AI

Thank you for contributing to **SEEMADRISHTI AI**, the real-time tactical surveillance and perimeter security command matrix developed for the Smart India Hackathon.

---

## 1. Code Standards & Architecture Guidelines

- **TypeScript**: Strict typechecking is enforced. Ensure `npm run lint` passes without any compilation errors.
- **Python CV Modules**: Must adhere to PEP 8. Use typing annotations (`typing.Dict`, `typing.List`, `typing.Optional`).
- **Tests First**: Any new feature or bugfix should include corresponding test suites in `tests/` or `cv_service/tests/`.

---

## 2. Commit Message Conventions

We adhere to the Conventional Commits specification:
- `feat(...)`: A new user-facing or tactical capability
- `fix(...)`: A bug fix or pipeline stability correction
- `test(...)`: Adding or updating test suites
- `docs(...)`: Documentation updates or architecture specifications
- `refactor(...)`: Code adjustments that neither fix a bug nor add a feature
- `chore(...)`: Dependency updates or build tooling changes

---

## 3. Running Verification Suites

Before opening a pull request, run all automated verification suites:

```bash
# 1. Run all backend & security suites
npm run test:backend

# 2. Run Python CV unit tests
python cv_service/tests/test_plate_validation.py
python cv_service/tests/test_loitering_engine.py
```
