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

data class EmployerApplicantsUiState(
    val applicants: List<Application> = emptyList(),
    val selectedStatus: ApplicationStatus? = null,
    val isLoading: Boolean = true,
    val updatingIds: Set<String> = emptySet(),
    val error: String? = null
) {
    val visibleApplicants: List<Application>
        get() = selectedStatus?.let { status ->
            applicants.filter { it.status == status }
        } ?: applicants
}

@HiltViewModel
class EmployerApplicantsViewModel @Inject constructor(
    private val repository: ApplicationRepository,
    private val auth: FirebaseAuth
) : ViewModel() {
    private val _uiState = MutableStateFlow(EmployerApplicantsUiState())
    val uiState: StateFlow<EmployerApplicantsUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun onStatusSelected(status: ApplicationStatus?) {
        _uiState.update { it.copy(selectedStatus = status) }
    }

    fun refresh() {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update { it.copy(isLoading = false, error = "No authenticated employer") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            when (val result = repository.fetchApplicantsForEmployer(uid)) {
                is ApplicationResult.Success -> _uiState.update {
                    it.copy(applicants = result.data, isLoading = false, error = null)
                }
                is ApplicationResult.Error -> _uiState.update {
                    it.copy(isLoading = false, error = result.message)
                }
            }
        }
    }

    fun updateStatus(applicationId: String, status: ApplicationStatus) {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update { it.copy(error = "No authenticated employer") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(updatingIds = it.updatingIds + applicationId, error = null) }
            when (val result = repository.updateApplicationStatus(applicationId, status)) {
                is ApplicationResult.Success -> {
                    _uiState.update { state ->
                        state.copy(
                            applicants = state.applicants.map { applicant ->
                                if (applicant.id == applicationId) applicant.copy(status = status) else applicant
                            },
                            updatingIds = state.updatingIds - applicationId,
                            error = null
                        )
                    }
                }
                is ApplicationResult.Error -> {
                    _uiState.update {
                        it.copy(updatingIds = it.updatingIds - applicationId, error = result.message)
                    }
                }
            }
        }
    }
}
