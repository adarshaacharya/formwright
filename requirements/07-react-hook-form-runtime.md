# React Hook Form Runtime

## Decision

React Hook Form should be the React runtime state engine, not the full framework.

## Why React Hook Form fits

It is a strong fit for:

- performance-sensitive forms
- nested field names
- subscriptions
- field arrays
- controlled and uncontrolled input mixes
- validation integration

## Responsibilities of the RHF adapter layer

The React adapter package should handle:

- binding schema fields to RHF registration APIs
- bridging controlled components through controllers where needed
- handling nested values
- array and repeater integration
- error projection into renderers
- form submission orchestration
- subscription-based rule evaluation

## What RHF should not own

RHF should not define:

- the backend schema contract
- layout semantics
- plugin registration
- rule DSL
- renderer registry

Those belong to the framework.

## State categories

The design should keep these state types separate:

### 1. Form value state

The actual user-entered data.

### 2. UI state

Current step, section expansion, local loading flags, and similar view state.

### 3. Derived state

Visibility, disabled state, requiredness, and computed outputs.

### 4. Workflow state

Draft, review, approved, locked, and other domain states provided by backend or runtime context.
