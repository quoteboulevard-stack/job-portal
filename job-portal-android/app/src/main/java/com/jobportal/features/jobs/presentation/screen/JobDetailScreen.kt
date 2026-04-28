package com.jobportal.features.jobs.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import com.jobportal.features.jobs.presentation.viewmodel.JobDetailViewModel

@Composable
fun JobDetailScreen(
    modifier: Modifier = Modifier,
    viewModel: JobDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val job = state.job
    if (state.isLoading) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    Column(
        modifier = modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        if (job == null) return@Column
        Text(job.title, style = MaterialTheme.typography.headlineSmall)
        Text("${job.company} • ${job.location}", style = MaterialTheme.typography.titleMedium)
        Text(job.type.name.replace('_', ' '), color = MaterialTheme.colorScheme.primary)
        job.salary?.let { Text("Salary: $it", style = MaterialTheme.typography.bodyLarge) }
        Text("Fit Score: ${state.fitScore}%", color = if (state.fitScore >= 70) Color(0xFF2E7D32) else MaterialTheme.colorScheme.primary)
        if (state.missingSkills.isNotEmpty()) {
            Text("Missing Skills", style = MaterialTheme.typography.titleMedium)
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(state.missingSkills.joinToString(" • "), style = MaterialTheme.typography.bodyMedium)
            }
        }
        if (job.tags.isNotEmpty()) {
            Text("Skills", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                job.tags.take(4).forEach { AssistChip(onClick = {}, label = { Text(it) }) }
            }
        }
        Text("About this job", style = MaterialTheme.typography.titleMedium)
        Text(job.description, style = MaterialTheme.typography.bodyLarge)
        Text("Posted by: ${job.employerId}", style = MaterialTheme.typography.bodyMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = viewModel::apply,
                enabled = !state.isApplying,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                modifier = Modifier.weight(1f)
            ) { Text(if (state.isApplying) "Applying..." else "Apply") }
            OutlinedButton(onClick = viewModel::toggleSave, modifier = Modifier.weight(1f)) {
                Text(if (state.isSaved) "Saved" else "Save Job")
            }
        }
    }
}
