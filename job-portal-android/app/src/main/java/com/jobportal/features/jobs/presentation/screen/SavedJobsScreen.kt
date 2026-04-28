package com.jobportal.features.jobs.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.jobs.presentation.viewmodel.SavedJobsViewModel

@Composable
fun SavedJobsScreen(
    onJobClick: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SavedJobsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    if (state.isLoading) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        contentPadding = PaddingValues(bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Saved jobs", style = MaterialTheme.typography.headlineSmall)
        }
        state.error?.let { message ->
            item {
                Text(message, color = MaterialTheme.colorScheme.error)
            }
        }
        if (state.jobs.isEmpty()) {
            item {
                Text("No saved jobs yet.", style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            items(state.jobs, key = { it.id }) { job ->
                JobCard(job = job, onClick = { onJobClick(job.id) })
            }
        }
        item {
            Button(
                onClick = viewModel::loadSavedJobs,
                modifier = Modifier.padding(top = 4.dp)
            ) {
                Text("Refresh")
            }
        }
    }
}
