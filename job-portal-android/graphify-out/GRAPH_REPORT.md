# Graph Report - job-portal-android  (2026-04-27)

## Corpus Check
- 51 files · ~11,717 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 259 nodes · 208 edges · 33 communities detected
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `PostJobViewModel` - 11 edges
2. `MessageRepository` - 9 edges
3. `AuthRepository` - 9 edges
4. `SignupViewModel` - 9 edges
5. `JobRepository` - 8 edges
6. `JobListViewModel` - 7 edges
7. `LoginViewModel` - 6 edges
8. `ProfileViewModel` - 6 edges
9. `JobDetailViewModel` - 6 edges
10. `FirebaseModule` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (4): Error, MessageRepository, MessageResult, Success

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (4): AuthRepository, AuthResult, Error, Success

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (2): PostJobUiState, PostJobViewModel

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (4): Error, JobRepository, JobResult, Success

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (2): SignupUiState, SignupViewModel

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (4): ApplicationRepository, ApplicationResult, Error, Success

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (2): JobListUiState, JobListViewModel

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (5): CreditRepository, CreditResult, CreditSummary, Error, Success

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (2): LoginUiState, LoginViewModel

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (5): CacheEntry, DashboardRepository, DashboardResult, Error, Success

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (4): Error, ProfileRepository, ProfileResult, Success

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (2): ProfileUiState, ProfileViewModel

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (2): JobDetailUiState, JobDetailViewModel

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (2): MessageRequestsUiState, MessageRequestsViewModel

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (1): FirebaseModule

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): AppRoute, MainActivity, NavItem

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (2): ChatUiState, ChatViewModel

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (2): EmployerApplicantsUiState, EmployerApplicantsViewModel

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (2): CreditShopUiState, CreditShopViewModel

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (2): ApplicationTrackerUiState, ApplicationTrackerViewModel

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (2): ConversationListUiState, ConversationListViewModel

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (2): SessionUiState, SessionViewModel

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (3): ChartEntry, DashboardData, DashboardStats

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (2): DashboardUiState, DashboardViewModel

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (3): EmploymentType, Job, WorkMode

### Community 29 - "Community 29"
Cohesion: 0.5
Nodes (2): SavedJobsUiState, SavedJobsViewModel

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (2): Conversation, Message

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (2): User, UserRole

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (2): Application, ApplicationStatus

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): JobPortalApplication

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): MessageRequest

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Profile

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): CreditPackage

## Knowledge Gaps
- **56 isolated node(s):** `AppRoute`, `NavItem`, `JobPortalApplication`, `MessageResult`, `Success` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 2`** (13 nodes): `PostJobViewModel.kt`, `PostJobUiState`, `PostJobViewModel`, `.consumePostedJob()`, `.onCompanyChanged()`, `.onDescriptionChanged()`, `.onEmploymentTypeChanged()`, `.onLocationChanged()`, `.onSalaryChanged()`, `.onTagsChanged()`, `.onTitleChanged()`, `.onWorkModeChanged()`, `.submit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (11 nodes): `SignupViewModel.kt`, `SignupUiState`, `SignupViewModel`, `.consumeSignupSuccess()`, `.onConfirmChanged()`, `.onEmailChanged()`, `.onNameChanged()`, `.onPasswordChanged()`, `.onRoleChanged()`, `.signup()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (9 nodes): `JobListViewModel.kt`, `JobListUiState`, `JobListViewModel`, `.fetch()`, `.loadNextPage()`, `.onQueryChanged()`, `.onSearch()`, `.onWorkModeSelected()`, `.refresh()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (8 nodes): `LoginViewModel.kt`, `LoginUiState`, `LoginViewModel`, `.consumeLoginSuccess()`, `.login()`, `.onEmailChanged()`, `.onPasswordChanged()`, `.setError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (8 nodes): `ProfileViewModel.kt`, `ProfileUiState`, `ProfileViewModel`, `.onDisplayNameChanged()`, `.onSkillsChanged()`, `.refresh()`, `.save()`, `.uploadResume()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (8 nodes): `JobDetailViewModel.kt`, `JobDetailUiState`, `JobDetailViewModel`, `.apply()`, `.isSaved()`, `.loadJob()`, `.loadSkills()`, `.toggleSave()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (7 nodes): `MessageRequestsViewModel.kt`, `MessageRequestsUiState`, `MessageRequestsViewModel`, `.accept()`, `.consumeOpenedConversation()`, `.refresh()`, `.reject()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (6 nodes): `FirebaseModule.kt`, `FirebaseModule`, `.provideFirebaseAuth()`, `.provideFirestore()`, `.provideFunctions()`, `.provideStorage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (6 nodes): `ChatViewModel.kt`, `ChatUiState`, `ChatViewModel`, `.markAsRead()`, `.onInputChanged()`, `.sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (6 nodes): `EmployerApplicantsViewModel.kt`, `EmployerApplicantsUiState`, `EmployerApplicantsViewModel`, `.onStatusSelected()`, `.refresh()`, `.updateStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (6 nodes): `CreditShopViewModel.kt`, `CreditShopUiState`, `CreditShopViewModel`, `.loadCredits()`, `.selectPackage()`, `.startCheckout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (5 nodes): `ApplicationTrackerViewModel.kt`, `ApplicationTrackerUiState`, `ApplicationTrackerViewModel`, `.onStatusSelected()`, `.refresh()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `ConversationListViewModel.kt`, `ConversationListUiState`, `ConversationListViewModel`, `.observeConversations()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (4 nodes): `SessionViewModel.kt`, `SessionUiState`, `SessionViewModel`, `.refresh()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (4 nodes): `DashboardViewModel.kt`, `DashboardUiState`, `DashboardViewModel`, `.loadDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (4 nodes): `SavedJobsViewModel.kt`, `SavedJobsUiState`, `SavedJobsViewModel`, `.loadSavedJobs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (3 nodes): `Message.kt`, `Conversation`, `Message`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `User.kt`, `User`, `UserRole`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `Application.kt`, `Application`, `ApplicationStatus`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `JobPortalApplication.kt`, `JobPortalApplication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `MessageRequest.kt`, `MessageRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `Profile.kt`, `Profile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `CreditPackage.kt`, `CreditPackage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `AppRoute`, `NavItem`, `JobPortalApplication` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._