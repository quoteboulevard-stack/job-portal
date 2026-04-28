package com.jobportal.features.jobs.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.jobportal.features.jobs.data.repository.JobRepository
import com.jobportal.features.jobs.data.repository.JobResult
import com.jobportal.features.jobs.domain.model.EmploymentType
import com.jobportal.features.jobs.domain.model.WorkMode
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PostJobUiState(
    val title: String = "",
    val company: String = "",
    val location: String = "",
    val description: String = "",
    val salary: String = "",
    val tags: String = "",
    val workMode: WorkMode = WorkMode.ONSITE,
    val employmentType: EmploymentType = EmploymentType.FULLTIME,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val postedJobId: String? = null
)

@HiltViewModel
class PostJobViewModel @Inject constructor(
    private val repository: JobRepository,
    private val auth: FirebaseAuth
) : ViewModel() {
    private val _uiState = MutableStateFlow(PostJobUiState())
    val uiState: StateFlow<PostJobUiState> = _uiState.asStateFlow()

    fun onTitleChanged(value: String) = _uiState.update { it.copy(title = value, error = null) }
    fun onCompanyChanged(value: String) = _uiState.update { it.copy(company = value, error = null) }
    fun onLocationChanged(value: String) = _uiState.update { it.copy(location = value, error = null) }
    fun onDescriptionChanged(value: String) = _uiState.update { it.copy(description = value, error = null) }
    fun onSalaryChanged(value: String) = _uiState.update { it.copy(salary = value, error = null) }
    fun onTagsChanged(value: String) = _uiState.update { it.copy(tags = value, error = null) }
    fun onWorkModeChanged(value: WorkMode) = _uiState.update { it.copy(workMode = value, error = null) }
    fun onEmploymentTypeChanged(value: EmploymentType) = _uiState.update { it.copy(employmentType = value, error = null) }
    fun consumePostedJob() = _uiState.update { it.copy(postedJobId = null) }

    fun submit() {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            _uiState.update { it.copy(error = "No authenticated employer") }
            return
        }

        val state = _uiState.value
        if (state.title.isBlank() || state.company.isBlank() || state.location.isBlank() || state.description.isBlank()) {
            _uiState.update { it.copy(error = "Title, company, location, and description are required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            when (
                val result = repository.createJob(
                    title = state.title,
                    company = state.company,
                    location = state.location,
                    description = state.description,
                    salary = state.salary,
                    workMode = state.workMode,
                    employmentType = state.employmentType,
                    tags = state.tags.split(",")
                )
            ) {
                is JobResult.Success -> _uiState.update {
                    it.copy(isSubmitting = false, postedJobId = result.data)
                }
                is JobResult.Error -> _uiState.update {
                    it.copy(isSubmitting = false, error = result.message)
                }
            }
        }
    }
}
