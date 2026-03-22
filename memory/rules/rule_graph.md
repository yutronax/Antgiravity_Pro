# Rule Dependency Graph

```mermaid
graph TD
    Testing["Testing/Verification"] --> Workflow
    Workflow["Workflow (Base)"] --> Commit["Commit System"]
    
    Logging["Logging (Global)"]
    Terminal["Terminal (Global)"]
```

- **Global Rules**: Every task intent will load these for system health.
- **Local Rules**: Loaded based on detected intent.
- **Dependencies**: Ensuring prerequisite behavior is available.
