package com.jobportal.features.applications.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.jobportal.features.applications.data.repository.ApplicationRepository
import com.jobportal.features.applications.data.repository.ApplicationResult
import com.jobportal.features.applications.domain.model.Application
import com.jobportal.features.applications.domain.model.ApplicationStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ApplicationTrackerUiState(
    val applications: List<Application> = emptyList(),
    val selectedStatus: ApplicationStatus? = null,
    val isLoading: Boolean = true,
    val error: String? = null
) {
    val visibleApplications: List<Application>
        get() = selectedStatus?.let { status ->
            applications.filter { it.status == status }
        } ?: applications
}

@HiltViewModel
class ApplicationTrackerViewModel @Inject constructor(
    private val repository: ApplicationRepository,
    private val auth: FirebaseAuth
) : ViewModel() {
    private val _uiState = MutableStateFlow(ApplicationTrackerUiState())
    val uiState: StateFlow<ApplicationTrackerUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun onStatusSelected(status: ApplicationStatus?) {
        _uiState.update { it.copy(selectedStatus = status) }
    }

    fun refresh() {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update {
                it.copy(isLoading = false, error = "No authenticated user")
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = repository.fetchApplicationsForUser(uid)) {
                is ApplicationResult.Success -> _uiState.update {
                    it.copy(applications = result.data, isLoading = false, error = null)
                }
                is ApplicationResult.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
            }
        }
    }
}
