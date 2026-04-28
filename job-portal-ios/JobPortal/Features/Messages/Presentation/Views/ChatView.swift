import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel: ChatViewModel

    init(viewModel: ChatViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        VStack(spacing: 0) {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
                    .padding(.top, 8)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.messages) { message in
                            HStack {
                                if message.isFromCurrentUser { Spacer(minLength: 48) }
                                VStack(
                                    alignment: message.isFromCurrentUser ? .trailing : .leading,
                                    spacing: 4
                                ) {
                                    Text(message.text)
                                        .padding(12)
                                        .background(message.isFromCurrentUser ? Color.blue : Color(.systemGray5))
                                        .foregroundStyle(message.isFromCurrentUser ? .white : .primary)
                                        .clipShape(RoundedRectangle(cornerRadius: 16))
                                    Text(message.isFromCurrentUser ? (message.readBy.count > 1 ? "Read" : "Sent") : "")
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                }
                                if !message.isFromCurrentUser { Spacer(minLength: 48) }
                            }
                            .id(message.id)
                            .padding(.horizontal)
                        }
                    }
                    .padding(.vertical)
                }
                .onAppear {
                    viewModel.startListening()
                    scrollToBottom(with: proxy, animated: false)
                }
                .onChange(of: viewModel.messages.last?.id) { _, _ in
                    scrollToBottom(with: proxy, animated: true)
                }
            }

            HStack(spacing: 12) {
                TextField("Type a message", text: $viewModel.draftMessage, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)

                Button {
                    Task { await viewModel.sendMessage() }
                } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.headline)
                        .frame(width: 40, height: 40)
                        .background(Color.blue)
                        .foregroundStyle(.white)
                        .clipShape(Circle())
                }
                .disabled(viewModel.draftMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .navigationTitle("Chat")
    }

    private func scrollToBottom(with proxy: ScrollViewProxy, animated: Bool) {
        guard let lastMessageId = viewModel.messages.last?.id else { return }
        let action = { proxy.scrollTo(lastMessageId, anchor: .bottom) }
        animated ? withAnimation(.easeOut(duration: 0.2), action) : action()
    }
}

#Preview {
    NavigationStack {
        ChatView(viewModel: ChatViewModel(conversationId: "preview-chat"))
    }
}
