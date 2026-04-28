package com.jobportal.features.auth.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenu
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.auth.domain.model.UserRole
import com.jobportal.features.auth.presentation.viewmodel.SignupViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignupScreen(
    onLoginClick: () -> Unit,
    onSignupSuccess: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SignupViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var expanded by remember { mutableStateOf(false) }
    LaunchedEffect(state.isSignedUp) {
        if (state.isSignedUp) {
            onSignupSuccess()
            viewModel.consumeSignupSuccess()
        }
    }
    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Create account", style = MaterialTheme.typography.headlineMedium)
        SignupField(state.name, viewModel::onNameChanged, "Name", state.nameError, !state.isLoading, 24.dp)
        SignupField(state.email, viewModel::onEmailChanged, "Email", state.emailError, !state.isLoading, 12.dp)
        SignupField(state.password, viewModel::onPasswordChanged, "Password", state.passwordError, !state.isLoading, 12.dp, true)
        SignupField(state.confirmPassword, viewModel::onConfirmChanged, "Confirm password", state.confirmError, !state.isLoading, 12.dp, true)
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { if (!state.isLoading) expanded = !expanded },
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
        ) {
            OutlinedTextField(
                value = state.role.name.replace('_', ' '),
                onValueChange = {},
                readOnly = true,
                enabled = !state.isLoading,
                label = { Text("Role") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                UserRole.entries.forEach { role ->
                    DropdownMenuItem(text = { Text(role.name.replace('_', ' ')) }, onClick = {
                        viewModel.onRoleChanged(role)
                        expanded = false
                    })
                }
            }
        }
        state.error?.let { ErrorText(it) }
        Button(
            onClick = viewModel::signup,
            enabled = !state.isLoading,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
        ) {
            if (state.isLoading) CircularProgressIndicator(strokeWidth = 2.dp)
            else Text("Sign up")
        }
        TextButton(onClick = onLoginClick, enabled = !state.isLoading, modifier = Modifier.padding(top = 12.dp)) {
            Text("Already have an account? Login")
        }
    }
}

@Composable
private fun SignupField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    error: String?,
    enabled: Boolean,
    top: androidx.compose.ui.unit.Dp,
    password: Boolean = false
) {
    OutlinedTextField(
        value = value, onValueChange = onValueChange, label = { Text(label) }, singleLine = true,
        enabled = enabled, isError = error != null, modifier = Modifier.fillMaxWidth().padding(top = top),
        visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None
    )
    error?.let { ErrorText(it) }
}

@Composable
private fun ErrorText(message: String) {
    Text(message, color = MaterialTheme.colorScheme.error, modifier = Modifier.fillMaxWidth().padding(top = 4.dp))
}
