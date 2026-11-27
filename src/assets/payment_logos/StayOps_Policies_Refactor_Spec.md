# StayOps Policies Refactor Specification

## Objective

Refactor the Policies settings implementation for maintainability and consistency without changing the existing API contract, UI behavior, or backend payload structure unless explicitly stated below.

Target files:

- `PoliciesSettings.jsx`
- `CancellationPolicyModal.jsx`
- `GenericPolicyModal.jsx`

---

## 1. Remove duplicated default policy data

### Current issue

Default policy values are duplicated across multiple files.

Examples:

- Default cancellation rules are defined in `PoliciesSettings.jsx`.
- Default cancellation rules are also defined inside `CancellationPolicyModal.jsx`.
- Default terms/privacy/refund/child values are defined in both `PoliciesSettings.jsx` and `GenericPolicyModal.jsx`.

### Required change

Create one shared source of truth for defaults.

Recommended file:

```text
Policies/
└── policyDefaults.js
```

Put all default values there:

```text
DEFAULT_POLICY_DATA
DEFAULT_CANCELLATION_RULES
DEFAULT_CHILD_POLICY
DEFAULT_TERMS
DEFAULT_PRIVACY
DEFAULT_REFUND
```

All three components should import these defaults instead of redefining them.

Do not change the JSON property names expected by the backend.

---

## 2. Refactor `PoliciesSettings.jsx` data loading

### Current issue

`fetchPolicies()` has too many responsibilities:

1. Read authentication token.
2. Fetch all properties.
3. Validate property ownership on the client.
4. Resolve the active property ID.
5. Fetch policy data.
6. Apply defaults.
7. Update loading state.

This makes the function unnecessarily large.

### Required change

Keep the logic in the same component for now, but split it into small functions:

```text
loadUserProperties()
resolvePropertyId()
loadPolicySettings()
```

`fetchPolicies()` can coordinate those functions.

Do not create excessive abstractions.

---

## 3. Preserve backend authorization

The frontend property ownership check can remain as a UI/data-safety measure, but it must not be treated as the security boundary.

The backend must continue enforcing authorization for:

```http
GET /properties/{propertyId}/policies
POST /properties/{propertyId}/policies
```

Do not remove the Bearer token authentication.

Current frontend authentication contract:

```http
Authorization: Bearer <token>
```

---

## 4. Improve loading and error handling

### Current issue

`PoliciesSettings.jsx` logs errors but does not expose a useful error state to the user.

Current behavior:

```js
catch (err) {
  console.error("Error loading policies:", err);
}
```

### Required change

Add an error state:

```js
const [error, setError] = useState("");
```

On loading failure:

```text
setError(...)
```

Render an error state with a retry action.

The loading spinner should remain separate from the error state.

Do not use `setLoading(false)` in multiple early-return branches unless necessary. Prefer `finally`.

---

## 5. Keep loading spinner

The existing loading spinner behavior is correct.

Use:

```text
tax-settings-loading
tax-loading-spinner
```

or rename to policy-specific classes if CSS is also updated consistently.

Do not show the full policy UI before policy loading completes.

---

## 6. Fix save-state behavior

### Current issue

The modal save callbacks update local state before knowing whether the backend save succeeded.

Current pattern:

```js
setPolicyData(newPolicyData);
await handleSavePolicies(newPolicyData);
setActiveModal(null);
```

### Required change

The preferred flow is:

```text
Modal submits changes
        ↓
Parent sends changes to backend
        ↓
Backend save succeeds
        ↓
Update policyData
        ↓
Close modal
```

If the backend save fails:

```text
Keep modal open
Keep unsaved changes visible
Show error toast
Do not treat the save as successful
```

Do not silently overwrite the current saved state with an unsuccessful request.

# CancellationPolicyModal.jsx

## 7. Separate normalization from UI

### Current issue

`normalizeRules()` contains legacy migration logic, defaulting, and normalization directly inside the modal.

### Required change

Move normalization into a utility:

```text
policyUtils.js
```

Recommended function:

```js
normalizeCancellationRules(rawRules)
```

The modal should receive normalized rule data and focus on editing/displaying it.

---

## 8. Keep backward compatibility

`normalizeCancellationRules()` must continue supporting the legacy fields currently handled:

```text
deductUnit
deductValue
chargeType
chargeValue
beforeValue
beforeUnit
afterTiming
active
type
```

Do not remove legacy conversion logic unless the backend data is migrated.

---

## 9. Cancellation preview must respect the selected tab

### Required behavior

### `BEFORE_CHECKIN`

Show only:

```text
BEFORE_CHECKIN
```

rules.

### `AFTER_RESERVATION`

Show only:

```text
AFTER_RESERVATION
```

rules.

### `PRESETS`

Show all active rules as the policy summary.

The current implementation has already been corrected to use the selected tab. Preserve that behavior.

---

## 10. Improve cancellation preview wording

The preview should be clear and unambiguous.

Avoid wording such as:

```text
100% of booking amount will be deducted if booking is cancelled 7 days before check-in.
```

This can be interpreted as only applying exactly 7 days before arrival.

Prefer:

```text
If cancelled within 7 days of check-in, 100% of the booking amount is charged.
```

For UI summaries, use the same semantic meaning consistently.

---

## 11. Do not claim OTA synchronization without OTA integration

The preset section should not imply that the application currently synchronizes policies with:

```text
Airbnb
Booking.com
Vrbo
Agoda
```

unless an actual OTA/channel-manager integration exists.

Use wording such as:

```text
Use OTA-style presets as a starting point for your property rules.
```

Do not use:

```text
sync with Airbnb, Booking.com, and Vrbo
```

unless the backend integration actually performs synchronization.

---

## 12. Policy Presets

The third tab should be named:

```text
Policy Presets
```

Preset cards:

```text
Flexible
Moderate
Strict
Non-Refundable
```

must remain.

### Preset overwrite behavior

Applying a preset currently replaces the current cancellation rules.

This must be explicitly documented in the UI or confirmed before replacing custom rules.

Preferred UX:

```text
Applying this preset will replace your current cancellation rules. Continue?
```

Do not silently destroy existing custom rules.

# GenericPolicyModal.jsx

## 13. Simplify title resolution

Current implementation uses a `switch`.

Replace with a mapping object:

```js
const POLICY_TITLES = {
  terms: "Terms and conditions",
  privacy: "Privacy policy",
  refund: "Refund policy",
  child: "Child age policy",
};
```

Then use:

```js
POLICY_TITLES[type] || "Policy Settings"
```

This is simpler and easier to maintain.

---

## 14. Simplify save-field resolution

Current `handleSave()` uses a long `if / else if` chain.

Replace with a clear mapping between modal type and payload field.

Required mapping:

```text
terms   → termsAndConditions
privacy → privacyPolicy
refund  → refundPolicy
child   → childAgePolicyJson
```

Do not change backend field names.

---

## 15. Remove duplicated default text

`GenericPolicyModal.jsx` currently contains default policy text for:

```text
Terms and conditions
Privacy policy
Refund policy
Child policy defaults
```

These must come from the shared defaults file.

The modal should not define the default business content itself.

---

## 16. Validate child age ranges

Before saving child policy:

```text
freeChildMaxAge >= 0
freeChildMaxAge < childAgeMax
childAgeMax <= 18
childExtraCharge >= 0
```

Invalid ranges must prevent save and display an error.

Example invalid state:

```text
Free child age = 15
Child upper limit = 10
```

This must not be saved.

---

## 17. Avoid silently converting empty number inputs to zero

Current pattern:

```js
Number(e.target.value) || 0
```

can turn an intentionally empty field into `0` while the user is editing.

Prefer handling empty input explicitly and validating on save.

Do not make the input experience unstable while typing.

---

# Cross-component consistency

## 18. Single source of truth

The data flow should be:

```text
Backend
   ↓
PoliciesSettings
   ↓
policyData
   ↓
Modal
   ↓
User edits
   ↓
onSave
   ↓
Backend
   ↓
Saved response
   ↓
policyData
```

Avoid maintaining separate copies of the same policy defaults in multiple components.

---

## 19. Do not over-refactor

Do not create a large architecture for this feature.

Keep approximately:

```text
PoliciesSettings.jsx
CancellationPolicyModal.jsx
GenericPolicyModal.jsx
policyDefaults.js
policyUtils.js
```

Only add another file when it removes real duplication or business logic.

---

## 20. Preserve existing UI and CSS

Do not redesign the existing modal layout.

Preserve these existing class names unless there is a specific styling issue:

```text
cpm-*
gpm-*
policy-card
policies-container
policies-grid
policies-footer-note
```

The refactor is primarily code organization, validation, data flow, and correctness.

---

## 21. Preserve existing API contract

Do not change these endpoints without an explicit backend requirement:

```http
GET  /properties/{propertyId}/policies
POST /properties/{propertyId}/policies
GET  /properties
```

Do not rename fields such as:

```text
noCancellationPolicy
cancellationRulesJson
termsAndConditions
privacyPolicy
refundPolicy
childAgePolicyJson
```

---

## 22. Final acceptance criteria

After refactoring:

- No duplicated default policy data.
- Policy loading has a spinner.
- Policy loading failures show an error state and retry action.
- Backend remains the source of truth.
- Failed saves do not appear successful.
- Cancellation preview only shows the currently selected tab's rules.
- Presets are clearly labeled and do not falsely claim OTA synchronization.
- Applying a preset does not silently destroy custom rules.
- Child policy ranges are validated.
- Existing API endpoints and payload fields remain compatible.
- Existing UI layout and CSS are preserved.
- Code remains understandable and reasonably sized.
