package com.jobportal.features.messages.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.jobportal.features.messages.domain.model.MessageRequest
import com.jobportal.features.messages.presentation.viewmodel.MessageRequestsViewModel
import java.text.DateFormat
import java.util.Date

@Composable
fun MessageRequestsScreen(
    onConversationOpened: (String) -> Unit = {},
    modifier: Modifier = Modifier,
    viewModel: MessageRequestsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.openedConversationId) {
        val conversationId = state.openedConversationId ?: return@LaunchedEffect
        onConversationOpened(conversationId)
        viewModel.consumeOpenedConversation()
    }

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Message Requests", style = MaterialTheme.typography.headlineSmall)
        Button(onClick = viewModel::refresh, modifier = Modifier.fillMaxWidth()) {
            Text("Refresh")
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        when {
            state.isLoading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.requests.isEmpty() -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No pending message requests", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.requests, key = { it.id }) { request ->
                    MessageRequestCard(
                        request = request,
                        isProcessing = state.processingId == request.id,
                        onAccept = { viewModel.accept(request.id) },
                        onReject = { viewModel.reject(request.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun MessageRequestCard(
    request: MessageRequest,
    isProcessing: Boolean,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(request.fromName ?: request.fromUserId, style = MaterialTheme.typography.titleMedium)
            Text(request.subject, color = MaterialTheme.colorScheme.primary)
            Text(request.body, maxLines = 4, overflow = TextOverflow.Ellipsis)
            Text(
                DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(request.createdAt)),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (isProcessing) {
                CircularProgressIndicator()
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = onAccept, modifier = Modifier.fillMaxWidth()) {
                        Text("Accept")
                    }
                    OutlinedButton(onClick = onReject, modifier = Modifier.fillMaxWidth()) {
                        Text("Reject")
                    }
                }
            }
        }
    }
}
