package com.jobportal.features.auth.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobportal.features.auth.data.repository.AuthRepository
import com.jobportal.features.auth.data.repository.AuthResult
import com.jobportal.features.auth.domain.model.UserRole
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SignupUiState(
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val role: UserRole = UserRole.JOB_SEEKER,
    val isLoading: Boolean = false,
    val nameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmError: String? = null,
    val error: String? = null,
    val isSignedUp: Boolean = false
)

@HiltViewModel
class SignupViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(SignupUiState())
    val uiState: StateFlow<SignupUiState> = _uiState.asStateFlow()

    fun onNameChanged(v: String) = update { it.copy(name = v, nameError = null, error = null) }
    fun onEmailChanged(v: String) = update { it.copy(email = v.trim(), emailError = null, error = null) }
    fun onPasswordChanged(v: String) = update { it.copy(password = v, passwordError = null, confirmError = null, error = null) }
    fun onConfirmChanged(v: String) = update { it.copy(confirmPassword = v, confirmError = null, error = null) }
    fun onRoleChanged(v: UserRole) = update { it.copy(role = v, error = null) }

    fun signup() {
        val s = uiState.value
        val emailError = when {
            s.email.isBlank() -> "Email is required"
            !android.util.Patterns.EMAIL_ADDRESS.matcher(s.email).matches() -> "Enter a valid email"
            else -> null
        }
        val next = s.copy(
            nameError = if (s.name.isBlank()) "Name is required" else null,
            emailError = emailError,
            passwordError = when {
                s.password.isBlank() -> "Password is required"
                s.password.length < 6 -> "Password must be at least 6 characters"
                else -> null
            },
            confirmError = if (s.confirmPassword != s.password) "Passwords do not match" else null,
            error = null
        )
        if (listOf(next.nameError, next.emailError, next.passwordError, next.confirmError).any { it != null }) {
            _uiState.value = next
            return
        }
        _uiState.value = next.copy(isLoading = true)
        viewModelScope.launch {
            when (val result = authRepository.signup(s.email, s.password, s.name.trim(), s.role)) {
                is AuthResult.Success -> update { it.copy(isLoading = false, isSignedUp = true) }
                is AuthResult.Error -> update { it.copy(isLoading = false, error = result.message) }
            }
        }
    }

    fun consumeSignupSuccess() = update { it.copy(isSignedUp = false) }
    private fun update(block: (SignupUiState) -> SignupUiState) = _uiState.update(block)
}
