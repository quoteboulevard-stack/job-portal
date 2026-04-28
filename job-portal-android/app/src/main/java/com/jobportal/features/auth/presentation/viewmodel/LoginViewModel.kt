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

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(value: String) = _uiState.update {
        it.copy(email = value.trim(), error = null)
    }

    fun onPasswordChanged(value: String) = _uiState.update {
        it.copy(password = value, error = null)
    }

    fun login() {
        val state = uiState.value
        when {
            state.email.isBlank() -> setError("Email is required")
            state.password.isBlank() -> setError("Password is required")
            else -> viewModelScope.launch {
                _uiState.update { it.copy(isLoading = true, error = null) }
                when (val result = authRepository.login(state.email, state.password)) {
                    is AuthResult.Success -> _uiState.update {
                        it.copy(isLoading = false, isLoggedIn = true)
                    }
                    is AuthResult.Error -> setError(result.message)
                }
            }
        }
    }

    fun consumeLoginSuccess() = _uiState.update { it.copy(isLoggedIn = false) }

    private fun setError(message: String) = _uiState.update {
        it.copy(isLoading = false, error = message)
    }
}
