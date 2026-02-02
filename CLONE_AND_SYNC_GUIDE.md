# Clone and Sync Guide

This guide explains how to clone the codebase to multiple locations and keep them synchronized.

## Repository Information

- **Repository URL**: `https://github.com/joee-Solutions/joee-tenant-ui.git`
- **Main Branch**: `main`

---

## Option 1: Clone to Another Location (Same Machine)

### Step 1: Clone the Repository

```bash
# Navigate to where you want the clone
cd ~/Desktop/wrk

# Clone the repository
git clone https://github.com/joee-Solutions/joee-tenant-ui.git joee-tenant-ui-clone

# Or clone to a specific location
git clone https://github.com/joee-Solutions/joee-tenant-ui.git /path/to/your/location
```

### Step 2: Set Up Both Repositories

**Original Repository** (`/Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui`):
```bash
cd /Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui
git remote -v  # Should show origin pointing to GitHub
```

**Cloned Repository**:
```bash
cd /path/to/joee-tenant-ui-clone
git remote -v  # Should also show origin pointing to GitHub
```

### Step 3: Sync Between Clones

**Method A: Sync via GitHub (Recommended)**
```bash
# In original repository
cd /Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui
git add .
git commit -m "Your changes"
git push origin main

# In cloned repository
cd /path/to/joee-tenant-ui-clone
git pull origin main
```

**Method B: Add Cloned Repository as Remote**
```bash
# In original repository
cd /Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui
git remote add clone /path/to/joee-tenant-ui-clone
git push clone main

# In cloned repository
cd /path/to/joee-tenant-ui-clone
git pull /Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui main
```

---

## Option 2: Clone to Another Machine

### Step 1: Clone on New Machine

```bash
# On the new machine
git clone https://github.com/joee-Solutions/joee-tenant-ui.git
cd joee-tenant-ui
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Set Up Environment Variables

Copy your `.env` file from the original machine, or create a new one:
```bash
# Copy .env file (if you have one)
# Or create a new .env.local file
```

### Step 4: Sync Changes

**Pull latest changes:**
```bash
git pull origin main
```

**Push your changes:**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

---

## Option 3: Multiple Development Environments

### Setup

1. **Development Clone** (for active development):
   ```bash
   git clone https://github.com/joee-Solutions/joee-tenant-ui.git joee-tenant-ui-dev
   cd joee-tenant-ui-dev
   git checkout -b development
   ```

2. **Production Clone** (for testing production builds):
   ```bash
   git clone https://github.com/joee-Solutions/joee-tenant-ui.git joee-tenant-ui-prod
   cd joee-tenant-ui-prod
   git checkout main
   ```

### Sync Workflow

```bash
# Work on development clone
cd joee-tenant-ui-dev
# Make changes, commit, push to development branch
git push origin development

# Merge to main (via GitHub PR or locally)
git checkout main
git merge development
git push origin main

# Update production clone
cd joee-tenant-ui-prod
git pull origin main
```

---

## Automated Sync Script

Create a script to automatically sync between clones:

### `sync-clones.sh`

```bash
#!/bin/bash

# Configuration
ORIGINAL_REPO="/Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui"
CLONE_REPO="/path/to/joee-tenant-ui-clone"
BRANCH="main"

echo "🔄 Syncing repositories..."

# Check if repositories exist
if [ ! -d "$ORIGINAL_REPO" ]; then
    echo "❌ Original repository not found: $ORIGINAL_REPO"
    exit 1
fi

if [ ! -d "$CLONE_REPO" ]; then
    echo "❌ Clone repository not found: $CLONE_REPO"
    exit 1
fi

# Sync from original to clone
echo "📥 Pulling latest changes in original repository..."
cd "$ORIGINAL_REPO"
git pull origin "$BRANCH"

echo "📤 Pushing changes to clone repository..."
cd "$CLONE_REPO"
git pull origin "$BRANCH"

echo "✅ Sync complete!"
```

**Make it executable:**
```bash
chmod +x sync-clones.sh
./sync-clones.sh
```

---

## Using Git Worktree (Recommended for Multiple Clones)

Git worktree allows you to have multiple working directories for the same repository:

### Setup

```bash
# In your main repository
cd /Users/Adebayo/Desktop/wrk/joee/joee-tenant-ui

# Create a new worktree in a different location
git worktree add ../joee-tenant-ui-clone main

# Or create a worktree for a different branch
git worktree add ../joee-tenant-ui-feature feature-branch
```

### Benefits

- ✅ All worktrees share the same `.git` directory
- ✅ Changes are automatically visible across worktrees
- ✅ No need to manually sync
- ✅ Can work on different branches simultaneously

### Usage

```bash
# List all worktrees
git worktree list

# Remove a worktree
git worktree remove ../joee-tenant-ui-clone

# Or remove it manually (if you moved it)
git worktree prune
```

---

## Best Practices

### 1. **Always Pull Before Starting Work**

```bash
git pull origin main
```

### 2. **Commit Frequently**

```bash
git add .
git commit -m "Descriptive commit message"
git push origin main
```

### 3. **Use Branches for Features**

```bash
git checkout -b feature/offline-mode-improvements
# Make changes
git commit -m "feat: improve offline mode"
git push origin feature/offline-mode-improvements
```

### 4. **Keep Clones in Sync**

Set up a daily sync routine or use the sync script above.

### 5. **Use GitHub as Source of Truth**

Always push to GitHub first, then pull in other clones:
```bash
# Machine 1
git push origin main

# Machine 2
git pull origin main
```

---

## Troubleshooting

### Issue: "Repository is out of sync"

**Solution:**
```bash
# Fetch latest changes
git fetch origin

# Check status
git status

# Pull latest changes
git pull origin main
```

### Issue: "Merge conflicts"

**Solution:**
```bash
# See conflicts
git status

# Resolve conflicts manually, then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Issue: "Local changes would be overwritten"

**Solution:**
```bash
# Stash local changes
git stash

# Pull latest changes
git pull origin main

# Apply stashed changes
git stash pop
```

---

## Quick Reference

### Clone Repository
```bash
git clone https://github.com/joee-Solutions/joee-tenant-ui.git
```

### Pull Latest Changes
```bash
git pull origin main
```

### Push Changes
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Check Status
```bash
git status
git log --oneline -10
```

### Create Worktree
```bash
git worktree add ../joee-tenant-ui-clone main
```

---

## Summary

✅ **Yes, you can clone the codebase multiple times and sync them**

**Recommended Approach:**
1. Use **Git Worktree** for multiple clones on the same machine
2. Use **GitHub as the central repository** for syncing across machines
3. Always **pull before starting work** and **push when done**
4. Use **branches** for feature development
5. Set up **automated sync scripts** if needed

This ensures all your clones stay in sync and you can work seamlessly across multiple locations!

