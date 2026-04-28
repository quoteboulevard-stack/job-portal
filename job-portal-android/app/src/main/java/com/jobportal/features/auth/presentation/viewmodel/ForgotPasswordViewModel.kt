package com.jobportal.features.auth.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobportal.features.auth.data.repository.AuthRepository
import com.jobportal.features.auth.data.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ForgotPasswordUiState(
    val email: String = "",
    val isLoading: Boolean = false,
    val message: String? = null,
    val error: String? = null
)

@HiltViewModel
class ForgotPasswordViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(ForgotPasswordUiState())
    val uiState: StateFlow<ForgotPasswordUiState> = _uiState.asStateFlow()

    fun onEmailChanged(value: String) = _uiState.update {
        it.copy(email = value.trim(), message = null, error = null)
    }

    fun sendReset() {
        val email = uiState.value.email.trim()
        if (email.isBlank()) {
            _uiState.update { it.copy(error = "Email is required", message = null) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, error = null) }
            when (val result = authRepository.sendPasswordReset(email)) {
                is AuthResult.Success -> _uiState.update {
                    it.copy(
                        isLoading = false,
                        message = "Password reset email sent",
                        error = null
                    )
                }
                is AuthResult.Error -> _uiState.update {
                    it.copy(isLoading = false, message = null, error = result.message)
                }
            }
        }
    }
}
