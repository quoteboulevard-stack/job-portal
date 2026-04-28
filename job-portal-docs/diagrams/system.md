# System Diagrams

## High-Level Topology

```text
                           +----------------------+
                           |    Web Client        |
                           |   Next.js / TS       |
                           +----------+-----------+
                                      |
                           +----------v-----------+
                           |  Android / iOS       |
                           | Compose / SwiftUI    |
                           +----------+-----------+
                                      |
                                      v
                         +--------------------------+
                         | Firebase Client SDKs     |
                         +------------+-------------+
                                      |
          +---------------------------+---------------------------+
          |                           |                           |
          v                           v                           v
+------------------+       +------------------+       +------------------+
| Firebase Auth    |       | Cloud Firestore  |       | Firebase Storage |
| identity tokens  |       | system of record |       | uploaded files   |
+---------+--------+       +---------+--------+       +---------+--------+
          |                          |                            |
          +--------------------------+----------------------------+
                                     |
                                     v
                         +---------------------------+
                         | Firebase Cloud Functions  |
                         | trusted backend boundary  |
                         +-----+-----------+---------+
                               |           | 
                     +---------+           +------------------+
                     |                                        |
                     v                                        v
            +----------------+                      +-------------------+
            | Claude API     |                      | SendGrid          |
            | parsing / fit  |                      | transactional mail|
            +----------------+                      +-------------------+
                              
                                     +-------------------+
                                     | Stripe / Razorpay |
                                     | payments/webhooks |
                                     +-------------------+
```

## Core Business Flow

```text
Job Seeker / Employer Client
           |
           v
     Firestore documents
           |
           +--> direct reads for allowed data
           |
           +--> triggers / callable functions
                    |
                    v
            Cloud Functions
                    |
        +-----------+------------+------------------+
        |                        |                  |
        v                        v                  v
   validate state          enrich with AI      execute payments,
   enforce roles           parse documents      email, credits,
   manage lifecycle        compute fit          cleanup
```

## Messaging Flow

```text
Job seeker writes messages/{messageId}
                |
                v
       Firestore onCreate trigger
                |
                v
          sendMessage function
                |
     +----------+-----------+
     |                      |
     v                      v
validate sender/recipient   set status and expiry
     |                      |
     +----------+-----------+
                |
                v
       SendGrid email to employer
                |
                v
 Employer accepts or rejects message
                |
      +---------+----------+
      |                    |
      v                    v
acceptMessage()       rejectMessage()
      |                    |
      v                    v
create conversation    update rejection state
deduct or settle       enforce cooling-off rules
credits as needed
```

## Document and AI Flow

```text
Client uploads resume or JD file
                |
                v
         Firebase Storage
                |
                v
      Storage finalize trigger
                |
                v
     parseResume / parseJD function
                |
     +----------+-----------+
     |                      |
     v                      v
validate file         send content to Claude
type and size         for extraction
     |                      |
     +----------+-----------+
                |
                v
   write parsed metadata to Firestore
                |
                v
 application created in Firestore
                |
                v
         fitScore trigger runs
                |
                v
 compare resume + job metadata
 and update fit details
```

## Payment and Credits Flow

```text
Client starts payment
        |
        v
Stripe / Razorpay
        |
        v
Signed webhook -> Cloud Functions
        |
        v
verify signature and idempotency
        |
        v
update credits/{userId}
record transaction
send confirmation
```

## Trust Boundary Summary

```text
Untrusted zone:
- web client
- android client
- ios client

Partially trusted platform services:
- Firebase Auth
- Firestore
- Storage
- FCM

Trusted execution zone:
- Cloud Functions with Admin SDK

External integrations behind trusted zone:
- Claude API
- SendGrid
- Stripe
- Razorpay
```
