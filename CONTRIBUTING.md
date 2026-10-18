# Contributing to Veloce ATS

Thank you for your interest in contributing to Veloce ATS. We hold our codebase to the highest standard of engineering rigor, performance, and aesthetic craftsmanship.

---

## Code Quality Standards

Before submitting any code, ensure you have run and passed all local verification gates:

```bash
# 1. Typechecking
npm run typecheck

# 2. Strict ESLint
npm run lint

# 3. Unit and parity tests
npm test

# 4. End-to-end endpoint verification
npx tsx scripts/verify-endpoints.ts

# 5. Production build
npm run build
```

Every PR must maintain:
- **0 TypeScript errors** (`strict: true`)
- **0 ESLint warnings or errors**
- **100% test pass rate** across all Vitest suites
- **Zero uncaught server exceptions**

---

## Local Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/<your-username>/veloce.git
   cd veloce
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Zero-Config Local SQLite Dev**:
   ```bash
   npm run dev:sqlite
   ```
4. **Make Changes**:
   - Write backend logic inside `src/lib/services/` with strict Zod validation inside `src/lib/validations/`.
   - Never write direct SQL queries inside UI components; keep domain logic strictly within service modules.
   - For UI components, adhere to the design system tokens in `tailwind.config.ts` and `src/app/globals.css`. Support both dark and light modes cleanly.
5. **Add Tests**:
   - Write unit tests in `tests/` using Vitest.
   - Ensure boundary conditions (such as missing fields, invalid roles, concurrency version mismatches) are covered.

---

## Pull Request Guidelines

1. Use descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).
2. Fill out the PR template completely, including:
   - Summary of changes
   - Architectural motivation
   - Verification output (paste terminal logs or screenshots)
   - Performance implications
