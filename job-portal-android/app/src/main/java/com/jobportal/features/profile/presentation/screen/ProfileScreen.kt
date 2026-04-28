package com.jobportal.features.profile.presentation.screen

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.profile.presentation.viewmodel.ProfileViewModel

@Composable
fun ProfileScreen(
    modifier: Modifier = Modifier,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let(viewModel::uploadResume)
    }

    if (state.isLoading) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Profile", style = MaterialTheme.typography.headlineSmall)
        state.profile?.let { profile ->
            Text(profile.email, style = MaterialTheme.typography.bodyMedium)
            Text(profile.role.name.replace('_', ' '), color = MaterialTheme.colorScheme.primary)
        }
        OutlinedTextField(
            value = state.displayNameInput,
            onValueChange = viewModel::onDisplayNameChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Display name") }
        )
        OutlinedTextField(
            value = state.skillsInput,
            onValueChange = viewModel::onSkillsChanged,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Skills (comma separated)") }
        )
        Button(
            onClick = viewModel::save,
            enabled = !state.isSaving,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (state.isSaving) "Saving..." else "Save profile")
        }
        Button(
            onClick = { picker.launch("*/*") },
            enabled = !state.isUploading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (state.isUploading) "Uploading..." else "Upload resume")
        }
        state.profile?.resumeName?.let {
            Text("Resume: $it", style = MaterialTheme.typography.bodyMedium)
        }
        state.profile?.resumeStatus?.let {
            Text("Resume status: $it", style = MaterialTheme.typography.bodyMedium)
        }
        state.profile?.resumeError?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
        state.status?.let {
            Text(it, color = MaterialTheme.colorScheme.primary)
        }
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }
}
