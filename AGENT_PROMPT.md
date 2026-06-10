# Maestro E2E Test Suite — Agent Prompt

You are maintaining E2E tests for the Valutrades mobile trading app (React Native) using the Maestro testing framework.

## Architecture Overview

```
./                          # Repo root (maestro-m2)
├── config.yaml             # Workspace config (flows discovery via glob)
├── run.sh                  # Run tests by tag: ./run.sh <tag>
├── config/                 # Env vars & initialization
├── elements/               # Page Object Model (testIds per screen)
├── scripts/                # Runtime JS (HTTP calls to local server)
├── utils/                  # Reusable sub-flows (dropdown, text-input)
├── navigations/            # How to reach each feature's starting screen
├── scenarios/              # Test logic (assumes already on correct screen)
├── suites/                 # Orchestrators (init + navigate + scenarios)
└── evidence/               # Test output (gitignored)
```

## Folder Responsibilities

| Folder | Does | Does NOT |
|--------|------|----------|
| `config/` | Load env vars, initialize elements | Contain test logic |
| `elements/` | Map testId strings to JS variables | Contain flow commands |
| `scripts/` | Make HTTP calls, transform data | Interact with UI |
| `utils/` | Reusable UI actions (fill dropdown, clear input) | Navigate between screens |
| `navigations/` | Get app to a feature's starting screen | Test anything |
| `scenarios/` | Test logic, assertions, form filling | Navigate to the screen |
| `suites/` | Compose init + navigation + scenarios | Contain inline test steps |

## Implemented Screens

| Screen | Elements File | Positive Scenario | Negative Scenario |
|--------|--------------|-------------------|-------------------|
| Language Selection | `elements/selectLang.js` | Used in navigations | — |
| Video Onboarding | `elements/video.js` | Used in navigations | — |
| Login | `elements/login.js` | Used in navigations | — |
| Account Selection | `elements/accountSelection.js` | Used in navigations | — |
| Home | `elements/home.js` | Used in navigations | — |
| Create Account | `elements/createAccount.js` | ✅ | ✅ (duplicate-email, restricted-country) |
| Setup Account | `elements/setupAccount.js` | ✅ | ✅ (password-too-short, prohibited-symbols) |
| Document Verification | `elements/documentVerification.js` | ✅ | — |
| Personal Information | `elements/personalInformation.js` | ✅ | ✅ (underage-dob, non-numeric-phone) |
| Experience | `elements/experience.js` | ✅ | — |
| Deposit | `elements/deposit.js` | (in progress) | — |
| Bottomsheet | `elements/bottomsheet.js` | Used in utils | — |

## TestId Reference

TestIds are stored in `elements/<screen>.js` and loaded via `elements/load.yaml`.

```js
// elements/createAccount.js
output.createAccount = {
  inputEmail: 'createAccount_form_input_email',
  dropdownCountry: 'createAccount_form_dropdown_country',
  btnContinue: 'createAccount_form_btn_continue',
};
```

Usage in YAML:
```yaml
- tapOn:
    id: ${output.createAccount.inputEmail}
```

**When the app adds a new testId**, add it to the appropriate `elements/<screen>.js` file.

## Environment Variables

Defined in `config/env.js`, accessed as `output.env.<KEY>`:

```yaml
- inputText: ${output.env.EMAIL}
- inputText: ${output.env.LIVE_PASSWORD}
```

Available keys: `EMAIL`, `LIVE_PASSWORD`, `FIRST_NAME`, `LAST_NAME`, `DATE_OF_BIRTH`, `PHONE_NUMBER`, `HOUSE_NUMBER`, `STREET`, `CITY`, `POSTAL_CODE`, `COUNTRY`, `REGION`, `REGION_ID`, `CAPTCHA`, `PASSWORD`, `ACCOUNT_NUMBER`, `DUPLICATE_EMAIL`.

## Utils — Reusable Sub-flows

### Fill Dropdown (with search)
```yaml
- runFlow:
    file: <relative-path>/utils/dropdown/fill-dropdown.yaml
    env:
      DROPDOWN_ID: ${output.createAccount.dropdownCountry}
      OPTION: ${output.env.COUNTRY}
```

### Fill Dropdown (without search)
```yaml
- runFlow:
    file: <relative-path>/utils/dropdown/fill-dropdown-without-search.yaml
    env:
      DROPDOWN_ID: 'experience_form_dropdown_123'
      OPTION: 'dropdown_item_abc'
```

### Clear Text Input
```yaml
- runFlow:
    file: <relative-path>/utils/text-input/clear.yaml
    env:
      INPUT_ID: ${output.createAccount.inputEmail}
```

### Handle Home Popups
```yaml
- runFlow: <relative-path>/utils/handle-home-popup.yaml
```

### Wait Home Loaded
```yaml
- runFlow: <relative-path>/utils/wait-home-loaded.yaml
```

## Local Server (http://localhost:3000)

A helper Express server that provides data access. **Must be running before tests.**

Start: `cd ~/work/m2/experiment/maestro-sql-server && node index.js`

### Available Endpoints

| Endpoint | Method | Purpose | Params |
|----------|--------|---------|--------|
| `/applicant-id` | GET | Get SumSub applicant ID | `?email=...` |
| `/otp` | GET | Get OTP code | `?email=...` |
| `/answer-list` | GET | Get questionnaire answers (best score) | `?region=<region_id>` |
| `/sumsub/upload-id-doc` | POST | Upload single doc to SumSub | `{ email, docPath }` |
| `/sumsub/upload-all-docs` | POST | Upload selfie + ID front + back | `{ email, country }` |

### Usage in Scripts

```js
// scripts/fetch-answer-list.js
const response = http.get('http://localhost:3000/answer-list?region=' + output.env.REGION_ID);
const body = json(response.body);
output.answerList = body;
```

### Adding New Endpoints

When a test needs data that no existing endpoint provides, add a new route to the local server:
1. Add handler in `maestro-sql-server/handlers.js`
2. Add route in `maestro-sql-server/routes.js`
3. Call it from a script in `scripts/`

**Never access the database directly from Maestro flows — always go through an HTTP endpoint.**

## Test Output

Evidence is saved to `evidence/<timestamp>/` (gitignored). Screenshots are taken with `takeScreenshot` and named descriptively:
- Positive: `01_Create_Account`, `02_Create_Account_Filled`
- Negative: `neg_duplicate_email_submitted`, `neg_duplicate_email_error_toast`

## How to Add a New Test

1. **Add testIds** to `elements/<screen>.js` if new elements are needed
2. **Add navigation** in `navigations/to-<feature>.yaml` if it's a new feature
3. **Create scenario** in `scenarios/<feature>/positive/` or `negative/<screen>/`
   - The scenario assumes it's already on the correct screen
   - Use `output.env.*` for data, `output.<screen>.*` for testIds
4. **Create suite** in `suites/<feature>.yaml` with appropriate tags
   - Must include: `runFlow: ../config/init.yaml` + `runFlow: ../navigations/...` + scenarios
5. **Run**: `maestro test . --include-tags=<your-tag>`

## Running Tests

> ⚠️ **Do NOT use Maestro MCP tools to run tests — they are unreliable and frequently fail with `io exception`.** Always use `run.sh` or direct shell `maestro` commands instead.

```bash
# All tests
./run.sh

# By feature
./run.sh create-live

# By type
./run.sh positive
./run.sh negative

# Smoke tests
./run.sh smoke

# Full regression
./run.sh regression

# Run a specific suite directly
maestro --device 127.0.0.1:6555 test suites/deposit.yaml
```

## Inspecting the Current Screen

> ⚠️ **Do NOT use Maestro MCP `inspect_view_hierarchy` — it is unreliable.** Use `uiautomator dump` instead.

```bash
# Dump current screen UI to a temp file
adb exec-out uiautomator dump /dev/tty > /tmp/ui_dump.xml

# Search for resource IDs
grep -o 'resource-id="[^"]*"' /tmp/ui_dump.xml | sort -u

# Search for a specific element by text
grep -i "deposit" /tmp/ui_dump.xml
```

When selecting an element to interact with:
1. **First priority**: use `resource-id` as the selector
2. Fallback: use `text` or `content-desc`

Resource IDs follow the pattern `<package>:id/<element_id>`, e.g. `vtglobal.appdev:id/deposit_btn`.

## Conventions

- **Scenario files** never navigate — they start at the screen
- **Navigation files** never test — they only get to the screen
- **Utils** are called with `env:` params (DROPDOWN_ID, OPTION, INPUT_ID)
- **Global data** is accessed via `output.env.*`
- **TestIds** are accessed via `output.<screen>.<element>`
- **Screenshots** use descriptive names with numbering for positive, `neg_` prefix for negative
- **Tags**: feature name + `positive`/`negative` + `smoke`/`regression`
