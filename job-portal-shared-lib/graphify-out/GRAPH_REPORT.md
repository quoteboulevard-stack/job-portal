# Graph Report - job-portal-shared-lib  (2026-04-27)

## Corpus Check
- 25 files · ~4,275 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 57 nodes · 53 edges · 11 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `AppError` - 3 edges
2. `ValidationError` - 3 edges
3. `NotFoundError` - 3 edges
4. `UnauthorizedError` - 3 edges
5. `ForbiddenError` - 3 edges
6. `ConflictError` - 3 edges
7. `isAppError()` - 3 edges
8. `toAppError()` - 3 edges
9. `isValidEmail()` - 2 edges
10. `isValidPassword()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.43
Nodes (6): calculateDaysSince(), formatCurrency(), formatDate(), formatPercentage(), formatPhone(), getDaysUntilExpiry()

### Community 1 - "Community 1"
Cohesion: 0.29
Nodes (6): AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError

### Community 2 - "Community 2"
Cohesion: 0.53
Nodes (4): isValidEmail(), isValidPassword(), isValidPhone(), isValidURL()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (2): createLogger(), serialize()

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (1): NotFoundError

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (2): isAppError(), toAppError()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (1): UnauthorizedError

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (1): ValidationError

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (1): ConflictError

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (1): ForbiddenError

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (1): AppError

## Knowledge Gaps
- **6 isolated node(s):** `AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 3`** (4 nodes): `logger.js`, `createLogger()`, `serialize()`, `logger.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (3 nodes): `NotFoundError`, `.constructor()`, `errorHandler.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (3 nodes): `isAppError()`, `toAppError()`, `errorHandler.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `UnauthorizedError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `ValidationError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `ConflictError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `ForbiddenError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `AppError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `Community 10` to `Community 4`, `Community 5`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `ValidationError` connect `Community 7` to `Community 4`, `Community 5`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `NotFoundError` connect `Community 4` to `Community 5`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `AppError`, `ValidationError`, `NotFoundError` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._