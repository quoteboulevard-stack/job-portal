package com.jobportal.features.applications.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.applications.domain.model.Application
import com.jobportal.features.applications.domain.model.ApplicationStatus
import com.jobportal.features.applications.presentation.viewmodel.EmployerApplicantsViewModel
import java.text.DateFormat
import java.util.Date

@Composable
fun EmployerApplicantsScreen(
    modifier: Modifier = Modifier,
    viewModel: EmployerApplicantsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Applicants", style = MaterialTheme.typography.headlineSmall)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = state.selectedStatus == null,
                    onClick = { viewModel.onStatusSelected(null) },
                    label = { Text("All") }
                )
            }
            items(ApplicationStatus.entries) { status ->
                FilterChip(
                    selected = state.selectedStatus == status,
                    onClick = { viewModel.onStatusSelected(status) },
                    label = { Text(status.name.replace('_', ' ')) }
                )
            }
        }
        Button(onClick = viewModel::refresh, modifier = Modifier.fillMaxWidth()) {
            Text("Refresh")
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        when {
            state.isLoading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.visibleApplicants.isEmpty() -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No applicants found", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.visibleApplicants, key = { it.id }) { applicant ->
                    EmployerApplicantCard(
                        applicant = applicant,
                        isUpdating = applicant.id in state.updatingIds,
                        onUpdateStatus = { status -> viewModel.updateStatus(applicant.id, status) }
                    )
                }
            }
        }
    }
}

@Composable
private fun EmployerApplicantCard(
    applicant: Application,
    isUpdating: Boolean,
    onUpdateStatus: (ApplicationStatus) -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = applicant.jobTitle ?: "Applicant",
                style = MaterialTheme.typography.titleMedium
            )
            val subtitle = listOfNotNull(applicant.company, applicant.location).joinToString(" • ")
            if (subtitle.isNotBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodyMedium)
            }
            Text(
                text = "Current status: ${applicant.status.name.replace('_', ' ')}",
                style = MaterialTheme.typography.labelLarge,
                color = statusColor(applicant.status)
            )
            Text(
                text = "Applied ${DateFormat.getDateInstance(DateFormat.MEDIUM).format(Date(applicant.appliedAt))}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ApplicationStatus.entries.filter { it != applicant.status }.chunked(2).forEach { rowStatuses ->
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(rowStatuses) { status ->
                            OutlinedButton(
                                onClick = { onUpdateStatus(status) },
                                enabled = !isUpdating
                            ) {
                                Text(status.name.replace('_', ' '))
                            }
                        }
                    }
                }
            }
            if (isUpdating) {
                CircularProgressIndicator(modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

@Composable
private fun statusColor(status: ApplicationStatus): Color = when (status) {
    ApplicationStatus.APPLIED -> MaterialTheme.colorScheme.primary
    ApplicationStatus.SHORTLISTED -> Color(0xFFE65100)
    ApplicationStatus.INTERVIEW -> Color(0xFF6A1B9A)
    ApplicationStatus.OFFER -> Color(0xFF2E7D32)
    ApplicationStatus.REJECTED -> MaterialTheme.colorScheme.error
}
