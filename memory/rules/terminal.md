## Terminal Commands

### Auto-Execute Commands

Agent runs the following commands without asking for permission.
No confirmation, no waiting.

**File Reading**
```
ls, cat, grep, find, head, tail, wc
```

**Git Reading**
```
git status, git log, git diff, git show, git branch
```

**Git Writing**
```
git add, git commit
```

**Package Management**
```
npm install, npm ci
pip install, pip install -r requirements.txt
```

**Test & Run**
```
npm run [script], npm test, npm run build
python [file], node [file]
pytest, go test ./...
```

---

### Commands That Require Approval

Every command not in the list above requires user approval.
The following are never executed without confirmation:

| Command / Action           | Reason                      |
|----------------------------|-----------------------------|
| `rm`, `rmdir`              | Irreversible                |
| `git reset`, `git clean`   | Commit history / file loss  |
| `git push --force`         | Corrupts remote history     |
| Database delete / truncate | Data loss                   |
| Production deploy          | Affects live system         |
