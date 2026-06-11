# Production Alpha Tests

These Playwright tests exercise the deployed MVP against a real production-like environment.
They intentionally use API requests only, so no browser binaries are required.

## Setup

Create `.env.production.local` in the repository root:

```env
PROD_BASE_URL=https://starinsight.vercel.app
PROD_ADMIN_TOKEN=replace-with-production-admin-token
# Optional
PROD_TEST_IP=198.51.100.88
PROD_TEST_BIRTH_DATE=1990-01-01
PROD_TEST_BIRTH_TIME=08:30
PROD_TEST_BIRTH_PLACE=北京
PROD_TEST_TIMEOUT_MS=90000
PROD_TEST_RETRIES=0
```

`PROD_ADMIN_TOKEN` is required because the suite covers the manual mark-paid flow.
Do not commit `.env.production.local`.

## Run

```bash
npm run test:prod
```

## Covered flow

- Create report returns `reportId`, `accessToken`, and tokenized `reportUrl`.
- Correct token can access the report; missing/wrong tokens are rejected by the report page.
- Free report export returns 403.
- Wrong admin token cannot mark paid.
- Correct admin token marks report paid.
- Paid report exports Markdown.
