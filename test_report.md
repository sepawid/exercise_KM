# Test Execution Report: Random Date Generator

**Date of Testing:** March 6, 2026  
**Tested By:** [Your Name] / QA Automation Engineer Candidate  
**Time Spent:** 1 Hour (Timeboxed Exercise)  
**System Under Test:** [https://codebeautify.org/generate-random-date](https://codebeautify.org/generate-random-date)

---

## 1. Executive Summary
During the allocated 1-hour timebox, an exploratory and automated testing strategy was applied to the Random Date Generator. The application fundamentally achieves its primary purpose—generating random dates based on basic input. 

However, critical gaps were identified in input validation and security. The tool lacks defensive mechanisms against logical paradoxes (e.g., Start Date occurring after End Date) and is vulnerable to Cross-Site Scripting (XSS) via the Custom Format input field. 

To ensure thorough coverage, an automated regression suite consisting of 12 End-to-End (E2E) tests was developed using the Playwright framework.

## 2. Testing Methodology
* **Exploratory Testing:** Session-based testing to build a mental model of inputs, outputs, and constraints.
* **Equivalence Partitioning & Boundary Value Analysis (BVA):** Applied to the numeric count field and date ranges.
* **Test Automation:** TypeScript + Playwright was selected to create a robust, repeatable test harness for validating boundary conditions and injecting negative test cases.

## 3. Test Execution Summary

A suite of **12 E2E test cases** was executed against the application's UI.

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Test Cases** | 12 | 100% |
| **Passed (🟢 )** | 8 | 66.7% |
| **Failed (🔴 )** | 4 | 33.3% |
| **Blocked (⚫ )** | 0 | 0% |

### 3.1 Traceability: Full Test Execution Record
* **🟢 TC01:** System generates exactly 10 dates by default - **PASS**
* **🟢 TC02:** System generates exactly 1 date (Lower Bound) - **PASS**
* **🟢 TC03:** System successfully generates 5,000 dates under moderate load (Upper Bound) - **PASS**
* **🔴 TC04:** System should reject generation when count is `0` - **FAIL** (Missing validation)
* **🔴 TC05:** System should reject generation for negative date counts (e.g., `-5`) - **FAIL** (Missing validation)
* **🟢 TC06:** UI correctly rejects alphabetical/special characters in the numeric count field - **PASS**
* **🔴 TC07:** System should prevent generation when Start Date is chronologically AFTER End Date - **FAIL** (Logic bypasses constraints and generates impossible dates)
* **🟢 TC08:** System correctly generates dates when Start Date and End Date are identical - **PASS**
* **🟢 TC09:** System correctly generates historic dates entirely within the 1900s - **PASS**
* **🟢 TC10:** Standard Date Output Format overrides function correctly (e.g., ISO 8601) - **PASS**
* **🔴 TC11:** Custom format field should sanitize HTML payloads to prevent XSS - **FAIL** (Raw `<script>` tags are rendered directly in the output)
* **🟢 TC12:** System gracefully handles excessively long custom format strings - **PASS**

---

## 4. Key Findings & Defects (Failed Test Cases)

*(The 4 failed test cases highlighted above point to the following prioritised defects.)*

### 🔴 High Priority / Critical
* **BUG-01: Logical Constraint Failure on Date Ranges (TC07)**
    * **Steps to Reproduce:** Set Start Date to "2030-01-01" and End Date to "2020-01-01". Click Generate.
    * **Expected Result:** Application displays a validation error preventing generation (Start Date must logically precede End Date).
    * **Actual Result:** The validation is missing entirely. The logic silently bypasses the constraint and outputs dates outside the requested chronological parameters.

* **BUG-02: Lack of Input Sanitization / Potential XSS (TC11)**
    * **Steps to Reproduce:** Select "Custom date format". Enter `<script>alert('XSS')</script> YYYY-MM` into the text box. Process the generation.
    * **Expected Result:** The raw script tags are stripped or encoded (`&lt;script&gt;`) before being placed in the DOM textarea.
    * **Actual Result:** The raw tags are returned exactly as written. While the textarea element mitigates execution in this specific view, this indicates the input is entirely unsanitized, posing a significant security risk if this backend logic is used to supply data to a rendered HTML component elsewhere.

### 🟡 Medium Priority
* **BUG-03: Missing Boundary Validation on Count Field (TC04, TC05)**
    * **Steps to Reproduce:** Enter `0` or a negative integer (e.g., `-5`) into the "How many dates" field.
    * **Expected Result:** The UI enforces a minimum limit via HTML5 attributes (`min="1"`) or displays a validation warning preventing execution.
    * **Actual Result:** The system ignores the boundary condition entirely.

---

## 5. Questions for the Product / Development Team
*(To be discussed during the interview readout)*
1. **Requirements:** What is the business expectation for the maximum intended limit on the "How many dates" field? Currently, the UI does not restrict incredibly high numbers that degrade browser performance.
2. **Business Logic:** When a user inputs a Start Date > End Date, is the intended behavior to auto-swap the dates transparently, or block the UI with an error message?
3. **Accessibility:** Does the tool need to adhere to specific WCAG 2.1 accessibility standards? (Initial testing notes that form labels and ARIA descriptors are sparse).

---
*End of Report.*
