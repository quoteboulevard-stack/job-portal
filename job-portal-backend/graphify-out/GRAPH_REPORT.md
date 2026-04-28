# Graph Report - job-portal-backend  (2026-04-27)

## Corpus Check
- 77 files · ~32,746 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 165 nodes · 230 edges · 26 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `get()` - 14 edges
2. `getFirestore()` - 12 edges
3. `buildTemplate()` - 8 edges
4. `userRef()` - 7 edges
5. `fulfillCredits()` - 6 edges
6. `fulfillCredits()` - 6 edges
7. `getStorage()` - 6 edges
8. `log()` - 6 edges
9. `log()` - 6 edges
10. `addCredits()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `fulfillCredits()` --calls--> `get()`  [INFERRED]
  functions/src/payments/razorpayWebhook.ts → functions/lib/shared/firebaseAdmin.js
- `fulfillCredits()` --calls--> `getFirestore()`  [INFERRED]
  functions/src/payments/razorpayWebhook.ts → functions/src/shared/firebaseAdmin.ts
- `getFirestore()` --calls--> `refundMessage()`  [INFERRED]
  functions/src/shared/firebaseAdmin.ts → functions/src/scheduled/refundExpiredMessages.ts
- `getFirestore()` --calls--> `userRef()`  [INFERRED]
  functions/src/shared/firebaseAdmin.ts → functions/src/credits/creditManager.ts
- `getFirestore()` --calls--> `addCredits()`  [INFERRED]
  functions/src/shared/firebaseAdmin.ts → functions/src/credits/creditManager.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.26
Nodes (10): assertAdmin(), formatTimestamp(), get(), getApp(), getAuth(), getFirestore(), getStorage(), fulfillCredits() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.51
Nodes (8): buildTemplate(), creditPurchased(), creditRefunded(), log(), messageAccepted(), messageReceived(), messageRejected(), sendEmailNotification()

### Community 2 - "Community 2"
Cohesion: 0.58
Nodes (7): archiveOldChats(), deleteAll(), deleteExpiredUploads(), deleteOldConversations(), deletePage(), deleteRejectedMessages(), log()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (7): addCredits(), checkCredits(), getCredits(), getTransactionHistory(), log(), txCollection(), userRef()

### Community 4 - "Community 4"
Cohesion: 0.67
Nodes (5): clearStaleToken(), getFcmToken(), log(), sendPushNotification(), sendPushNotificationToMany()

### Community 5 - "Community 5"
Cohesion: 0.53
Nodes (4): computeFitScore(), log(), logError(), saveError()

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (3): log(), notifyEmployerByEmail(), validateParticipants()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (4): fulfillCredits(), log(), sendReceipt(), verifySignature()

### Community 8 - "Community 8"
Cohesion: 0.6
Nodes (3): claudeReply(), ctx(), snap()

### Community 9 - "Community 9"
Cohesion: 0.6
Nodes (3): ctx(), makeChange(), userSnap()

### Community 10 - "Community 10"
Cohesion: 0.6
Nodes (3): analyzeWithClaude(), assertPremium(), log()

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (2): extractText(), parseWithClaude()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): extractText(), parseWithClaude()

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (3): log(), requireString(), sanitiseList()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): InsufficientCreditsError, log()

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (2): clearCollection(), get()

### Community 16 - "Community 16"
Cohesion: 0.83
Nodes (2): isBlank(), validate()

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (2): log(), refundMessage()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (2): log(), notifyJobSeeker()

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (2): log(), notifyJobSeeker()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (2): log(), sendRefundEmail()

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (1): log()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (1): log()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (1): log()

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (1): log()

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): log()

## Knowledge Gaps
- **Thin community `Community 11`** (5 nodes): `parseJD.js`, `extractText()`, `parseWithClaude()`, `saveError()`, `parseJD.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (5 nodes): `parseResume.js`, `extractText()`, `parseWithClaude()`, `saveError()`, `parseResume.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (5 nodes): `InsufficientCreditsError`, `.constructor()`, `log()`, `deductCredit.js`, `deductCredit.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (4 nodes): `clearCollection()`, `get()`, `seed()`, `integration.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `validateEnv.js`, `validateEnv.ts`, `isBlank()`, `validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (4 nodes): `refundExpiredMessages.js`, `log()`, `refundMessage()`, `refundExpiredMessages.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (4 nodes): `rejectMessage.js`, `log()`, `notifyJobSeeker()`, `rejectMessage.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (4 nodes): `log()`, `notifyJobSeeker()`, `acceptMessage.js`, `acceptMessage.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `refundCredit.js`, `log()`, `sendRefundEmail()`, `refundCredit.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (3 nodes): `setUserRole.js`, `log()`, `setUserRole.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (3 nodes): `log()`, `createApplication.js`, `createApplication.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (3 nodes): `updateApplicationStatus.js`, `updateApplicationStatus.ts`, `log()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `markMessageSeen.js`, `log()`, `markMessageSeen.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `sendChatMessage.js`, `log()`, `sendChatMessage.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get()` connect `Community 0` to `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `getFirestore()` connect `Community 0` to `Community 17`, `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `refundMessage()` connect `Community 17` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `get()` (e.g. with `fulfillCredits()` and `fulfillCredits()`) actually correct?**
  _`get()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getFirestore()` (e.g. with `fulfillCredits()` and `fulfillCredits()`) actually correct?**
  _`getFirestore()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `fulfillCredits()` (e.g. with `get()` and `getFirestore()`) actually correct?**
  _`fulfillCredits()` has 2 INFERRED edges - model-reasoned connections that need verification._