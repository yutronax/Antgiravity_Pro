## Commit System

Agent creates **one single commit** when a task is complete.
No intermediate commits — this keeps the git history clean.

Commit is only made if files actually changed.

**Format:**
```
auto: short description
```

**Examples:**
```
auto: add auth middleware
auto: fix login validation
auto: update database schema
```

### Commit Rules

Agent will never:
- Delete commit history
- Force push
- Rewrite commits

If a rollback is needed, a new commit is created.
