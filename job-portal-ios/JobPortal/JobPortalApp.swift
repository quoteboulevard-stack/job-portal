import SwiftUI
import FirebaseAuth
import FirebaseFirestore
import FirebaseMessaging

@main
struct JobPortalApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

// MARK: – Root routing

struct RootView: View {
    @StateObject private var authState = AuthState()

    var body: some View {
        if authState.isSignedIn {
            JobListView { job in
                Text(job.title)
            }
        } else {
            NavigationStack {
                LoginView {
                    SignupView()
                }
            }
        }
    }
}

// MARK: – Auth state observer

@MainActor
final class AuthState: ObservableObject {
    @Published private(set) var isSignedIn: Bool

    private var handle: AuthStateDidChangeListenerHandle?

    init() {
        isSignedIn = Auth.auth().currentUser != nil
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            guard let self else { return }
            self.isSignedIn = user != nil
            if let uid = user?.uid {
                // If an FCM token arrived before sign-in, upload it now.
                Task { await Self.syncFCMToken(uid: uid) }
            }
        }
    }

    deinit {
        if let handle { Auth.auth().removeStateDidChangeListener(handle) }
    }

    static func syncFCMToken(uid: String) async {
        guard let token = Messaging.messaging().fcmToken else { return }
        do {
            try await Firestore.firestore()
                .collection("users")
                .document(uid)
                .setData(["fcmToken": token, "fcmTokenUpdatedAt": Timestamp(date: Date())], merge: true)
        } catch {
            print("[FCM] Failed to sync token for user \(uid): \(error.localizedDescription)")
        }
    }
}
