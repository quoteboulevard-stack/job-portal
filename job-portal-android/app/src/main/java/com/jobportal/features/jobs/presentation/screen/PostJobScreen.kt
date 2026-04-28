package com.jobportal.features.jobs.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.jobs.domain.model.EmploymentType
import com.jobportal.features.jobs.domain.model.WorkMode
import com.jobportal.features.jobs.presentation.viewmodel.PostJobViewModel

@Composable
fun PostJobScreen(
    onJobPosted: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PostJobViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.postedJobId) {
        val jobId = state.postedJobId ?: return@LaunchedEffect
        onJobPosted(jobId)
        viewModel.consumePostedJob()
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Post Job", style = MaterialTheme.typography.headlineSmall)

        OutlinedTextField(
            value = state.title,
            onValueChange = viewModel::onTitleChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Job title") }
        )
        OutlinedTextField(
            value = state.company,
            onValueChange = viewModel::onCompanyChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Company") }
        )
        OutlinedTextField(
            value = state.location,
            onValueChange = viewModel::onLocationChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Location") }
        )
        OutlinedTextField(
            value = state.salary,
            onValueChange = viewModel::onSalaryChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Salary") }
        )
        OutlinedTextField(
            value = state.tags,
            onValueChange = viewModel::onTagsChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Skills / tags (comma separated)") }
        )
        Text("Work Mode", style = MaterialTheme.typography.titleSmall)
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            WorkMode.entries.forEach { mode ->
                TextButton(
                    onClick = { viewModel.onWorkModeChanged(mode) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = if (state.workMode == mode) "• ${mode.value}" else mode.value,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
        Text("Employment Type", style = MaterialTheme.typography.titleSmall)
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            EmploymentType.entries.forEach { type ->
                TextButton(
                    onClick = { viewModel.onEmploymentTypeChanged(type) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = if (state.employmentType == type) "• ${type.value}" else type.value,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
        OutlinedTextField(
            value = state.description,
            onValueChange = viewModel::onDescriptionChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Description") },
            minLines = 6
        )
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
        Button(
            onClick = viewModel::submit,
            enabled = !state.isSubmitting,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (state.isSubmitting) {
                CircularProgressIndicator(modifier = Modifier.padding(vertical = 2.dp), strokeWidth = 2.dp)
            } else {
                Text("Publish job")
            }
        }
    }
}
