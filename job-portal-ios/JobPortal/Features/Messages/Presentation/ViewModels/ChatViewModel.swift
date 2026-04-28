import FirebaseAuth
import FirebaseFirestore
import FirebaseFunctions
import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    struct Message: Identifiable, Hashable {
        let id: String
        let text: String
        let senderId: String
        let sentAt: Date
        let readBy: [String]

        var isFromCurrentUser: Bool { senderId == Auth.auth().currentUser?.uid }
    }

    @Published var draftMessage = ""
    @Published private(set) var messages: [Message] = []
    @Published private(set) var isSending = false
    @Published private(set) var errorMessage: String?

    private let conversationId: String
    private let db = Firestore.firestore()
    private lazy var sendChatMessageFn = Functions.functions().httpsCallable("sendChatMessage")
    private var listener: ListenerRegistration?

    init(conversationId: String) {
        self.conversationId = conversationId
    }

    deinit {
        listener?.remove()
    }

    func startListening() {
        guard listener == nil else { return }
        listener = db
            .collection("conversations").document(conversationId)
            .collection("messages")
            .order(by: "sentAt")
            .addSnapshotListener { [weak self] snapshot, error in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    if let error {
                        self.errorMessage = error.localizedDescription
                        return
                    }
                    self.errorMessage = nil
                    self.messages = snapshot?.documents.compactMap { doc in
                        let data = doc.data()
                        return Message(
                            id: doc.documentID,
                            text: data["text"] as? String ?? "",
                            senderId: data["senderId"] as? String ?? "",
                            sentAt: (data["sentAt"] as? Timestamp)?.dateValue() ?? .now,
                            readBy: data["readBy"] as? [String] ?? []
                        )
                    } ?? []
                }
            }
    }

    func sendMessage() async {
        let text = draftMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isSending else { return }

        isSending = true
        defer { isSending = false }

        do {
            _ = try await sendChatMessageFn.call(["conversationId": conversationId, "text": text])
            draftMessage = ""
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
