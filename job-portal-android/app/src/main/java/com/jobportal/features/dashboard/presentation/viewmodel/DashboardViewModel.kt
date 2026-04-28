package com.jobportal.features.dashboard.presentation.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.jobportal.features.dashboard.data.repository.DashboardRepository
import com.jobportal.features.dashboard.data.repository.DashboardResult
import com.jobportal.features.dashboard.domain.model.DashboardData
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class DashboardUiState(
    val data: DashboardData? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: DashboardRepository,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    private val explicitUserId: String? = savedStateHandle["userId"]
    private val explicitEmployer: Boolean? = savedStateHandle["isEmployer"]

    init { loadDashboard() }

    fun loadDashboard(forceRefresh: Boolean = false) = viewModelScope.launch {
        val uid = explicitUserId ?: auth.currentUser?.uid
        if (uid.isNullOrBlank()) return@launch _uiState.update {
            it.copy(isLoading = false, error = "No authenticated user")
        }
        _uiState.update { it.copy(isLoading = true, error = null) }
        if (forceRefresh) repository.invalidateCache()
        val isEmployer = explicitEmployer ?: runCatching {
            firestore.collection("users").document(uid).get().await().getString("role") == "employer"
        }.getOrDefault(false)
        when (val result = repository.getDashboardData(uid, isEmployer)) {
            is DashboardResult.Success -> _uiState.update { it.copy(data = result.data, isLoading = false) }
            is DashboardResult.Error -> _uiState.update { it.copy(isLoading = false, error = result.message) }
        }
    }
}
