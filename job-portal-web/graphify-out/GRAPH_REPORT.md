# Graph Report - job-portal-web  (2026-04-27)

## Corpus Check
- 126 files · ~25,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 268 nodes · 200 edges · 10 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `setStatus()` - 9 edges
2. `mapJob()` - 7 edges
3. `useAuth()` - 6 edges
4. `formatTimestamp()` - 4 edges
5. `mapMessageRequest()` - 4 edges
6. `load()` - 4 edges
7. `listMessageRequestsForUser()` - 3 edges
8. `listPendingEmployerMessages()` - 3 edges
9. `acceptMessageRequest()` - 3 edges
10. `rejectMessageRequest()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `HomeRedirect()` --calls--> `useAuth()`  [INFERRED]
  src/App.tsx → src/features/auth/hooks/useAuth.ts
- `useAuth()` --calls--> `LoginPage()`  [INFERRED]
  src/features/auth/hooks/useAuth.ts → src/features/auth/pages/LoginPage.tsx
- `useAuth()` --calls--> `SignupPage()`  [INFERRED]
  src/features/auth/hooks/useAuth.ts → src/features/auth/pages/SignupPage.tsx
- `saveProfile()` --calls--> `setStatus()`  [INFERRED]
  src/features/auth/pages/ProfilePage.tsx → src/features/employer/pages/EmployerApplicantsPage.tsx
- `uploadResume()` --calls--> `setStatus()`  [INFERRED]
  src/features/auth/pages/ProfilePage.tsx → src/features/employer/pages/EmployerApplicantsPage.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (20): accept(), load(), reject(), callAcceptMessage(), callMarkMessageSeen(), callRejectMessage(), callRequestMessage(), callSendChatMessage() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (10): remove(), remove(), remove(), deleteApplication(), deleteJob(), deleteMessage(), listAllUsers(), updateUserRole() (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (14): createApplication(), formatDate(), listApplicantsForEmployer(), mapApplication(), normalizeStatus(), updateApplicationStatus(), purchase(), load() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (7): HomeRedirect(), DashboardPage(), EmployerDashboard(), LoginPage(), SignupPage(), useAuth(), useDashboard()

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (10): submit(), callCreateJob(), createJob(), fetchJobById(), mapJob(), toEmploymentType(), toExperience(), toSalaryText() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (6): fetchUserProfile(), login(), updateUserProfile(), saveProfile(), uploadResume(), uploadResumeFile()

### Community 6 - "Community 6"
Cohesion: 0.28
Nodes (4): closeMenus(), getItems(), handleNavigation(), onKeyDown()

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (2): getJobSeekerDashboard(), scoreBuckets()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): purchaseCredits(), callCreateCreditCheckoutSession()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): next(), submit()

## Knowledge Gaps
- **Thin community `Community 8`** (4 nodes): `getEmployerDashboard()`, `getJobSeekerDashboard()`, `scoreBuckets()`, `dashboardService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (4 nodes): `fetchCreditSummary()`, `purchaseCredits()`, `callCreateCreditCheckoutSession()`, `creditService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (3 nodes): `next()`, `submit()`, `SignupForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setStatus()` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `callUpdateApplicationStatus()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `setStatus()` (e.g. with `saveProfile()` and `uploadResume()`) actually correct?**
  _`setStatus()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `useAuth()` (e.g. with `HomeRedirect()` and `LoginPage()`) actually correct?**
  _`useAuth()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._