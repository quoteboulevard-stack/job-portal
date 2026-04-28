package com.jobportal.features.credits.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.functions.FirebaseFunctions
import com.jobportal.BuildConfig
import com.jobportal.features.credits.domain.model.CreditPackage
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.tasks.await

sealed class CreditResult<out T> {
    data class Success<T>(val data: T) : CreditResult<T>()
    data class Error(val message: String) : CreditResult<Nothing>()
}

data class CreditSummary(
    val available: Int = 0,
    val used: Int = 0,
    val total: Int = 0
)

@Singleton
class CreditRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
    private val functions: FirebaseFunctions
) {
    fun packages(): List<CreditPackage> = listOf(
        CreditPackage(
            id = "starter",
            title = "Starter",
            credits = 10,
            priceLabel = "$9",
            description = "Light usage for first outreach and quick tests."
        ),
        CreditPackage(
            id = "growth",
            title = "Growth",
            credits = 25,
            priceLabel = "$19",
            description = "Balanced pack for ongoing job search conversations."
        ),
        CreditPackage(
            id = "pro",
            title = "Pro",
            credits = 60,
            priceLabel = "$39",
            description = "Best value for active applicants and frequent messaging."
        )
    )

    suspend fun loadSummary(): CreditResult<CreditSummary> = runCatching {
        val uid = auth.currentUser?.uid ?: error("No authenticated user")
        val doc = firestore.collection("users").document(uid).get().await()
        val available = (doc.getLong("balance") ?: 0L).toInt()
        val total = (doc.getLong("totalAdded") ?: available.toLong()).toInt()
        CreditSummary(
            available = available,
            used = (total - available).coerceAtLeast(0),
            total = total.coerceAtLeast(available)
        )
    }.fold(
        onSuccess = { CreditResult.Success(it) },
        onFailure = { CreditResult.Error(it.message ?: "Failed to load credits") }
    )

    suspend fun createCheckout(packageId: String): CreditResult<String> = runCatching {
        check(BuildConfig.CREDIT_CHECKOUT_ORIGIN.isNotBlank()) {
            "CREDIT_CHECKOUT_ORIGIN is not configured"
        }
        auth.currentUser?.uid ?: error("No authenticated user")
        val result = functions.getHttpsCallable("createCreditCheckoutSession")
            .call(
                mapOf(
                    "packageId" to packageId,
                    "origin" to BuildConfig.CREDIT_CHECKOUT_ORIGIN
                )
            )
            .await()
        val data = result.data as? Map<*, *> ?: emptyMap<Any?, Any?>()
        data["url"] as? String ?: error("Checkout URL missing")
    }.fold(
        onSuccess = { CreditResult.Success(it) },
        onFailure = { CreditResult.Error(it.message ?: "Failed to create checkout session") }
    )
}
