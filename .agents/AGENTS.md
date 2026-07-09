# WorkQuora Workspace Rules

All AI agents working on this codebase must adhere to the following safety and architectural guidelines:

## Security and Safety

- **Never** delete production data.
- **Never** run database drop or flush commands.
- **Never** expose `.env` values or print them in responses or logs.
- **Never** print or leak API keys, JWT secrets, payment gateway credentials, or OAuth secrets.
- **Never** modify payment or checkout logic without explicit user review and approval.
- **Never** modify authentication or registration logic without first reviewing existing security flows.
- **Never** deploy code automatically to staging or production environments.

## Version Control

- **Never** push directly to the `main` branch.
- **Never** force-push (`git push -f`).
- **Never** commit code without creating a safe local git checkpoint first.

## Architecture and Dependencies

- **Never** rewrite working architecture without objective evidence of a performance bottleneck or bug.
- **Prefer** utilizing existing code and modules before writing new helper functions.
- **Prefer** native platform features (standard library, browser APIs, Mongoose hooks) before adding external dependencies.
- **Prefer** existing installed dependencies before installing new packages.
- **Make** the smallest possible production-ready change (terse working diffs).
- **Run** relevant test scripts after making any code modifications.
- **Highlight** security-impacting changes clearly in final walkthroughs.
