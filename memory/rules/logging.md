## Project Memory System

Every project must have the following structure in its root directory:

```
memory/
 ├─ project.md
 └─ logs/
     ├─ activity_log_YYYY-MM-DD.md   ← today's log
     ├─ activity_log_YYYY-MM-DD.md   ← archive (never deleted)
     ├─ error_log_YYYY-MM-DD.md      ← today's error log
     └─ error_log_YYYY-MM-DD.md      ← archive (never deleted)
```

If the folder does not exist, agent creates it automatically.

---

### Static Memory — `memory/project.md`

Holds the permanent knowledge of the project. Contains:

- Project purpose
- System architecture
- Technologies used
- Folder structure
- Relations between modules
- Critical files

**Reading is mandatory:** Agent reads this file before starting every task.

If the file does not exist, agent:
1. Analyzes the project directory
2. Reads README files
3. Extracts folder structure
4. Creates `project.md` and notifies the user

---

### Dynamic Memory — `memory/logs/activity_log_YYYY-MM-DD.md`

A new log file is created every day. Old files are **never deleted**, they stay as archive.

---

### Activity Log Write Command

Agent runs the following command **exactly** after every operation.
Agent never writes manually. Agent never overwrites.

```bash
new_entry="## [$(date '+%Y-%m-%d %H:%M')]

**Request:** REPLACE_WITH_REQUEST

**Files:**
- REPLACE_WITH_FILES

**Change:** REPLACE_WITH_CHANGE

**Reason:** REPLACE_WITH_REASON

**Test Result:** REPLACE_WITH_RESULT

---
"

if [ -f memory/logs/activity_log_$(date '+%Y-%m-%d').md ]; then
  existing=$(cat memory/logs/activity_log_$(date '+%Y-%m-%d').md)
  echo "$new_entry$existing" > memory/logs/activity_log_$(date '+%Y-%m-%d').md
else
  echo "$new_entry" > memory/logs/activity_log_$(date '+%Y-%m-%d').md
fi
```

---

### Memory Update Rules

| Situation             | File to Update                 |
|-----------------------|--------------------------------|
| New file created      | `activity_log`                 |
| Code changed          | `activity_log`                 |
| New module added      | `project.md` + `activity_log`  |
| Architecture changed  | `project.md` + `activity_log`  |

---

## Error Logging

Every error is recorded in a separate file. Errors are never written to `activity_log`.

### File Location

```
memory/logs/error_log_YYYY-MM-DD.md
```

A new error log file is created each day. Old files are never deleted.

---

### Error Types to Record

| Type | Examples |
|---|---|
| Terminal error | non-zero exit code, stderr output |
| Test error | failed test, assertion error |
| File error | file not found, permission denied, write failed |
| API / Network error | timeout, connection refused, non-200 response |

---

### Error Write Command

Agent runs the following command exactly when an error occurs:

```bash
error_entry="## [$(date '+%Y-%m-%d %H:%M')]

**Type:** REPLACE_WITH_ERROR_TYPE

**Command / Action:** REPLACE_WITH_WHAT_WAS_RUNNING

**Error:**
REPLACE_WITH_ERROR_MESSAGE

**Exit Code:** REPLACE_WITH_CODE

---
"

if [ -f memory/logs/error_log_$(date '+%Y-%m-%d').md ]; then
  existing=$(cat memory/logs/error_log_$(date '+%Y-%m-%d').md)
  echo "$error_entry$existing" > memory/logs/error_log_$(date '+%Y-%m-%d').md
else
  echo "$error_entry" > memory/logs/error_log_$(date '+%Y-%m-%d').md
fi
```

---

### Resolution Logging

After resolving the error, agent appends the resolution under the same entry:

```bash
resolution="**Resolution:** REPLACE_WITH_HOW_IT_WAS_FIXED

**Status:** resolved / unresolved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"

existing=$(cat memory/logs/error_log_$(date '+%Y-%m-%d').md)
echo "$existing$resolution" > memory/logs/error_log_$(date '+%Y-%m-%d').md
```

---

### Error Handling Flow

1. Error occurs → record it immediately
2. Attempt to resolve
3. Resolution found → append resolution, mark as `resolved`
4. Resolution not found → append what was tried, mark as `unresolved`, notify user
