package com.jobportal.features.messages.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.jobportal.features.messages.data.repository.MessageRepository
import com.jobportal.features.messages.data.repository.MessageResult
import com.jobportal.features.messages.domain.model.Conversation
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class ConversationListUiState(
    val conversations: List<Conversation> = emptyList(),
    val isLoading: Boolean = true,
    val isEmployer: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ConversationListViewModel @Inject constructor(
    private val repository: MessageRepository,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : ViewModel() {
    private val _uiState = MutableStateFlow(ConversationListUiState())
    val uiState: StateFlow<ConversationListUiState> = _uiState.asStateFlow()

    init {
        observeConversations()
    }

    private fun observeConversations() {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update {
                it.copy(isLoading = false, error = "No authenticated user")
            }
            return
        }

        viewModelScope.launch {
            val isEmployer = runCatching {
                firestore.collection("users").document(uid).get().await().getString("role") == "employer"
            }.getOrDefault(false)

            _uiState.update { it.copy(isLoading = true, isEmployer = isEmployer, error = null) }

            repository.listenToConversations(uid, isEmployer).collect { result ->
                when (result) {
                    is MessageResult.Success -> _uiState.update {
                        it.copy(conversations = result.data, isLoading = false, error = null)
                    }
                    is MessageResult.Error -> _uiState.update {
                        it.copy(isLoading = false, error = result.message)
                    }
                }
            }
        }
    }
}
