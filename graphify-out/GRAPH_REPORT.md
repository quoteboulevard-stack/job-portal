# Graph Report - 1  (2026-04-27)

## Corpus Check
- 269 files · ~77,888 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 820 nodes · 876 edges · 48 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 66|Community 66]]

## God Nodes (most connected - your core abstractions)
1. `MessageRepository` - 15 edges
2. `get()` - 14 edges
3. `AuthServiceError` - 13 edges
4. `getFirestore()` - 12 edges
5. `SignupViewModel` - 12 edges
6. `JobRepository` - 12 edges
7. `JobListViewModel` - 11 edges
8. `ChatViewModel` - 10 edges
9. `PostJobViewModel` - 10 edges
10. `setStatus()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `verifySignature()` --calls--> `update()`  [INFERRED]
  job-portal-backend/functions/src/payments/razorpayWebhook.ts → job-portal-web/src/features/employer/pages/EmployerPostJobPage.tsx
- `logError()` --calls--> `Error`  [INFERRED]
  job-portal-backend/functions/src/ai/fitScore.ts → job-portal-android/app/src/main/java/com/jobportal/features/credits/data/repository/CreditRepository.kt
- `validateParticipants()` --calls--> `all`  [INFERRED]
  job-portal-backend/functions/src/messaging/sendMessage.ts → job-portal-ios/JobPortal/Features/Jobs/Presentation/ViewModels/JobListViewModel.swift
- `fail()` --calls--> `Error`  [INFERRED]
  job-portal-backend/functions/lib/messaging/sendMessage.js → job-portal-android/app/src/main/java/com/jobportal/features/credits/data/repository/CreditRepository.kt
- `sendPushNotification()` --calls--> `Error`  [INFERRED]
  job-portal-backend/functions/src/notifications/pushNotification.ts → job-portal-android/app/src/main/java/com/jobportal/features/credits/data/repository/CreditRepository.kt

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (29): remove(), remove(), remove(), deleteApplication(), deleteJob(), deleteMessage(), listAllUsers(), updateUserRole() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (27): CaseIterable, ChartEntry, DashboardData, DashboardStats, FitScoreBin, SkillStat, Stats, FitScoreBin (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (9): DashboardUiState, DashboardViewModel, JobListUiState, JobListViewModel, LoginUiState, LoginViewModel, ObservableObject, SignupUiState (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (24): purchaseCredits(), callAcceptMessage(), callCreateCreditCheckoutSession(), callRejectMessage(), callRequestMessage(), updateParams(), fetchJobById(), fetchJobs() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (19): mockDocs(), archiveOldChats(), deleteAll(), deleteExpiredUploads(), deleteOldConversations(), deletePage(), deleteRejectedMessages(), log() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (20): assertAdmin(), addCredits(), checkCredits(), getCredits(), getTransactionHistory(), log(), txCollection(), userRef() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (14): AuthService, AuthServiceError, emailAlreadyInUse, invalidCredentials, networkError, tooManyRequests, unknown, userDisabled (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (16): CreditRepository, CreditResult, CreditSummary, Error, Success, buildTemplate(), creditPurchased(), creditRefunded() (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (9): Error, MessageRepository, MessageRepositoryError, notFound, offline, unauthenticated, unknown, MessageResult (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (12): submit(), ChatUiState, ChatViewModel, Message, Conversation, Message, Status, accepted (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (16): submit(), update(), computeFitScore(), log(), logError(), saveError(), createJob(), clearStaleToken() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (7): ChatView, DashboardView, JobDetailView, JobListView, LoginView, SignupView, View

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (10): CacheEntry, DashboardRepository, DashboardRepositoryError, network, unauthenticated, unknown, DashboardResult, Error (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (8): Error, JobRepository, JobRepositoryError, network, notFound, unknown, JobResult, Success

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (7): fetchUserProfile(), login(), updateUserProfile(), Error, ProfileRepository, ProfileResult, Success

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (7): HomeRedirect(), DashboardPage(), EmployerDashboard(), LoginPage(), SignupPage(), useAuth(), useDashboard()

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (8): AppError, ConflictError, ForbiddenError, isAppError(), NotFoundError, toAppError(), UnauthorizedError, ValidationError

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (4): AuthRepository, AuthResult, Error, Success

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (2): PostJobUiState, PostJobViewModel

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (2): formatCurrency(), initials()

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (4): ApplicationRepository, ApplicationResult, Error, Success

### Community 21 - "Community 21"
Cohesion: 0.28
Nodes (4): closeMenus(), getItems(), handleNavigation(), onKeyDown()

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (2): ProfileUiState, ProfileViewModel

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (2): MessageRequestsUiState, MessageRequestsViewModel

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (1): FirebaseModule

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (3): AppRoute, MainActivity, NavItem

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (2): EmployerApplicantsUiState, EmployerApplicantsViewModel

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (2): CreditShopUiState, CreditShopViewModel

### Community 29 - "Community 29"
Cohesion: 0.6
Nodes (3): claudeReply(), ctx(), snap()

### Community 30 - "Community 30"
Cohesion: 0.6
Nodes (3): ctx(), makeChange(), userSnap()

### Community 31 - "Community 31"
Cohesion: 0.6
Nodes (3): analyzeWithClaude(), assertPremium(), log()

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (2): extractText(), parseWithClaude()

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (2): InsufficientCreditsError, log()

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (2): extractText(), parseWithClaude()

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (2): ApplicationTrackerUiState, ApplicationTrackerViewModel

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (2): log(), notifyJobSeeker()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (2): log(), sendRefundEmail()

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (2): log(), notifyJobSeeker()

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (2): ConversationListUiState, ConversationListViewModel

### Community 40 - "Community 40"
Cohesion: 0.5
Nodes (2): SessionUiState, SessionViewModel

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (2): SavedJobsUiState, SavedJobsViewModel

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (2): FilterModal(), useFocusTrap()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (2): Application, ApplicationStatus

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (2): next(), submit()

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): JobPortalApplication

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): MessageRequest

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Profile

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): CreditPackage

## Knowledge Gaps
- **81 isolated node(s):** `AppRoute`, `NavItem`, `JobPortalApplication`, `MessageResult`, `Success` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (12 nodes): `PostJobViewModel.kt`, `PostJobUiState`, `PostJobViewModel`, `.consumePostedJob()`, `.onCompanyChanged()`, `.onDescriptionChanged()`, `.onJobTypeChanged()`, `.onLocationChanged()`, `.onSalaryChanged()`, `.onTagsChanged()`, `.onTitleChanged()`, `.submit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (12 nodes): `calculateDaysSince()`, `formatCurrency()`, `formatDate()`, `formatPercentage()`, `formatPhone()`, `formatRelativeDate()`, `formatShortDate()`, `getDaysUntilExpiry()`, `initials()`, `truncate()`, `formatters.ts`, `formatters.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (8 nodes): `ProfileViewModel.kt`, `ProfileUiState`, `ProfileViewModel`, `.onDisplayNameChanged()`, `.onSkillsChanged()`, `.refresh()`, `.save()`, `.uploadResume()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (7 nodes): `MessageRequestsViewModel.kt`, `MessageRequestsUiState`, `MessageRequestsViewModel`, `.accept()`, `.consumeOpenedConversation()`, `.refresh()`, `.reject()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (6 nodes): `FirebaseModule`, `.provideFirebaseAuth()`, `.provideFirestore()`, `.provideFunctions()`, `.provideStorage()`, `FirebaseModule.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (6 nodes): `EmployerApplicantsUiState`, `EmployerApplicantsViewModel`, `.onStatusSelected()`, `.refresh()`, `.updateStatus()`, `EmployerApplicantsViewModel.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (6 nodes): `CreditShopUiState`, `CreditShopViewModel`, `.loadCredits()`, `.selectPackage()`, `.startCheckout()`, `CreditShopViewModel.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (5 nodes): `parseResume.js`, `parseResume.ts`, `extractText()`, `parseWithClaude()`, `saveError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (5 nodes): `InsufficientCreditsError`, `.constructor()`, `log()`, `deductCredit.js`, `deductCredit.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (5 nodes): `parseJD.js`, `parseJD.ts`, `extractText()`, `parseWithClaude()`, `saveError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `ApplicationTrackerUiState`, `ApplicationTrackerViewModel`, `.onStatusSelected()`, `.refresh()`, `ApplicationTrackerViewModel.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (4 nodes): `rejectMessage.js`, `rejectMessage.ts`, `log()`, `notifyJobSeeker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (4 nodes): `refundCredit.js`, `refundCredit.ts`, `log()`, `sendRefundEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (4 nodes): `log()`, `notifyJobSeeker()`, `acceptMessage.js`, `acceptMessage.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `ConversationListUiState`, `ConversationListViewModel`, `.observeConversations()`, `ConversationListViewModel.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (4 nodes): `SessionViewModel.kt`, `SessionUiState`, `SessionViewModel`, `.refresh()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (4 nodes): `SavedJobsViewModel.kt`, `SavedJobsUiState`, `SavedJobsViewModel`, `.loadSavedJobs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `FilterModal()`, `FilterModal.tsx`, `useFocusTrap.ts`, `useFocusTrap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `Application`, `ApplicationStatus`, `Application.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `SignupForm.tsx`, `next()`, `submit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `JobPortalApplication.kt`, `JobPortalApplication`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `MessageRequest.kt`, `MessageRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `Profile.kt`, `Profile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `CreditPackage`, `CreditPackage.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Mode` connect `Community 1` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `all` connect `Community 4` to `Community 1`, `Community 10`, `Community 3`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `String` (e.g. with `toAppError()` and `normalizeMessageStatus()`) actually correct?**
  _`String` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `get()` (e.g. with `fulfillCredits()` and `fulfillCredits()`) actually correct?**
  _`get()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getFirestore()` (e.g. with `fulfillCredits()` and `fulfillCredits()`) actually correct?**
  _`getFirestore()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AppRoute`, `NavItem`, `JobPortalApplication` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._