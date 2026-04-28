import UIKit
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore
import FirebaseMessaging
import UserNotifications

final class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        FirebaseApp.configure()

        UNUserNotificationCenter.current().delegate = self
        Messaging.messaging().delegate = self

        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }

        return true
    }

    // APNs hands us a device token — forward it to Firebase Messaging so it
    // can exchange it for an FCM registration token.
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        // Simulators always fail — suppress the log noise in that environment.
        #if !targetEnvironment(simulator)
        print("[FCM] APNs registration failed: \(error.localizedDescription)")
        #endif
    }
}

// MARK: – MessagingDelegate

extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        saveFCMToken(token)
    }
}

// MARK: – UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {
    // Show notifications as banners even when the app is foregrounded.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }
}

// MARK: – Firestore token persistence

private extension AppDelegate {
    func saveFCMToken(_ token: String) {
        guard let uid = Auth.auth().currentUser?.uid else {
            // User not signed in yet. Auth state listener in JobPortalApp will
            // call this again after sign-in.
            return
        }
        Firestore.firestore()
            .collection("users")
            .document(uid)
            .setData(["fcmToken": token, "fcmTokenUpdatedAt": Timestamp(date: Date())], merge: true)
    }
}
