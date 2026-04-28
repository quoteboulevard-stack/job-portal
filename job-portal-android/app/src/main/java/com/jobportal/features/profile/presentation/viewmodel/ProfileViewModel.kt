package com.jobportal.features.profile.presentation.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobportal.features.profile.data.repository.ProfileRepository
import com.jobportal.features.profile.data.repository.ProfileResult
import com.jobportal.features.profile.domain.model.Profile
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val profile: Profile? = null,
    val displayNameInput: String = "",
    val skillsInput: String = "",
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isUploading: Boolean = false,
    val error: String? = null,
    val status: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, status = null) }
            when (val result = repository.loadProfile()) {
                is ProfileResult.Success -> _uiState.update {
                    it.copy(
                        profile = result.data,
                        displayNameInput = result.data.displayName,
                        skillsInput = result.data.skills.joinToString(", "),
                        isLoading = false
                    )
                }
                is ProfileResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
            }
        }
    }

    fun onDisplayNameChanged(value: String) = _uiState.update { it.copy(displayNameInput = value, error = null) }
    fun onSkillsChanged(value: String) = _uiState.update { it.copy(skillsInput = value, error = null) }

    fun save() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null, status = null) }
            when (
                val result = repository.updateProfile(
                    displayName = uiState.value.displayNameInput,
                    skills = uiState.value.skillsInput.split(",").map { it.trim() }.filter { it.isNotBlank() }
                )
            ) {
                is ProfileResult.Success -> {
                    _uiState.update { it.copy(isSaving = false, status = "Profile updated") }
                    refresh()
                }
                is ProfileResult.Error -> _uiState.update { it.copy(isSaving = false, error = result.message) }
            }
        }
    }

    fun uploadResume(uri: Uri) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true, error = null, status = null) }
            when (val result = repository.uploadResume(uri)) {
                is ProfileResult.Success -> {
                    _uiState.update { it.copy(isUploading = false, status = "Resume uploaded") }
                    refresh()
                }
                is ProfileResult.Error -> _uiState.update { it.copy(isUploading = false, error = result.message) }
            }
        }
    }
}
