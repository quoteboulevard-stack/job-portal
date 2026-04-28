package com.jobportal.features.credits.domain.model

data class CreditPackage(
    val id: String,
    val title: String,
    val credits: Int,
    val priceLabel: String,
    val description: String
)
