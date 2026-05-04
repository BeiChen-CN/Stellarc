# Quality Rules

## Hooks And Automation

### Hook Types

- `PreToolUse`: validation or parameter shaping before tool execution
- `PostToolUse`: auto-formatting and checks after tool execution
- `Stop`: final verification at session end

### Permission And State Discipline

- use auto-accept permissions only for trusted, bounded plans
- do not use dangerous skip-permission modes
- use runtime-neutral state tracking to keep progress, granularity, and ordering honest

## Security

### Mandatory Checks Before Commit

- no hardcoded secrets
- all user input validated
- injection risks mitigated
- output encoding or sanitization handled where relevant
- authn/authz and rate limiting reviewed where applicable
- error messages do not leak sensitive context

### Secret Management

- use environment variables or secret managers
- validate required secrets at startup
- rotate exposed secrets if leakage is suspected

### Security Response

- stop when a real security issue is found
- fix critical issues before continuing
- inspect adjacent surfaces for the same class of problem

## Testing

### Coverage And Scope

- maintain meaningful automated coverage
- include unit, integration, and critical workflow testing when the change scope requires them

### TDD Bias

- write failing tests first for non-trivial logic when practical
- implement the minimal passing change
- refactor after green

### Test Failure Triage

- check isolation and fixture correctness first
- fix implementation rather than weakening correct tests

## Completion Checklist

This checklist is binary: all items should be satisfied before completion, or any exception must be called out explicitly in the delivery note with rationale.

- code is readable and well named
- functions stay small and focused
- files stay focused and bounded
- nesting depth remains controlled
- error handling is explicit
- hardcoded values move to constants or config
- validation and testing evidence exist before completion claims
