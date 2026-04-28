package com.jobportal.features.jobs.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobportal.features.jobs.data.repository.JobRepository
import com.jobportal.features.jobs.data.repository.JobResult
import com.jobportal.features.jobs.domain.model.Job
import com.jobportal.features.jobs.domain.model.WorkMode
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class JobListUiState(
    val jobs: List<Job> = emptyList(),
    val query: String = "",
    val selectedWorkMode: WorkMode? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null,
    val endReached: Boolean = false,
    val page: Int = 1
)

@HiltViewModel
class JobListViewModel @Inject constructor(
    private val repository: JobRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(JobListUiState())
    val uiState: StateFlow<JobListUiState> = _uiState.asStateFlow()
    private val pageSize = 20L

    init { refresh() }

    fun onQueryChanged(value: String) = _uiState.update { it.copy(query = value, error = null) }
    fun onWorkModeSelected(mode: WorkMode?) { _uiState.update { it.copy(selectedWorkMode = mode, page = 1) }; refresh() }
    fun onSearch() = refresh()

    fun refresh() {
        val s = uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, endReached = false, page = 1) }
            when (val result = fetch(page = 1, append = false, state = s)) {
                is JobResult.Success -> _uiState.update {
                    it.copy(jobs = result.data, isLoading = false, endReached = result.data.size < pageSize)
                }
                is JobResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
            }
        }
    }

    fun loadNextPage() {
        val s = uiState.value
        if (s.isLoading || s.isLoadingMore || s.endReached) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingMore = true, error = null) }
            when (val result = fetch(page = s.page + 1, append = true, state = s)) {
                is JobResult.Success -> _uiState.update {
                    val data = result.data
                    it.copy(
                        jobs = data,
                        page = s.page + 1,
                        isLoadingMore = false,
                        endReached = data.size == s.jobs.size
                    )
                }
                is JobResult.Error -> _uiState.update { it.copy(isLoadingMore = false, error = result.message) }
            }
        }
    }

    private suspend fun fetch(page: Int, append: Boolean, state: JobListUiState): JobResult<List<Job>> {
        val hasFilter = state.query.isNotBlank() || state.selectedWorkMode != null
        return if (hasFilter) {
            repository.searchJobs(
                query = state.query,
                workMode = state.selectedWorkMode,
                limit = page * pageSize
            )
        } else {
            repository.fetchJobs(limit = pageSize, lastDocId = if (append) state.jobs.lastOrNull()?.id else null)
                .let { result ->
                    when (result) {
                        is JobResult.Success -> JobResult.Success(if (append) state.jobs + result.data else result.data)
                        is JobResult.Error -> result
                    }
                }
        }
    }
}
