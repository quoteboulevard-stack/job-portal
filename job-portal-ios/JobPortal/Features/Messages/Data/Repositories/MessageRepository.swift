import FirebaseAuth
import FirebaseFirestore
import Foundation

final class MessageRepository {
    static let shared = MessageRepository()
    private init() {}

    private let collection = Firestore.firestore().collection("messages")

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
                    let code = FirestoreErrorCode(rawValue: (error as NSError).code)
                    handler(.failure(
                        (code == .unavailable || code == .deadlineExceeded)
                            ? .offline
                            : .unknown(error.localizedDescription)
                    ))
                    return
                }
                handler(.success(snapshot?.documents.compactMap(Self.map) ?? []))
            }
    }

    func acceptMessage(_ id: String) async throws {
        try await updateStatus(id: id, fields: ["status": Message.Status.accepted.rawValue])
    }

    func rejectMessage(_ id: String, reason: String) async throws {
        try await updateStatus(id: id, fields: [
            "status": Message.Status.rejected.rawValue,
            "rejectionReason": reason
        ])
    }

    private func updateStatus(id: String, fields: [String: Any]) async throws {
        do {
            try await collection.document(id).updateData(fields)
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
        switch FirestoreErrorCode(rawValue: (error as NSError).code) {
        case .unavailable, .deadlineExceeded: self = .offline
        case .notFound:                       self = .notFound
        default:                              self = .unknown(error.localizedDescription)
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
