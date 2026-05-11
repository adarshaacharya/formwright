# Product Goals

## Goal

Build a highly dynamic form builder framework that can accept a backend-driven schema and render different UI patterns on the frontend without rewriting form logic for each use case.

## Core objectives

- allow backend systems to describe form structure and behavior declaratively
- allow frontend applications to render forms dynamically from that schema
- support dynamic labels, input types, positioning, sections, visibility, disabled states, and validation
- use React Hook Form as the runtime form state engine in React applications
- keep the system extensible enough for consumers to add new field types, layouts, validators, and plugins

## Non-goals for the first phase

- not a visual drag-and-drop builder yet
- not tied to a single design system
- not a one-off app-specific form renderer
- not a pure JSON Schema renderer with no custom behavior layer

## Desired qualities

- schema-driven
- headless-first
- composable
- plugin-friendly
- performance-conscious
- backend/frontend decoupled
- versionable
