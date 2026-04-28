package com.jobportal.features.dashboard.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
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
import com.jobportal.features.dashboard.domain.model.ChartEntry
import com.jobportal.features.dashboard.presentation.viewmodel.DashboardViewModel

@Composable
fun DashboardScreen(modifier: Modifier = Modifier, viewModel: DashboardViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    if (state.isLoading) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    val data = state.data
    Column(
        modifier = modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        if (data == null) return@Column
        Text("Dashboard", style = MaterialTheme.typography.headlineSmall)
        BoxWithConstraints {
            val wide = maxWidth >= 700.dp
            val stats = listOf(
                "Total Jobs" to data.stats.totalJobs.toString(),
                "Applications" to data.stats.totalApplications.toString(),
                "Conversations" to data.stats.activeConversations.toString(),
                "New This Week" to data.stats.newJobsThisWeek.toString()
            )
            if (wide) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    stats.chunked(2).forEach { col ->
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            col.forEach { StatCard(it.first, it.second) }
                        }
                    }
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { stats.forEach { StatCard(it.first, it.second) } }
            }
        }
        ChartCard("Jobs by Type", data.jobsByType, Color(0xFF1565C0))
        ChartCard("Applications by Status", data.applicationsByStatus, Color(0xFF6A1B9A))
        ChartCard("Jobs Posted This Week", data.jobsPostedPerDay, Color(0xFF2E7D32))
    }
}

@Composable
private fun StatCard(label: String, value: String) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(label, style = MaterialTheme.typography.labelLarge)
            Text(value, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun ChartCard(title: String, entries: List<ChartEntry>, color: Color) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            val max = entries.maxOfOrNull { it.value }?.coerceAtLeast(1f) ?: 1f
            if (entries.isEmpty()) Text("No data available", style = MaterialTheme.typography.bodyMedium)
            entries.take(6).forEach { entry ->
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(entry.label, style = MaterialTheme.typography.bodyMedium)
                        Text(entry.value.toInt().toString(), style = MaterialTheme.typography.labelMedium)
                    }
                    Box(Modifier.fillMaxWidth().height(10.dp).background(MaterialTheme.colorScheme.surfaceVariant)) {
                        Box(Modifier.fillMaxWidth(entry.value / max).height(10.dp).background(color))
                    }
                }
            }
        }
    }
}
