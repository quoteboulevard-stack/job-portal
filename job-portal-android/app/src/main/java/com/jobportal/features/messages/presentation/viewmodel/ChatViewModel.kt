package com.jobportal.features.messages.presentation.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.jobportal.features.messages.data.repository.MessageRepository
import com.jobportal.features.messages.data.repository.MessageResult
import com.jobportal.features.messages.domain.model.Message
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class ChatUiState(
    val messages: List<Message> = emptyList(),
    val input: String = "",
    val isSending: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: MessageRepository,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : ViewModel() {
    private val conversationId: String = checkNotNull(savedStateHandle["conversationId"])
    private val currentUserId get() = auth.currentUser?.uid.orEmpty()
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.listenToMessages(conversationId).collect { result ->
                when (result) {
                    is MessageResult.Success -> {
                        _uiState.update { it.copy(messages = result.data, error = null) }
                        markAsRead(result.data)
                    }
                    is MessageResult.Error -> _uiState.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun onInputChanged(value: String) = _uiState.update { it.copy(input = value, error = null) }

    fun sendMessage() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, error = null) }
            when (val result = repository.sendMessage(conversationId, uiState.value.input)) {
                is MessageResult.Success -> _uiState.update { it.copy(input = "", isSending = false) }
                is MessageResult.Error -> _uiState.update { it.copy(isSending = false, error = result.message) }
            }
        }
    }

    private fun markAsRead(messages: List<Message>) {
        val uid = currentUserId
        if (uid.isBlank()) return
        messages.filter { it.senderId != uid && uid !in it.readBy }.forEach { message ->
            viewModelScope.launch {
                runCatching {
                    firestore.collection("conversations").document(conversationId)
                        .collection("messages").document(message.id)
                        .update("readBy", FieldValue.arrayUnion(uid)).await()
                }
            }
        }
    }
}
