package com.jobportal.features.jobs.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.jobportal.features.jobs.data.repository.JobRepository
import com.jobportal.features.jobs.data.repository.JobResult
import com.jobportal.features.jobs.domain.model.Job
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SavedJobsUiState(
    val jobs: List<Job> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class SavedJobsViewModel @Inject constructor(
    private val repository: JobRepository,
    private val auth: FirebaseAuth
) : ViewModel() {
    private val _uiState = MutableStateFlow(SavedJobsUiState())
    val uiState: StateFlow<SavedJobsUiState> = _uiState.asStateFlow()

    init {
        loadSavedJobs()
    }

    fun loadSavedJobs() = viewModelScope.launch {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update { it.copy(isLoading = false, error = "No authenticated user") }
            return@launch
        }

        _uiState.update { it.copy(isLoading = true, error = null) }
        when (val result = repository.fetchSavedJobs(uid)) {
            is JobResult.Success -> _uiState.update {
                it.copy(jobs = result.data, isLoading = false, error = null)
            }
            is JobResult.Error -> _uiState.update {
                it.copy(jobs = emptyList(), isLoading = false, error = result.message)
            }
        }
    }
}
