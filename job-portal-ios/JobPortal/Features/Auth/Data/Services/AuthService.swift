import FirebaseAuth
import Foundation

final class AuthService {
    static let shared = AuthService()
    private init() {}

    private let auth = Auth.auth()

    func login(email: String, password: String) async throws -> User {
        do {
            let result = try await auth.signIn(withEmail: email, password: password)
            return try buildUser(from: result.user)
        } catch let e as NSError {
            throw AuthServiceError(e)
        }
    }

    func signup(email: String, password: String, name: String, role: User.Role) async throws -> User {
        do {
            let result = try await auth.createUser(withEmail: email, password: password)
            let req = result.user.createProfileChangeRequest()
            req.displayName = name
            try await req.commitChanges()
            saveRole(role, uid: result.user.uid)
            return User(uid: result.user.uid, email: email, name: name, role: role)

        } catch let e as NSError {
            throw AuthServiceError(e)
        }
    }

    func logout() throws {
        do {
            try auth.signOut()
        } catch let e as NSError {
            throw AuthServiceError(e)
        }
    }

    func getCurrentUser() -> User? {
        guard let user = auth.currentUser else { return nil }
        return try? buildUser(from: user)
    }

    private func buildUser(from user: FirebaseAuth.User) throws -> User {
        guard let email = user.email else { throw AuthServiceError.unknown("Account has no email.") }
        let roleRaw = UserDefaults.standard.string(forKey: roleKey(user.uid))
        return User(
            uid: user.uid,
            email: email,
            name: user.displayName ?? "",
            role: User.Role.fromFirestore(roleRaw)
        )
    }

    private func saveRole(_ role: User.Role, uid: String) {
        UserDefaults.standard.set(role.rawValue, forKey: roleKey(uid))
    }

    private func roleKey(_ uid: String) -> String { "role_\(uid)" }
}

enum AuthServiceError: LocalizedError {
    case invalidCredentials
    case emailAlreadyInUse
    case weakPassword
    case networkError
    case userDisabled
    case tooManyRequests
    case unknown(String)

    init(_ error: NSError) {
        switch AuthErrorCode(rawValue: error.code) {
        case .wrongPassword, .invalidEmail, .userNotFound, .invalidCredential:
            self = .invalidCredentials
        case .emailAlreadyInUse:
            self = .emailAlreadyInUse
        case .weakPassword:
            self = .weakPassword
        case .networkError:
            self = .networkError
        case .userDisabled:
            self = .userDisabled
        case .tooManyRequests:
            self = .tooManyRequests
        default:
            self = .unknown(error.localizedDescription)
        }
    }

    var errorDescription: String? {
        switch self {
        case .invalidCredentials:   return "Invalid email or password."
        case .emailAlreadyInUse:    return "An account with this email already exists."
        case .weakPassword:         return "Password must be at least 6 characters."
        case .networkError:         return "Network error. Please check your connection."
        case .userDisabled:         return "This account has been disabled. Please contact support."
        case .tooManyRequests:      return "Too many attempts. Please wait a moment and try again."
        case .unknown(let msg):     return msg
        }
    }
}
