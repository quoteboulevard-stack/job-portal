package com.jobportal.features.dashboard.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.jobportal.features.dashboard.domain.model.ChartEntry
import com.jobportal.features.dashboard.domain.model.DashboardData
import com.jobportal.features.dashboard.domain.model.DashboardStats
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

sealed class DashboardResult {
    data class Success(val data: DashboardData) : DashboardResult()
    data class Error(val message: String) : DashboardResult()
}

private data class CacheEntry(val data: DashboardData, val timestamp: Long)

@Singleton
class DashboardRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    private var cache: CacheEntry? = null
    private val cacheTtlMs = TimeUnit.MINUTES.toMillis(5)

    suspend fun getDashboardData(userId: String, isEmployer: Boolean): DashboardResult {
        cache?.let { if (System.currentTimeMillis() - it.timestamp < cacheTtlMs) return DashboardResult.Success(it.data) }

        return runCatching {
            coroutineScope {
                val jobsDeferred = async { firestore.collection("jobs").get().await() }
                val appsDeferred = async {
                    val field = if (isEmployer) "employerId" else "applicantId"
                    firestore.collection("applications").whereEqualTo(field, userId).get().await()
                }
                val convsDeferred = async {
                    val field = if (isEmployer) "employerId" else "jobSeekerId"
                    firestore.collection("conversations")
                        .whereEqualTo(field, userId).get().await()
                }

                val jobs = jobsDeferred.await()
                val apps = appsDeferred.await()
                val convs = convsDeferred.await()

                val weekAgo = System.currentTimeMillis() - TimeUnit.DAYS.toMillis(7)
                val dayFmt = SimpleDateFormat("EEE", Locale.getDefault())

                val jobsByType = jobs.documents
                    .groupBy { it.getString("type") ?: "UNKNOWN" }
                    .map { (type, docs) -> ChartEntry(type.replace("_", " "), docs.size.toFloat()) }

                val appsByStatus = apps.documents
                    .groupBy { it.getString("status") ?: "PENDING" }
                    .map { (status, docs) -> ChartEntry(status.replace("_", " "), docs.size.toFloat()) }

                val jobsPerDay = jobs.documents
                    .filter { (it.getLong("postedAt") ?: 0L) >= weekAgo }
                    .groupBy { dayFmt.format(Date(it.getLong("postedAt") ?: 0L)) }
                    .map { (day, docs) -> ChartEntry(day, docs.size.toFloat()) }

                DashboardData(
                    stats = DashboardStats(
                        totalJobs = jobs.size(),
                        totalApplications = apps.size(),
                        activeConversations = convs.size(),
                        newJobsThisWeek = jobs.documents.count { (it.getLong("postedAt") ?: 0L) >= weekAgo }
                    ),
                    jobsByType = jobsByType,
                    applicationsByStatus = appsByStatus,
                    jobsPostedPerDay = jobsPerDay
                )
            }
        }.fold(
            onSuccess = { data ->
                cache = CacheEntry(data, System.currentTimeMillis())
                DashboardResult.Success(data)
            },
            onFailure = { DashboardResult.Error(it.message ?: "Failed to load dashboard") }
        )
    }

    fun invalidateCache() { cache = null }
}