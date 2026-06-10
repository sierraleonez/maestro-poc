# Maestro Test Suite Restructure Plan

## 1. Replace .env with JS Config

**Problem:** `.env` files require shell sourcing via `run.sh` and passing every var with `-e` flags.

**Solution:** Use Maestro's `runScript` + `output` object to load config directly in YAML flows.

### File: `maestro/config/env.js`

```js
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

output.env = {
  EMAIL: `maestro_${timestamp}@gmail.com`,
  LIVE_PASSWORD: 'Password123!',
  FIRST_NAME: 'Maestro',
  LAST_NAME: 'Agent',
  DATE_OF_BIRTH: '14/02/1990',
  PHONE_NUMBER: '1234567890',
  HOUSE_NUMBER: '123',
  STREET: 'Main Street',
  CITY: 'London',
  POSTAL_CODE: 'SW1A 1AA',
  COUNTRY: 'Vietnam',
  REGION: 'Valutrades Seychelles',
  REGION_ID: '3',
  CAPTCHA: '1245',
  PASSWORD: 'Password123!',
  ACCOUNT_NUMBER: '',
  DUPLICATE_EMAIL: 'lesley@yopmail.com',
};
```

### File: `maestro/config/env.negative.js`

Same structure but with negative-test-specific overrides (e.g. `COUNTRY: 'China'`, email prefix `maestro_neg_`).

### Usage in flows

Before (current):
```yaml
- inputText: ${EMAIL}
```

After:
```yaml
- runScript: ../../config/env.js    # loaded once at top of orchestrator
- inputText: ${output.env.EMAIL}
```

### Loader flow: `maestro/config/load.yaml`

```yaml
appId: vtglobal.appdev
---
- runScript: env.js
```

Each orchestrator (`create-live.yaml`, `deposit-thb.yaml`) starts with:
```yaml
- runFlow: ../../config/load.yaml
```

### Impact on existing flows

All `${VAR_NAME}` references in sub-flows become `${output.env.VAR_NAME}`. The `env:` blocks passing vars to sub-flows for data (not util params) are removed.

**Utils remain unchanged** — `DROPDOWN_ID`, `OPTION`, `INPUT_ID` are still passed via `env:` at the `runFlow` call site since they're per-invocation parameters, not global config.

---

## 2. TestId Files (Page Object Model)

**Problem:** TestIds are hardcoded strings scattered across YAML files. A rename requires updating many files.

**Solution:** One JS file per screen, following Maestro's POM pattern.

### Folder structure: `maestro/elements/`

```
maestro/elements/
├── selectLang.js
├── video.js
├── login.js
├── accountSelection.js
├── home.js
├── createAccount.js
├── setupAccount.js
├── documentVerification.js
├── personalInformation.js
├── experience.js
├── deposit.js
├── bottomsheet.js
└── common.js          # shared elements like btn_Continue
```

### Example: `maestro/elements/login.js`

```js
output.login = {
  inputEmail: 'input_email',
  inputPassword: 'input_password',
  btnLogin: 'login_btn_login',
  btnCreateLive: 'login_form_btn_createLive',
};
```

### Example: `maestro/elements/createAccount.js`

```js
output.createAccount = {
  inputEmail: 'createAccount_form_input_email',
  dropdownCountry: 'createAccount_form_dropdown_country',
  btnContinue: 'createAccount_form_btn_continue',
};
```

### Loader flow: `maestro/elements/load.yaml`

```yaml
appId: vtglobal.appdev
---
- runScript: selectLang.js
- runScript: video.js
- runScript: login.js
- runScript: accountSelection.js
- runScript: home.js
- runScript: createAccount.js
- runScript: setupAccount.js
- runScript: documentVerification.js
- runScript: personalInformation.js
- runScript: experience.js
- runScript: deposit.js
- runScript: bottomsheet.js
- runScript: common.js
```

### Usage in flows

Before:
```yaml
- tapOn:
    id: 'createAccount_form_input_email'
```

After:
```yaml
- tapOn:
    id: ${output.createAccount.inputEmail}
```

### Combined loader: `maestro/config/init.yaml`

Loads both env and elements in one call:
```yaml
appId: vtglobal.appdev
---
- runFlow: load.yaml
- runFlow: ../elements/load.yaml
```

Each orchestrator just needs:
```yaml
- runFlow: ../../config/init.yaml
```

---

## 3. Scripts Folder

**Problem:** JS scripts (`fetch-answer-list.js`, `upload-sumsub-docs.js`) live inside feature flow folders, making them hard to discover and reuse.

**Solution:** Move all runtime JS scripts to `maestro/scripts/`.

### File: `maestro/scripts/fetch-answer-list.js`
### File: `maestro/scripts/upload-sumsub-docs.js`

Flows that reference them update their path:

Before:
```yaml
- runScript:
    file: './upload-sumsub-docs.js'
```

After:
```yaml
- runScript:
    file: '../../scripts/upload-sumsub-docs.js'
```

---

## 4. Test Discovery & Tags (config.yaml)

**Problem:** Manually listing flows in orchestrator files doesn't scale and requires editing YAML to select tests.

**Solution:** Use Maestro's native `config.yaml` with `flows` glob patterns and `tags` for filtering.

### File: `maestro/config.yaml`

```yaml
appId: vtglobal.appdev
flows:
  - "suites/**"
```

### How it works

Each suite file is a self-contained flow that Maestro discovers automatically. Tags control which suites to run.

### File: `maestro/suites/create-live.yaml`

```yaml
appId: vtglobal.appdev
tags:
  - create-live
  - positive
  - regression
---
- runFlow: ../config/init.yaml
- runFlow: ../navigations/to-create-live.yaml
- runFlow: ../scenarios/create-live/positive/create-account/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/setup-account/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/document-verification/upload-and-continue.yaml
- runFlow: ../scenarios/create-live/positive/personal-information/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/experience/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/check-result/verify-success.yaml
```

### File: `maestro/suites/create-live-negative.yaml`

```yaml
appId: vtglobal.appdev
tags:
  - create-live
  - negative
  - regression
---
- runFlow: ../config/init.yaml
- runFlow: ../navigations/to-create-live.yaml
- runFlow: ../scenarios/create-live/negative/create-account/duplicate-email.yaml
```

### File: `maestro/suites/deposit.yaml`

```yaml
appId: vtglobal.appdev
tags:
  - deposit
  - positive
  - smoke
---
- runFlow: ../config/init.yaml
- runFlow: ../navigations/to-deposit.yaml
- runFlow: ../scenarios/deposit/positive/deposit-thb.yaml
```

### Running tests

```bash
# Run all discovered suites
maestro test maestro/

# Run only create-live tests
maestro test maestro/ --include-tags=create-live

# Run only positive tests
maestro test maestro/ --include-tags=positive

# Run smoke tests only
maestro test maestro/ --include-tags=smoke

# Run everything except negative tests
maestro test maestro/ --exclude-tags=negative

# Run full regression
maestro test maestro/ --include-tags=regression
```

### Tag conventions

| Tag | Purpose |
|-----|---------|
| `<feature>` | Feature name (create-live, deposit, login, etc.) |
| `positive` | Happy path scenarios |
| `negative` | Error/validation scenarios |
| `smoke` | Quick critical-path tests |
| `regression` | Full regression suite |

---

## 5. Updated run.sh

Since env is now loaded inside Maestro via JS, the shell script becomes minimal:

### File: `maestro/run.sh`

```bash
#!/bin/bash
set -euo pipefail

TAGS="${1:-}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="maestro/evidence/${TIMESTAMP}"
mkdir -p "$OUTPUT_DIR"

if [ -n "$TAGS" ]; then
  maestro test maestro/ --include-tags="$TAGS" --test-output-dir "$OUTPUT_DIR"
else
  maestro test maestro/ --test-output-dir "$OUTPUT_DIR"
fi
```

- No `.env` sourcing, no `-e` flags
- Run all: `./maestro/run.sh`
- Run by tag: `./maestro/run.sh create-live`
- Run smoke: `./maestro/run.sh smoke`
- Evidence goes to `maestro/evidence/` (gitignored)

Delete: `flows/create-live/.env`, `flows/create-live-negative/.env`, both per-feature `run.sh` scripts.

---

## 6. Migration Steps (order of execution)

1. Create `maestro/config/env.js` and `maestro/config/load.yaml`
2. Create all `maestro/elements/*.js` files and `maestro/elements/load.yaml`
3. Create `maestro/config/init.yaml` (combined loader)
4. Create `maestro/scripts/` and move JS scripts there
5. Create `maestro/suite.yaml` (root orchestrator)
6. Update all flow YAML files to:
   - Remove `env:` header blocks for global data
   - Replace `${VAR}` → `${output.env.VAR}` for config values
   - Replace hardcoded testId strings → `${output.<screen>.<element>}`
   - Update `runScript` paths to point to `../../scripts/`
7. Create new `maestro/run.sh`, delete old per-feature `.env` and `run.sh` files
8. Add `maestro/evidence/` and `maestro/**/.env` to `.gitignore`
9. Remove existing evidence dirs from git tracking

---

## 7. AI Agent Prompt Document

Create `maestro/AGENT_PROMPT.md` — a context document any AI agent can use to write/maintain E2E tests. Contents:

1. **Implemented screens** — list of screens with flow coverage status
2. **TestId reference** — where to find them (`maestro/elements/<screen>.js`), how they're loaded
3. **Environment variables** — where defined (`maestro/config/env.js`), how accessed (`output.env.*`)
4. **Utils** — available reusable sub-flows, their required `env:` params
5. **Test output** — evidence directory structure, how screenshots are named
6. **Local server** — how to connect to the helper server at `localhost:3000`
7. **How to add a new test** — step-by-step recipe
8. **Conventions** — naming, file organization, when to use POM vs inline ids

### Local Server (`~/work/m2/experiment/maestro-sql-server`)

An Express server running on port 3000 that provides:

| Endpoint | Method | Purpose | Params |
|----------|--------|---------|--------|
| `/applicant-id` | GET | Get SumSub applicant ID | `?email=...` |
| `/otp` | GET | Get OTP code | `?email=...` |
| `/answer-list` | GET | Get questionnaire answers (best score) | `?region=<region_id>` |
| `/sumsub/upload-id-doc` | POST | Upload single doc to SumSub | `{ email, docPath }` |
| `/sumsub/upload-all-docs` | POST | Upload selfie + ID front + back | `{ email, country }` |

**How flows use it:**
```js
// In a runScript JS file, use Maestro's http object:
const response = http.get('http://localhost:3000/otp?email=' + output.env.EMAIL);
const body = json(response.body);
output.otpCode = body.code;
```

**Starting the server:**
```bash
cd ~/work/m2/experiment/maestro-sql-server && node index.js
```

The AGENT_PROMPT should document that this server MUST be running before executing flows that need OTP retrieval, applicant lookup, or SumSub doc upload.

**Adding new data endpoints:** When a test needs data from the database that no existing endpoint provides, add a new route to the local server (`maestro-sql-server/routes.js` + `handlers.js`). The flow should never connect to the DB directly — always go through an HTTP endpoint.

---

## Final Directory Structure

```
maestro/
├── config.yaml             # Maestro workspace config (flows discovery + global tags)
├── run.sh                  # Shell runner
├── config/                 # Configuration & initialization
│   ├── env.js
│   ├── env.negative.js
│   ├── load.yaml
│   └── init.yaml
│
├── elements/               # Page Object Model (testIds per screen)
│   ├── selectLang.js
│   ├── video.js
│   ├── login.js
│   ├── accountSelection.js
│   ├── home.js
│   ├── createAccount.js
│   ├── setupAccount.js
│   ├── documentVerification.js
│   ├── personalInformation.js
│   ├── experience.js
│   ├── deposit.js
│   ├── bottomsheet.js
│   ├── common.js
│   └── load.yaml
│
├── scripts/                # Runtime JS (API calls, data transforms)
│   ├── fetch-answer-list.js
│   └── upload-sumsub-docs.js
│
├── utils/                  # Reusable sub-flows (atomic UI actions)
│   ├── dropdown/
│   │   ├── fill-dropdown.yaml
│   │   └── fill-dropdown-without-search.yaml
│   ├── text-input/
│   │   └── clear.yaml
│   ├── handle-home-popup.yaml
│   └── wait-home-loaded.yaml
│
├── navigations/            # How to reach each feature's starting screen
│   ├── to-create-live.yaml
│   ├── to-create-demo.yaml
│   ├── to-login.yaml
│   ├── to-deposit.yaml
│   ├── to-withdraw.yaml
│   ├── to-transfer.yaml
│   ├── to-market.yaml
│   └── to-news.yaml
│
├── scenarios/              # Test logic — assumes already on correct screen
│   ├── create-live/
│   │   ├── positive/
│   │   │   ├── create-account/
│   │   │   │   └── fill-and-submit.yaml
│   │   │   ├── setup-account/
│   │   │   │   └── fill-and-submit.yaml
│   │   │   ├── document-verification/
│   │   │   │   └── upload-and-continue.yaml
│   │   │   ├── personal-information/
│   │   │   │   └── fill-and-submit.yaml
│   │   │   ├── experience/
│   │   │   │   └── fill-and-submit.yaml
│   │   │   └── check-result/
│   │   │       └── verify-success.yaml
│   │   └── negative/
│   │       ├── create-account/
│   │       │   ├── duplicate-email.yaml
│   │       │   └── restricted-country-indonesia.yaml
│   │       ├── setup-account/
│   │       │   ├── invalid-password-too-short.yaml
│   │       │   └── invalid-password-prohibited-symbols.yaml
│   │       └── personal-information/
│   │           ├── underage-dob.yaml
│   │           └── non-numeric-phone.yaml
│   ├── create-demo/
│   │   ├── positive/
│   │   └── negative/
│   ├── login/
│   │   ├── positive/
│   │   └── negative/
│   ├── deposit
│   │   ├── positive/
│   │   └── negative/
│   ├── withdraw/
│   │   ├── positive/
│   │   └── negative/
│   ├── transfer/
│   │   ├── positive/
│   │   └── negative/
│   ├── market/
│   │   ├── positive/
│   │   └── negative/
│   └── news/
│       ├── positive/
│       └── negative/
│
├── suites/                 # Orchestrators — compose navigation + scenarios
│   ├── create-live.yaml
│   ├── create-live-negative.yaml
│   ├── deposit.yaml
│   ├── full-regression.yaml
│   └── smoke.yaml
│
├── evidence/               # Test output (gitignored)
│   └── .gitkeep
├── AGENT_PROMPT.md
└── RESTRUCTURE_PLAN.md
```

### Folder Responsibilities

| Folder | Single Responsibility |
|--------|----------------------|
| `config/` | What data to use (env vars, initialization) |
| `elements/` | Where to find UI elements (testId mapping) |
| `scripts/` | Server-side logic (HTTP calls, data transforms) |
| `utils/` | How to interact with reusable components (dropdown, text-input) |
| `navigations/` | How to get to a screen (app state transitions) |
| `scenarios/` | What to test on a screen (assertions, form filling) |
| `suites/` | What to run together (orchestration, ordering) |

### Example Suite: `suites/create-live.yaml`

```yaml
appId: vtglobal.appdev
---
- runFlow: ../config/init.yaml
- runFlow: ../navigations/to-create-live.yaml
- runFlow: ../scenarios/create-live/positive/create-account/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/setup-account/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/document-verification/upload-and-continue.yaml
- runFlow: ../scenarios/create-live/positive/personal-information/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/experience/fill-and-submit.yaml
- runFlow: ../scenarios/create-live/positive/check-result/verify-success.yaml
```

### Example Suite: `suites/smoke.yaml`

```yaml
appId: vtglobal.appdev
---
- runFlow: ../config/init.yaml
- runFlow: ../navigations/to-login.yaml
- runFlow: ../scenarios/login/positive/login-happy-path.yaml
- runFlow: ../navigations/to-deposit.yaml
- runFlow: ../scenarios/deposit/positive/deposit-thb.yaml
```
