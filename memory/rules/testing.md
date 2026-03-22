## Test Rules

Testing is mandatory after every code change. Agent does not consider a task complete without testing.

### Priority Order

1. **If tests exist** → run them, log the result
   ```
   npm test / pytest / go test ./...
   ```

2. **If no tests exist** → perform these checks in order:
   - No syntax errors? (lint / compiler output)
   - Can the module be imported?
   - Does the function return the expected output? (manual call or simple script)

3. **Test result** is always written to `activity_log`:
   ```
   Test Result: passed — npm test 42/42
   Test Result: failed — [error message]
   Test Result: manual check — lint clean, import successful
   ```

---

## Project Info Collection

If no `PROJECT.md` exists in the project, agent asks:

1. What is the purpose of this project?
2. What is the tech stack?
3. Which folders are critical?

Answers are saved to `memory/project.md`.
