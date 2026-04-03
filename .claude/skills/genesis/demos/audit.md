# Demo: Audit a Legacy Codebase

**Pipeline**: Audit (analyze → finding → investigate → design/rca → implement/fix → review)
**Duration**: ~40 minutes
**Stack**: Node.js / Express / SQLite3
**Difficulty**: Intermediate
**Prerequisite**: Node.js 18+ installed

## Project Description

A legacy user management API inherited from a previous team. The API works but has accumulated significant technical debt and security vulnerabilities. Your job is to audit it, prioritize the issues, and fix the most critical ones using the Wrought audit pipeline.

## Scaffold Files

<!-- file: package.json -->
```json
{
  "name": "user-api-legacy",
  "version": "1.0.0",
  "description": "Legacy user management API (demo — has intentional issues)",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "test": "node tests/users.test.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "better-sqlite3": "^11.0.0",
    "jsonwebtoken": "^9.0.0"
  }
}
```

<!-- file: src/app.js -->
```javascript
const express = require('express');
const userRoutes = require('./routes/users');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', userRoutes);

// No error handling middleware

const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

module.exports = app;
```

<!-- file: src/db.js -->
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// SQL injection vulnerable query builder
function findUser(field, value) {
  return db.prepare("SELECT * FROM users WHERE " + field + " = '" + value + "'").get();
}

function getAllUsers() {
  return db.prepare("SELECT * FROM users").all();
}

function createUser(name, email, role) {
  return db.prepare("INSERT INTO users (name, email, role) VALUES (?, ?, ?)").run(name, email, role || 'user');
}

function deleteUser(id) {
  return db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

function getPostsForUser(userId) {
  return db.prepare("SELECT * FROM posts WHERE user_id = ?").all(userId);
}

module.exports = { findUser, getAllUsers, createUser, deleteUser, getPostsForUser };
```

<!-- file: src/routes/users.js -->
```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/users — list all users with their posts
router.get('/', authenticate, (req, res) => {
  const users = db.getAllUsers();
  // N+1 query: fetches posts for each user individually
  const result = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const posts = db.getPostsForUser(user.id);
    result.push({
      ...user,
      posts: posts,
      post_count: posts.length
    });
  }
  res.json(result);
});

// GET /api/users/:id — get single user
router.get('/:id', authenticate, (req, res) => {
  const user = db.findUser('id', req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  // XSS: unescaped user input in response HTML
  if (req.query.format === 'html') {
    res.send('<h1>' + user.name + '</h1><p>' + user.email + '</p>');
    return;
  }
  res.json(user);
});

// POST /api/users — create user
router.post('/', authenticate, (req, res) => {
  try {
    const result = db.createUser(req.body.name, req.body.email, req.body.role);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id — delete user (MISSING AUTH!)
router.delete('/:id', (req, res) => {
  const result = db.deleteUser(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

// Search by field — passes user input directly to SQL
router.get('/search/:field/:value', authenticate, (req, res) => {
  const user = db.findUser(req.params.field, req.params.value);
  if (!user) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(user);
});

module.exports = router;
```

<!-- file: src/middleware/auth.js -->
```javascript
const jwt = require('jsonwebtoken');

const SECRET = 'secret123';  // Hardcoded secret

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    // For demo purposes, allow unauthenticated access
    next();
    return;
  }

  const token = header.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token' });
    return;
  }

  jwt.verify(token, SECRET, function(err, decoded) {
    if (err) {
      jwt.verify(token, SECRET, function(err2, decoded2) {
        if (err2) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }
        req.user = decoded2;
        next();
      });
    } else {
      req.user = decoded;
      next();
    }
  });
}

module.exports = { authenticate, SECRET };
```

<!-- file: tests/users.test.js -->
```javascript
const assert = require('assert');
const db = require('../src/db');

// Basic smoke tests — don't cover security issues
try {
  // Test create
  const result = db.createUser('Test User', 'test' + Date.now() + '@example.com', 'user');
  assert(result.lastInsertRowid > 0, 'Should create user');

  // Test read
  const users = db.getAllUsers();
  assert(users.length > 0, 'Should have users');

  console.log('All tests passed');
} catch (err) {
  console.error('Test failed:', err.message);
  process.exit(1);
}
```

<!-- file: README.md -->
```markdown
# User Management API (Legacy)

A user management REST API inherited from a previous team.

## Quick Start

1. `npm install` to install dependencies
2. `npm start` to start the server
3. `npm test` to run tests

## Status

This codebase works but hasn't been reviewed in a while. There may be issues.

## What's Next

Open `DEMO_WALKTHROUGH.md` for a guided tour of auditing this codebase with Wrought.
```

## Walkthrough

<!-- walkthrough -->

# Demo Walkthrough: Audit a Legacy Codebase

**Pipeline**: Audit
**Goal**: Audit the legacy user management API, identify and prioritize issues, then fix the most critical ones using the Wrought audit pipeline.
**Prerequisite**: Node.js 18+ installed. Run `npm install` first.

## Step 1: Analyze the Codebase

Run:
```
/analyze
```

The analysis skill will scan the codebase and produce a system map identifying key components, patterns, and potential issues.

## Step 2: Create Findings

Run:
```
/finding
```

Create a Findings Tracker from the analysis. You should see findings for security vulnerabilities (SQL injection, hardcoded secret, missing auth) and code quality issues (N+1 queries, callback hell).

## Step 3: Investigate the Most Critical Finding

Run:
```
/investigate
```

Select the highest-severity finding (likely the SQL injection) and investigate it deeply.

## Step 4: Fix or Design

Depending on the finding type:

**For a Defect** (security vulnerability):
```
/rca-bugfix
```
This produces an RCA and fix specification.

**For a Gap** (missing functionality like proper auth):
```
/design tradeoff "authentication architecture for user API"
```
Then `/blueprint` to create an implementation spec.

## Step 5: Plan the Fix

Run:
```
/plan
```

Create the implementation plan for the fix.

## Step 6: Implement

Run:
```
/wrought-rca-fix
```
(for defects) or:
```
/wrought-implement
```
(for gaps)

## Step 7: Review

Run:
```
/forge-review --scope=diff
```

Review the changes for quality and completeness.

## Repeat

Go back to Step 3 and investigate the next finding. Continue until you've addressed all critical and high-severity issues.

## Done!

You've audited a legacy codebase using the Wrought audit pipeline. Every finding, investigation, fix, and review is tracked in your Findings Tracker.
<!-- /walkthrough -->
