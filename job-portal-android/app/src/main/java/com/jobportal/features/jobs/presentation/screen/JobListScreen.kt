package com.jobportal.features.jobs.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.jobs.domain.model.Job
import com.jobportal.features.jobs.domain.model.WorkMode
import com.jobportal.features.jobs.presentation.viewmodel.JobListViewModel

@Composable
fun JobListScreen(
    onJobClick: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: JobListViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = state.query,
            onValueChange = viewModel::onQueryChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Search jobs") },
            singleLine = true
        )
        LazyRow(
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item { FilterChip(selected = state.selectedWorkMode == null, onClick = { viewModel.onWorkModeSelected(null) }, label = { Text("All") }) }
            itemsIndexed(WorkMode.entries.toList()) { _, mode ->
                FilterChip(
                    selected = state.selectedWorkMode == mode,
                    onClick = { viewModel.onWorkModeSelected(mode) },
                    label = { Text(mode.value.replaceFirstChar { it.uppercaseChar() }) }
                )
            }
        }
        Button(onClick = viewModel::onSearch, modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) { Text("Apply Filters") }
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
        if (state.isLoading && state.jobs.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(top = 12.dp),
                contentPadding = PaddingValues(bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (state.jobs.isEmpty()) item { Text("No jobs found", style = MaterialTheme.typography.bodyMedium) }
                itemsIndexed(state.jobs, key = { _, job -> job.id }) { index, job ->
                    if (index >= state.jobs.lastIndex - 2) LaunchedEffect(job.id) { viewModel.loadNextPage() }
                    JobCard(job = job, onClick = { onJobClick(job.id) })
                }
                if (state.isLoadingMore) item { CircularProgressIndicator(modifier = Modifier.padding(16.dp)) }
            }
        }
    }
}

@Composable
private fun JobCard(job: Job, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(job.title, style = MaterialTheme.typography.titleMedium)
            Text("${job.company} • ${job.location}", style = MaterialTheme.typography.bodyMedium)
            Text(
                "${job.workMode.value} · ${job.employmentType.value}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
            job.salary?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
            Text(job.description, maxLines = 3, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall)
            if (job.tags.isNotEmpty()) Text(job.tags.joinToString(" • "), maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.labelSmall)
        }
    }
}
