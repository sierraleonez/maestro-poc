# Maestro E2E Test Implementation Summary

## Overview

Successfully created comprehensive end-to-end test flows for the Valutrades mobile application using Maestro testing framework with MCP integration.

## Test Files Created

### 1. complete-user-journey-final.yaml

**Purpose**: Complete E2E test covering the full user journey from language selection to logout

**Test Flow**:

1. Language Selection (English)
2. Video Onboarding navigation
3. Login with test credentials
4. Account Selection
5. Home Screen verification
6. Market Tab navigation
7. News Screen navigation
8. Deposit Screen navigation
9. Withdraw Screen navigation
10. Transfer Screen navigation
11. Other Tab & Support Centre navigation
12. Logout

**Screenshots Captured**: 14 screenshots at key points

**Key Features**:

- Handles update dialogs automatically
- Handles product announcement dialogs
- Uses proper testIDs where available
- Falls back to text-based selectors when needed
- Includes proper wait times for async operations

### 2. product-detail-navigation.yaml

**Purpose**: Tests navigation through all Product Detail tabs

**Test Flow**:

- Navigate to AUDJPY product
- Verify and navigate through 5 tabs: Overview, Signal, Sentiment, News, Calendar
- Captures screenshots at each tab

### 3. from-login-journey.yaml

**Purpose**: Shortened test starting from login screen (useful for quick testing)

## Key Findings & Solutions

### TestID Corrections

- Login button: `login_btn_login` (not `button_login`)
- Account cards: `accountSelection_btn_{account_number}` (not `accountSelection_card_0`)
- Trade Now button: `accountSelection_btn_tradeNow` (not `btn_tradeNow`)

### Dialog Handling

- Update dialog: Handled with conditional `runFlow` checking for "Later" button
- Product announcement: Handled with conditional `runFlow` checking for "Get Started" button

### Navigation Patterns

- Bottom tabs (Home, Market, Other): Use text-based selectors
- Grid menu items (News, Deposit, Withdrawal, Transfer): Require scrolling, use text selectors
- TestID-based navigation: Signal (`view-signals`), account sections

### Timeout Strategy

- Post-login screens: 10 seconds (account data loading)
- Navigation transitions: 3-5 seconds
- Standard UI elements: 5 seconds (default)

## MCP Integration

### Configuration

File: `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"],
      "disabled": false,
      "autoApprove": [
        "inspect_view_hierarchy",
        "run_flow",
        "run_flow_files",
        "take_screenshot",
        "list_devices",
        "launch_app",
        "tap_on"
      ]
    }
  }
}
```

### Available MCP Tools

- `mcp_maestro_list_devices` - List available devices
- `mcp_maestro_launch_app` - Launch application
- `mcp_maestro_take_screenshot` - Capture screenshots
- `mcp_maestro_inspect_view_hierarchy` - Inspect UI elements
- `mcp_maestro_tap_on` - Tap on elements
- `mcp_maestro_run_flow` - Run ad-hoc Maestro commands
- `mcp_maestro_run_flow_files` - Run Maestro test files
- `mcp_maestro_back` - Navigate back
- And more...

## Test Execution

### Prerequisites

1. Maestro installed and configured
2. Android emulator or iOS simulator running
3. App installed: `vtglobal.appdev`
4. Test account credentials: `lesley@yopmail.com` / `Password123!`

### Running Tests

**Full journey test**:

```bash
maestro test maestro/flows/complete-user-journey-final.yaml
```

**Product detail test**:

```bash
maestro test maestro/flows/product-detail-navigation.yaml
```

**From login test** (requires app on login screen):

```bash
maestro test maestro/flows/from-login-journey.yaml
```

### Using MCP Tools

The Maestro MCP server is configured and can be used through Kiro's MCP integration for interactive testing and debugging.

## Recommendations

### For Production Use

1. Add more robust error handling for network failures
2. Create separate test files for each major feature
3. Implement data-driven testing for multiple accounts
4. Add assertions for specific UI elements beyond visibility
5. Consider parameterizing test credentials

### TestID Improvements

Recommend adding testIDs to these screens for more reliable testing:

- Market screen container
- News screen container
- Support Centre screen container
- Product Detail tabs (Overview, Signal, Sentiment, News, Calendar)

### Future Enhancements

1. Add negative test cases (invalid login, etc.)
2. Test offline scenarios
3. Test different language selections
4. Add performance benchmarks
5. Integrate with CI/CD pipeline

## Technical Notes

### Maestro Syntax

- Use `extendedWaitUntil` for elements that may take time to appear
- Use `runFlow` with `when` condition for optional dialogs
- Prefer testID selectors over text for stability
- Use `back` for navigation instead of tapping back buttons

### Common Issues & Solutions

1. **App launch failures**: Use MCP tools directly or ensure correct app ID
2. **Element not found**: Check if scrolling is needed or use inspect_view_hierarchy
3. **Timeout errors**: Increase timeout for post-authentication screens
4. **Dialog interference**: Add conditional handlers for all known dialogs

## Status

✅ Complete user journey test created and validated
✅ MCP integration configured and working
✅ TestIDs documented and corrected
✅ Dialog handling implemented
✅ Navigation patterns identified and implemented
