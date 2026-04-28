# Graph Report - job-portal-ios  (2026-04-27)

## Corpus Check
- 22 files · ~4,541 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 176 nodes · 229 edges · 12 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `AuthServiceError` - 13 edges
2. `Status` - 10 edges
3. `AppDelegate` - 9 edges
4. `MessageRepositoryError` - 9 edges
5. `AuthService` - 9 edges
6. `JobRepositoryError` - 9 edges
7. `MessageRepository` - 8 edges
8. `EmploymentType` - 8 edges
9. `Mode` - 8 edges
10. `ChatViewModel` - 7 edges

## Surprising Connections (you probably didn't know these)
- `RootView` --inherits--> `View`  [EXTRACTED]
  JobPortal/JobPortalApp.swift →   _Bridges community 3 → community 2_
- `AuthState` --inherits--> `ObservableObject`  [EXTRACTED]
  JobPortal/JobPortalApp.swift →   _Bridges community 3 → community 8_
- `ChatViewModel` --inherits--> `ObservableObject`  [EXTRACTED]
  JobPortal/Features/Messages/Presentation/ViewModels/ChatViewModel.swift →   _Bridges community 8 → community 11_
- `JobListViewModel` --inherits--> `ObservableObject`  [EXTRACTED]
  JobPortal/Features/Jobs/Presentation/ViewModels/JobListViewModel.swift →   _Bridges community 8 → community 7_
- `MessageRepositoryError` --inherits--> `LocalizedError`  [EXTRACTED]
  JobPortal/Features/Messages/Data/Repositories/MessageRepository.swift →   _Bridges community 4 → community 5_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (22): CaseIterable, EmploymentType, contract, freelance, fulltime, internship, parttime, Job (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (10): AuthService, AuthServiceError, emailAlreadyInUse, invalidCredentials, networkError, tooManyRequests, unknown, userDisabled (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (7): ChatView, DashboardView, JobDetailView, JobListView, LoginView, SignupView, View

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (9): App, AppDelegate, AuthState, JobPortalApp, RootView, MessagingDelegate, NSObject, UIApplicationDelegate (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (6): MessageRepository, MessageRepositoryError, notFound, offline, unauthenticated, unknown

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (7): DashboardData, DashboardRepository, DashboardRepositoryError, network, unauthenticated, unknown, LocalizedError

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (5): JobRepository, JobRepositoryError, network, notFound, unknown

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (5): Hashable, Job, JobDetailViewModel, Job, JobListViewModel

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (4): DashboardViewModel, LoginViewModel, ObservableObject, SignupViewModel

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (9): Message, Status, accepted, expired, invalid, rejected, seen, sent (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (7): FitScoreBin, SkillStat, Stats, FitScoreBin, SkillStat, StatCard, Identifiable

### Community 11 - "Community 11"
Cohesion: 0.28
Nodes (2): ChatViewModel, Message

## Knowledge Gaps
- **39 isolated node(s):** `unauthenticated`, `offline`, `notFound`, `unknown`, `waiting` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (9 nodes): `ChatViewModel`, `.deinit()`, `.init()`, `.markUnreadMessagesAsRead()`, `.sendMessage()`, `.startListening()`, `Message`, `ChatViewModel.swift`, `.map()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthState` connect `Community 3` to `Community 8`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `Mode` connect `Community 0` to `Community 10`, `Community 7`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **Why does `RootView` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **What connects `unauthenticated`, `offline`, `notFound` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._