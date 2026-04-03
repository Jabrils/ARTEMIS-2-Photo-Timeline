# System Map: Load or Create

## Step 0: Load or Create System Map

Before any analysis, check for existing System Map:

```
IF docs/analysis/system-map.md exists AND is <24h old:
    Load it (skip discovery)
ELSE:
    Run discovery (Step 1)
```

---

## Step 1: System Discovery

When System Map doesn't exist or is stale, discover the system:

### 1.1 Read Project Context
Priority order:
1. CLAUDE.md — Project instructions
2. ARCHITECTURE.md — Architecture documentation
3. README.md — User manual
4. docker-compose.yml — Service definitions
5. pyproject.toml / package.json — Dependencies

### 1.2 Scan Directory Structure
Look for:
- backend/app/services/ — Python service layer
- backend/app/api/ — API routers
- backend/app/models/ — Data models
- src/ — Generic source
- frontend/ — Frontend code
- lib/ or packages/ — Libraries

### 1.3 Analyze Code Metrics
For each discovered module:
- Line count (complexity indicator)
- Import count (coupling indicator)
- Class/function count (scope indicator)

### 1.4 Build System Map
Write to: `docs/analysis/system-map.md`

```markdown
# System Map: {Project Name}

**Generated**: {YYYY-MM-DD HH:MM} UTC
**Generator**: /analyze discover

---

## Components Discovered

### Services
| ID | Name | Path | LOC | Imports | Description |
|----|------|------|-----|---------|-------------|
| svc-1 | {name} | {path} | {loc} | {imports} | {inferred desc} |

### API Layer
| ID | Name | Path | Endpoints |
|----|------|------|-----------|

### Models
| ID | Name | Path | Fields |
|----|------|------|--------|

---

## Dependency Graph
{Component relationships discovered from imports}

---

## Risk Hotspots (Auto-Detected)
- High coupling: {components imported by many others}
- High complexity: {large LOC or many imports}

---

## Documentation Status
| Doc | Exists | Last Updated |
|-----|--------|--------------|
```
