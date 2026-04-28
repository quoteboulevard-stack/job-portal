import Foundation

@MainActor
final class SignupViewModel: ObservableObject {
    @Published var name = ""
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var selectedRole: User.Role = .jobSeeker
    @Published private(set) var errorMessage: String?
    @Published private(set) var isLoading = false

    func signup() async {
        guard !isLoading else { return }
        errorMessage = nil

        let trimmedName  = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedName.isEmpty else {
            errorMessage = "Please enter your full name."
            return
        }
        guard isValid(email: trimmedEmail) else {
            errorMessage = "Please enter a valid email address."
            return
        }
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters."
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match."
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            _ = try await AuthService.shared.signup(
                email: trimmedEmail,
                password: password,
                name: trimmedName,
                role: selectedRole
            )
            email = trimmedEmail
            name  = trimmedName
        } catch let e as AuthServiceError {
            errorMessage = e.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func isValid(email: String) -> Bool {
        let pattern = #"^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        return email.range(of: pattern, options: .regularExpression) != nil
    }
}
