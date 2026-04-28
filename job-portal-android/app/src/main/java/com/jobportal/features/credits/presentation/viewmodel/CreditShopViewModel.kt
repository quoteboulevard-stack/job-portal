package com.jobportal.features.credits.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobportal.features.credits.data.repository.CreditRepository
import com.jobportal.features.credits.data.repository.CreditResult
import com.jobportal.features.credits.data.repository.CreditSummary
import com.jobportal.features.credits.domain.model.CreditPackage
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CreditShopUiState(
    val summary: CreditSummary = CreditSummary(),
    val packages: List<CreditPackage> = emptyList(),
    val isLoading: Boolean = true,
    val selectedPackageId: String? = null,
    val isCreatingCheckout: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CreditShopViewModel @Inject constructor(
    private val repository: CreditRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        CreditShopUiState(packages = repository.packages())
    )
    val uiState: StateFlow<CreditShopUiState> = _uiState.asStateFlow()

    init {
        loadCredits()
    }

    fun loadCredits() = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true, error = null) }
        when (val result = repository.loadSummary()) {
            is CreditResult.Success -> _uiState.update {
                it.copy(summary = result.data, isLoading = false, error = null)
            }
            is CreditResult.Error -> _uiState.update {
                it.copy(isLoading = false, error = result.message)
            }
        }
    }

    fun startCheckout(onCheckoutReady: (String) -> Unit) {
        val packageId = uiState.value.selectedPackageId
        if (packageId.isNullOrBlank()) {
            _uiState.update { it.copy(error = "Select a credit package first") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingCheckout = true, error = null) }
            when (val result = repository.createCheckout(packageId)) {
                is CreditResult.Success -> {
                    _uiState.update { it.copy(isCreatingCheckout = false, error = null) }
                    onCheckoutReady(result.data)
                }
                is CreditResult.Error -> _uiState.update {
                    it.copy(isCreatingCheckout = false, error = result.message)
                }
            }
        }
    }

    fun selectPackage(packageId: String) = _uiState.update {
        it.copy(selectedPackageId = packageId, error = null)
    }
}
