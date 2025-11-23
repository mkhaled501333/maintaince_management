### AI Test Suite (JSONL) for Browser-based Runners

Each file in this folder contains newline-delimited JSON (JSONL). Each line is one atomic, executable test case. These are split by role/topic to make it easy to feed into a browser-driven AI test runner and to track progress.

Fields per test case object:
- id: Unique test case ID (matches TEST_STRATEGY.md)
- title: Short human-readable name
- role: One of ADMIN | SUPERVISOR | MAINTENANCE_TECH | MAINTENANCE_MANAGER | INVENTORY_MANAGER | SYSTEM
- priority: High | Medium | Low
- url: App route to begin the case (relative path)
- preconditions: Array of concise setup requirements
- steps: Ordered list of action strings the AI should perform in the browser
- expected: Ordered list of assertions the AI should verify
- tags: Array for grouping and filtering (e.g., ["users", "inventory", "reports"]) 
- status: pending | in_progress | passed | failed | blocked | skipped (default pending)

Execution notes:
- Drive the browser starting from the url.
- Perform steps in order; capture screenshots or console logs on failures.
- Mark status when done; attach error if failed.
- Prefer fixed selectors by label or role where possible.

Files:
- admin.jsonl — Admin area test cases (TC-ADMIN-001..013)
- supervisor.jsonl — Supervisor test cases (TC-SUP-001..008)
- maintenance_tech.jsonl — Technician test cases (TC-TECH-001..012)
- maintenance_manager.jsonl — Manager test cases (TC-MGR-001..010)
- inventory_manager.jsonl — Inventory manager test cases (TC-INV-001..012)
- workflows.jsonl — End-to-end flows (5.1, 5.2)
- errors.jsonl — Error handling and edge cases (TC-ERR-001..015)
 - auth.jsonl — Smoke login tests per role

Tip: Use one JSONL file per execution batch to simplify progress tracking.

Base URL configuration:
- The tests use relative `url` paths. Set the environment base in `docs/ai-tests/config.json`.
- Current baseUrl: `https://192.168.1.74/`
- Runners should resolve full URLs as `baseUrl + test.url`.

Credentials for roles:
- Provide role-based credentials in `docs/ai-tests/roles.json` with fields `username` and `password` per role.
- Current mapping uses maintenance_db users: ADMIN(a/a), SUPERVISOR(s/s), MAINTENANCE_TECH(m/m), MAINTENANCE_MANAGER(ma/m), INVENTORY_MANAGER(i/i).
- When a test precondition says "Logged in as <ROLE>" or "Use credentials for role <ROLE>", the runner should login using `roles.json`.


