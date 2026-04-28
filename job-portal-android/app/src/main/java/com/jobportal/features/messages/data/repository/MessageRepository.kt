package com.jobportal.features.messages.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.google.firebase.functions.FirebaseFunctions
import com.jobportal.features.messages.domain.model.Conversation
import com.jobportal.features.messages.domain.model.Message
import com.jobportal.features.messages.domain.model.MessageRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

sealed class MessageResult<out T> {
    data class Success<T>(val data: T) : MessageResult<T>()
    data class Error(val message: String) : MessageResult<Nothing>()
}

@Singleton
class MessageRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val functions: FirebaseFunctions
) {
    private val conversations get() = firestore.collection("conversations")

    suspend fun sendMessage(
        conversationId: String,
        text: String
    ): MessageResult<Unit> = runCatching {
        val trimmed = text.trim()
        require(trimmed.isNotEmpty()) { "Message cannot be empty" }

        functions
            .getHttpsCallable("sendChatMessage")
            .call(mapOf("conversationId" to conversationId, "text" to trimmed))
            .await()

        Unit
    }.fold(
        onSuccess = { MessageResult.Success(Unit) },
        onFailure = { MessageResult.Error(it.message ?: "Failed to send message") }
    )

    fun listenToMessages(conversationId: String): Flow<MessageResult<List<Message>>> =
        callbackFlow {
            var registration: ListenerRegistration? = null
            runCatching {
                registration = conversations.document(conversationId)
                    .collection("messages")
                    .orderBy("sentAt", Query.Direction.ASCENDING)
                    .addSnapshotListener { snapshot, error ->
                        if (error != null) {
                            trySend(MessageResult.Error(error.message ?: "Listener error"))
                            return@addSnapshotListener
                        }
                        val messages = snapshot?.documents?.mapNotNull { it.toMessage() } ?: emptyList()
                        trySend(MessageResult.Success(messages))
                    }
            }.onFailure {
                trySend(MessageResult.Error(it.message ?: "Failed to attach listener"))
            }
            awaitClose { registration?.remove() }
        }

    fun listenToConversations(userId: String, isEmployer: Boolean): Flow<MessageResult<List<Conversation>>> =
        callbackFlow {
            var registration: ListenerRegistration? = null
            val participantField = if (isEmployer) "employerId" else "jobSeekerId"
            runCatching {
                registration = conversations
                    .whereEqualTo(participantField, userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .addSnapshotListener { snapshot, error ->
                        if (error != null) {
                            trySend(MessageResult.Error(error.message ?: "Listener error"))
                            return@addSnapshotListener
                        }
                        val convos = snapshot?.documents?.mapNotNull { doc ->
                            runCatching {
                                Conversation(
                                    id = doc.id,
                                    jobSeekerId = doc.getString("jobSeekerId") ?: return@runCatching null,
                                    employerId = doc.getString("employerId") ?: return@runCatching null,
                                    status = doc.getString("status") ?: "active",
                                    messageId = doc.getString("messageId") ?: "",
                                    title = doc.getString("title") ?: doc.getString("roleLabel"),
                                    counterpartName = if (isEmployer) {
                                        doc.getString("jobSeekerName") ?: doc.getString("jobSeekerId")
                                    } else {
                                        doc.getString("employerName") ?: doc.getString("employerId")
                                    },
                                    lastMessage = doc.getString("lastMessage"),
                                    lastMessageAt = doc.getLong("lastMessageAt") ?: 0L
                                )
                            }.getOrNull()
                        } ?: emptyList()
                        trySend(MessageResult.Success(convos))
                    }
            }.onFailure {
                trySend(MessageResult.Error(it.message ?: "Failed to attach listener"))
            }
            awaitClose { registration?.remove() }
        }

    suspend fun fetchPendingMessageRequests(employerId: String): MessageResult<List<MessageRequest>> =
        runCatching {
            firestore.collection("messages")
                .whereEqualTo("toUserId", employerId)
                .get()
                .await()
                .documents
                .mapNotNull { doc ->
                    val status = doc.getString("status") ?: return@mapNotNull null
                    if (status.equals("accepted", true) || status.equals("rejected", true) || status.equals("expired", true)) {
                        return@mapNotNull null
                    }
                    MessageRequest(
                        id = doc.id,
                        fromUserId = doc.getString("fromUserId") ?: return@mapNotNull null,
                        toUserId = doc.getString("toUserId") ?: return@mapNotNull null,
                        fromName = doc.getString("fromName"),
                        toName = doc.getString("toName"),
                        subject = doc.getString("subject") ?: "Message request",
                        body = doc.getString("body") ?: "",
                        status = status,
                        createdAt = doc.getLong("createdAt") ?: 0L
                    )
                }
                .sortedByDescending { it.createdAt }
        }.fold(
            onSuccess = { MessageResult.Success(it) },
            onFailure = { MessageResult.Error(it.message ?: "Failed to load message requests") }
        )

    suspend fun acceptMessageRequest(messageId: String): MessageResult<String> = runCatching {
        val result = functions
            .getHttpsCallable("acceptMessage")
            .call(mapOf("messageId" to messageId))
            .await()
        val data = result.data as? Map<*, *> ?: emptyMap<Any?, Any?>()
        data["conversationId"] as? String ?: error("conversationId missing")
    }.fold(
        onSuccess = { MessageResult.Success(it) },
        onFailure = { MessageResult.Error(it.message ?: "Failed to accept message request") }
    )

    suspend fun rejectMessageRequest(messageId: String, reason: String): MessageResult<Unit> = runCatching {
        functions
            .getHttpsCallable("rejectMessage")
            .call(mapOf("messageId" to messageId, "reason" to reason))
            .await()
        Unit
    }.fold(
        onSuccess = { MessageResult.Success(Unit) },
        onFailure = { MessageResult.Error(it.message ?: "Failed to reject message request") }
    )

    private fun com.google.firebase.firestore.DocumentSnapshot.toMessage(): Message? =
        runCatching {
            Message(
                id = id,
                conversationId = reference.parent.parent?.id ?: return null,
                senderId = getString("senderId") ?: return null,
                text = getString("text") ?: return null,
                sentAt = getLong("sentAt") ?: 0L,
                readBy = (get("readBy") as? List<*>)?.filterIsInstance<String>() ?: emptyList()
            )
        }.getOrNull()

}
