import SwiftUI

struct SignupView: View {
    @StateObject private var viewModel: SignupViewModel

    init(viewModel: SignupViewModel = SignupViewModel()) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        Form {
            Section {
                TextField("Full Name", text: $viewModel.name)
                    .textContentType(.name)

                TextField("Email", text: $viewModel.email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                SecureField("Password", text: $viewModel.password)
                    .textContentType(.newPassword)

                SecureField("Confirm Password", text: $viewModel.confirmPassword)
                    .textContentType(.newPassword)

                Picker("Role", selection: $viewModel.selectedRole) {
                    ForEach(SignupViewModel.Role.allCases) { role in
                        Text(role.rawValue).tag(role)
                    }
                }
            }

            if let errorMessage = viewModel.errorMessage {
                Section {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button {
                    Task { await viewModel.signup() }
                } label: {
                    HStack {
                        Spacer()
                        if viewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Text("Create Account")
                                .fontWeight(.semibold)
                        }
                        Spacer()
                    }
                }
                .disabled(viewModel.isLoading)
                .listRowBackground(Color.blue)
                .foregroundStyle(.white)
            }
        }
        .navigationTitle("Sign Up")
    }
}

#Preview {
    NavigationStack {
        SignupView()
    }
}
