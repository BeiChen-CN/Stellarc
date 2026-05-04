---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Rules

> This file complements [`coding-style.md`](./coding-style.md) and keeps the rest of the JS/TS guidance in one place.

## Hooks

### PostToolUse

- auto-format edited JS/TS files with Prettier
- run TypeScript checks after editing `.ts` / `.tsx`
- warn on `console.log` usage in modified files

### Stop Hooks

- audit modified JS/TS files for `console.log` before completion

## Patterns

### API Responses

Use a stable response envelope:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

### Repository Pattern

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

Custom hook patterns are acceptable only when they stay composable, testable, and side-effect aware.

## Security

- never hardcode secrets
- use environment variables for credentials
- fail fast when required runtime secrets are missing
- request a dedicated security review for high-risk changes

## Testing

- use Playwright for critical end-to-end JS/TS flows when UI behavior matters
- keep JS/TS tests close to the changed behavior, not as detached snapshots
- use specialist E2E support only when the workflow truly needs browser-level verification
