import SwiftUI

struct LoginView<SignupDestination: View>: View {
    @StateObject private var viewModel: LoginViewModel
    private let signupDestination: SignupDestination

    init(
        viewModel: LoginViewModel = LoginViewModel(),
        @ViewBuilder signupDestination: () -> SignupDestination
    ) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.signupDestination = signupDestination()
    }

    var body: some View {
        Form {
            Section {
                TextField("Email", text: $viewModel.email)
                    .keyboardType(.emailAddress)
                    .textContentType(.username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                SecureField("Password", text: $viewModel.password)
                    .textContentType(.password)
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
                    Task { await viewModel.login() }
                } label: {
                    HStack {
                        Spacer()
                        if viewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Text("Login")
                                .fontWeight(.semibold)
                        }
                        Spacer()
                    }
                }
                .disabled(viewModel.isLoading)
                .listRowBackground(Color.blue)
                .foregroundStyle(.white)
            }

            Section {
                HStack {
                    Text("Don't have an account?")
                    Spacer()
                    NavigationLink("Sign Up", destination: signupDestination)
                }
                .font(.footnote)
            }
        }
        .navigationTitle("Login")
    }
}

extension LoginView where SignupDestination == EmptyView {
    init(viewModel: LoginViewModel = LoginViewModel()) {
        self.init(viewModel: viewModel) { EmptyView() }
    }
}

#Preview {
    NavigationStack {
        LoginView {
            Text("Sign Up")
        }
    }
}
