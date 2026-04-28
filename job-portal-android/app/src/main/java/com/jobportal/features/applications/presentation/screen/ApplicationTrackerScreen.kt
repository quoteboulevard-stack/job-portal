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
import com.jobportal.features.applications.presentation.viewmodel.ApplicationTrackerViewModel
import java.text.DateFormat
import java.util.Date

@Composable
fun ApplicationTrackerScreen(
    modifier: Modifier = Modifier,
    viewModel: ApplicationTrackerViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Application Tracker", style = MaterialTheme.typography.headlineSmall)
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
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }

        when {
            state.isLoading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.visibleApplications.isEmpty() -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No applications found", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.visibleApplications, key = { it.id }) { application ->
                    ApplicationCard(application = application)
                }
            }
        }
    }
}

@Composable
private fun ApplicationCard(application: Application) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = application.jobTitle ?: "Job application",
                style = MaterialTheme.typography.titleMedium
            )
            val subtitle = listOfNotNull(application.company, application.location)
                .joinToString(" • ")
            if (subtitle.isNotBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodyMedium)
            }
            application.salary?.let {
                Text(it, style = MaterialTheme.typography.bodyMedium)
            }
            Text(
                text = application.status.name.replace('_', ' '),
                color = statusColor(application.status),
                style = MaterialTheme.typography.labelLarge
            )
            Text(
                text = "Applied ${DateFormat.getDateInstance(DateFormat.MEDIUM).format(Date(application.appliedAt))}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
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
