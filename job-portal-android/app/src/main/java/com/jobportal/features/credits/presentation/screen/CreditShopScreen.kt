package com.jobportal.features.credits.presentation.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.jobportal.features.credits.domain.model.CreditPackage
import com.jobportal.features.credits.presentation.viewmodel.CreditShopViewModel

@Composable
fun CreditShopScreen(
    onCheckoutOpened: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: CreditShopViewModel = hiltViewModel()
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
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Credits", style = MaterialTheme.typography.headlineSmall)
        }
        item {
            CreditSummaryCard(
                available = state.summary.available,
                used = state.summary.used,
                total = state.summary.total
            )
        }
        state.error?.let { message ->
            item { Text(message, color = MaterialTheme.colorScheme.error) }
        }
        items(state.packages, key = { it.id }) { pkg ->
            CreditPackageCard(
                pkg = pkg,
                selected = state.selectedPackageId == pkg.id,
                onSelect = { viewModel.selectPackage(pkg.id) }
            )
        }
        item {
            Button(
                onClick = { viewModel.startCheckout(onCheckoutOpened) },
                enabled = !state.isCreatingCheckout,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (state.isCreatingCheckout) "Opening checkout..." else "Continue to checkout")
            }
        }
        item {
            Button(
                onClick = viewModel::loadCredits,
                enabled = !state.isCreatingCheckout,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Refresh balance")
            }
        }
    }
}

@Composable
private fun CreditSummaryCard(
    available: Int,
    used: Int,
    total: Int
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text("Available: $available", style = MaterialTheme.typography.titleMedium)
            Text("Used: $used", style = MaterialTheme.typography.bodyMedium)
            Text("Total purchased: $total", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun CreditPackageCard(
    pkg: CreditPackage,
    selected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        onClick = onSelect,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(selected = selected, onClick = onSelect)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("${pkg.title} • ${pkg.priceLabel}", style = MaterialTheme.typography.titleMedium)
                Text("${pkg.credits} credits", style = MaterialTheme.typography.bodyMedium)
                Text(pkg.description, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
