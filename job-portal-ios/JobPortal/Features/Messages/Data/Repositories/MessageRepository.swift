import FirebaseAuth
import FirebaseFirestore
import FirebaseFunctions
import Foundation

final class MessageRepository {
    static let shared = MessageRepository()
    private init() {}

    private let collection = Firestore.firestore().collection("messages")
    private lazy var acceptMessageFn = Functions.functions().httpsCallable("acceptMessage")
    private lazy var rejectMessageFn = Functions.functions().httpsCallable("rejectMessage")

    func sendMessage(to recipientId: String, subject: String, body: String) async throws {
        guard let senderId = Auth.auth().currentUser?.uid else {
            throw MessageRepositoryError.unauthenticated
        }
        do {
            try await collection.addDocument(data: [
                "fromUserId": senderId,
                "toUserId":   recipientId,
                "subject":    subject,
                "body":       body,
                "status":     Message.Status.sent.rawValue,
                "createdAt":  Timestamp(date: .now)
            ])
        } catch {
            throw MessageRepositoryError(error)
        }
    }

    // Caller must store the returned registration and call .remove() on deinit.
    @discardableResult
    func listenToMessages(
        handler: @escaping (Result<[Message], MessageRepositoryError>) -> Void
    ) throws -> ListenerRegistration {
        guard let uid = Auth.auth().currentUser?.uid else {
            throw MessageRepositoryError.unauthenticated
        }
        return collection
            .whereField("toUserId", isEqualTo: uid)
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { snapshot, error in
                if let error {
                    handler(.failure(MessageRepositoryError(error)))
                    return
                }
                handler(.success(snapshot?.documents.compactMap(Self.map) ?? []))
            }
    }

    // Returns the newly created conversationId on success.
    func acceptMessage(_ id: String) async throws -> String? {
        do {
            let result = try await acceptMessageFn.call(["messageId": id])
            let data = result.data as? [String: Any]
            return data?["conversationId"] as? String ?? nil
        } catch {
            throw MessageRepositoryError(error)
        }
    }

    func rejectMessage(_ id: String, reason: String) async throws {
        do {
            _ = try await rejectMessageFn.call(["messageId": id, "reason": reason])
        } catch {
            throw MessageRepositoryError(error)
        }
    }

    private static func map(_ doc: QueryDocumentSnapshot) -> Message? {
        let d = doc.data()
        guard
            let fromUserId = d["fromUserId"] as? String,
            let toUserId   = d["toUserId"]   as? String
        else { return nil }
        return Message(
            id:          doc.documentID,
            fromUserId:  fromUserId,
            toUserId:    toUserId,
            subject:     d["subject"] as? String ?? "",
            body:        d["body"]    as? String ?? "",
            status:      Message.Status(rawValue: d["status"] as? String ?? "") ?? .waiting,
            createdAt:   (d["createdAt"] as? Timestamp)?.dateValue() ?? .now
        )
    }
}

enum MessageRepositoryError: LocalizedError {
    case unauthenticated, offline, notFound, unknown(String)

    init(_ error: Error) {
        let nsError = error as NSError
        if nsError.domain == FunctionsErrorDomain {
            switch FunctionsErrorCode(rawValue: nsError.code) {
            case .unauthenticated:          self = .unauthenticated
            case .unavailable:              self = .offline
            case .notFound:                 self = .notFound
            default:                        self = .unknown(error.localizedDescription)
            }
        } else {
            switch FirestoreErrorCode(rawValue: nsError.code) {
            case .unavailable, .deadlineExceeded: self = .offline
            case .notFound:                       self = .notFound
            default:                              self = .unknown(error.localizedDescription)
            }
        }
    }

    var errorDescription: String? {
        switch self {
        case .unauthenticated: return "You must be signed in to use messages."
        case .offline:         return "You appear to be offline. Messages will sync when reconnected."
        case .notFound:        return "Message not found."
        case .unknown(let m):  return m
        }
    }
}
