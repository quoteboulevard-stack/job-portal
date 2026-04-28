package com.jobportal.features.messages.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.jobportal.features.messages.data.repository.MessageRepository
import com.jobportal.features.messages.data.repository.MessageResult
import com.jobportal.features.messages.domain.model.MessageRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MessageRequestsUiState(
    val requests: List<MessageRequest> = emptyList(),
    val isLoading: Boolean = true,
    val processingId: String? = null,
    val openedConversationId: String? = null,
    val error: String? = null
)

@HiltViewModel
class MessageRequestsViewModel @Inject constructor(
    private val repository: MessageRepository,
    private val auth: FirebaseAuth
) : ViewModel() {
    private val _uiState = MutableStateFlow(MessageRequestsUiState())
    val uiState: StateFlow<MessageRequestsUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update { it.copy(isLoading = false, error = "No authenticated employer") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = repository.fetchPendingMessageRequests(uid)) {
                is MessageResult.Success -> _uiState.update {
                    it.copy(requests = result.data, isLoading = false, error = null)
                }
                is MessageResult.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
            }
        }
    }

    fun accept(messageId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(processingId = messageId, error = null) }
            when (val result = repository.acceptMessageRequest(messageId)) {
                is MessageResult.Success -> _uiState.update {
                    it.copy(processingId = null, openedConversationId = result.data)
                }
                is MessageResult.Error -> _uiState.update {
                    it.copy(processingId = null, error = result.message)
                }
            }
        }
    }

    fun reject(messageId: String, reason: String = "Not a fit right now") {
        viewModelScope.launch {
            _uiState.update { it.copy(processingId = messageId, error = null) }
            when (val result = repository.rejectMessageRequest(messageId, reason)) {
                is MessageResult.Success -> refresh()
                is MessageResult.Error -> _uiState.update {
                    it.copy(processingId = null, error = result.message)
                }
            }
        }
    }

    fun consumeOpenedConversation() {
        _uiState.update { it.copy(openedConversationId = null) }
    }
}
