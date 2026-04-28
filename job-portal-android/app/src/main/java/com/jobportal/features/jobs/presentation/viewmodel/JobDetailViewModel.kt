package com.jobportal.features.jobs.presentation.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
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
import kotlinx.coroutines.tasks.await

data class JobDetailUiState(
    val job: Job? = null,
    val isLoading: Boolean = true,
    val isApplying: Boolean = false,
    val isSaved: Boolean = false,
    val fitScore: Int = 0,
    val missingSkills: List<String> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class JobDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: JobRepository,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : ViewModel() {
    private val jobId: String = checkNotNull(savedStateHandle["jobId"])
    private val _uiState = MutableStateFlow(JobDetailUiState())
    val uiState: StateFlow<JobDetailUiState> = _uiState.asStateFlow()

    init { loadJob() }

    fun loadJob() = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true, error = null) }
        when (val result = repository.getJobById(jobId)) {
            is JobResult.Success -> {
                val uid = auth.currentUser?.uid
                val userSkills = uid?.let { loadSkills(it) }.orEmpty()
                val tags = result.data.tags.map(String::lowercase)
                val matched = tags.intersect(userSkills.map(String::lowercase).toSet()).size
                _uiState.update {
                    it.copy(
                        job = result.data,
                        isLoading = false,
                        isSaved = uid?.let { id -> isSaved(id, jobId) } == true,
                        fitScore = if (tags.isEmpty()) 0 else matched * 100 / tags.size,
                        missingSkills = result.data.tags.filterNot { t -> userSkills.any { it.equals(t, true) } }
                    )
                }
            }
            is JobResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
        }
    }

    fun toggleSave() = viewModelScope.launch {
        val uid = auth.currentUser?.uid ?: return@launch _uiState.update { it.copy(error = "Please login to continue") }
        runCatching {
            val doc = firestore.collection("saved_jobs").document("${uid}_$jobId")
            if (_uiState.value.isSaved) doc.delete().await()
            else doc.set(mapOf("userId" to uid, "jobId" to jobId, "savedAt" to System.currentTimeMillis())).await()
        }.onSuccess { _uiState.update { it.copy(isSaved = !it.isSaved, error = null) } }
            .onFailure { _uiState.update { s -> s.copy(error = it.message ?: "Unable to update saved job") } }
    }

    fun apply() = viewModelScope.launch {
        val uid = auth.currentUser?.uid ?: return@launch _uiState.update { it.copy(error = "Please login to continue") }
        _uiState.update { it.copy(isApplying = true, error = null) }
        runCatching {
            firestore.collection("applications").document("${uid}_$jobId")
                .set(
                    mapOf("userId" to uid, "jobId" to jobId, "status" to "APPLIED", "appliedAt" to System.currentTimeMillis()),
                    SetOptions.merge()
                ).await()
        }.onSuccess { _uiState.update { it.copy(isApplying = false) } }
            .onFailure { _uiState.update { s -> s.copy(isApplying = false, error = it.message ?: "Unable to apply") } }
    }

    private suspend fun loadSkills(uid: String): List<String> =
        (firestore.collection("users").document(uid).get().await().get("skills") as? List<*>)?.filterIsInstance<String>().orEmpty()

    private suspend fun isSaved(uid: String, id: String): Boolean =
        firestore.collection("saved_jobs").document("${uid}_$id").get().await().exists()
}
