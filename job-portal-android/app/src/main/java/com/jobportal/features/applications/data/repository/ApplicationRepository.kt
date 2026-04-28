package com.jobportal.features.applications.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.jobportal.features.applications.domain.model.Application
import com.jobportal.features.applications.domain.model.ApplicationStatus
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

sealed class ApplicationResult<out T> {
    data class Success<T>(val data: T) : ApplicationResult<T>()
    data class Error(val message: String) : ApplicationResult<Nothing>()
}

@Singleton
class ApplicationRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun fetchApplicationsForUser(userId: String): ApplicationResult<List<Application>> =
        runCatching {
            val snapshots = listOf("userId", "applicantId").mapNotNull { field ->
                runCatching {
                    firestore.collection("applications")
                        .whereEqualTo(field, userId)
                        .orderBy("appliedAt", Query.Direction.DESCENDING)
                        .get()
                        .await()
                }.getOrNull()
            }

            val unique = linkedMapOf<String, Application>()
            snapshots.flatMap { it.documents }
                .mapNotNull { doc -> doc.toApplication() }
                .sortedByDescending { it.appliedAt }
                .forEach { unique[it.id] = it }
            unique.values.toList()
        }.fold(
            onSuccess = { ApplicationResult.Success(it) },
            onFailure = { ApplicationResult.Error(it.message ?: "Failed to load applications") }
        )

    suspend fun fetchApplicantsForEmployer(employerId: String): ApplicationResult<List<Application>> =
        runCatching {
            val jobSnapshots = firestore.collection("jobs")
                .whereEqualTo("employerId", employerId)
                .get()
                .await()

            val jobsById = jobSnapshots.documents.associateBy({ it.id }, { doc ->
                mapOf(
                    "title" to (doc.getString("title") ?: ""),
                    "company" to (doc.getString("company") ?: ""),
                    "location" to (doc.getString("location") ?: ""),
                    "salary" to (doc.getString("salary") ?: "")
                )
            })

            val snapshots = listOf("employerId").mapNotNull { field ->
                runCatching {
                    firestore.collection("applications")
                        .whereEqualTo(field, employerId)
                        .orderBy("appliedAt", Query.Direction.DESCENDING)
                        .get()
                        .await()
                }.getOrNull()
            }

            val derivedByJobs = if (snapshots.any { !it.isEmpty }) {
                emptyList()
            } else {
                jobSnapshots.documents.flatMap { jobDoc ->
                    runCatching {
                        firestore.collection("applications")
                            .whereEqualTo("jobId", jobDoc.id)
                            .orderBy("appliedAt", Query.Direction.DESCENDING)
                            .get()
                            .await()
                            .documents
                    }.getOrDefault(emptyList())
                }
            }

            val unique = linkedMapOf<String, Application>()
            (snapshots.flatMap { it.documents } + derivedByJobs)
                .mapNotNull { doc -> doc.toApplication(jobsById[doc.getString("jobId")]) }
                .sortedByDescending { it.appliedAt }
                .forEach { unique[it.id] = it }
            unique.values.toList()
        }.fold(
            onSuccess = { ApplicationResult.Success(it) },
            onFailure = { ApplicationResult.Error(it.message ?: "Failed to load applicants") }
        )

    suspend fun updateApplicationStatus(
        applicationId: String,
        status: ApplicationStatus
    ): ApplicationResult<Unit> = runCatching {
        firestore.collection("applications")
            .document(applicationId)
            .update(
                mapOf(
                    "status" to status.name,
                    "updatedAt" to System.currentTimeMillis()
                )
            )
            .await()
    }.fold(
        onSuccess = { ApplicationResult.Success(Unit) },
        onFailure = { ApplicationResult.Error(it.message ?: "Failed to update application status") }
    )

    private fun com.google.firebase.firestore.DocumentSnapshot.toApplication(
        jobMeta: Map<String, String>? = null
    ): Application? =
        runCatching {
            Application(
                id = id,
                jobId = getString("jobId") ?: return null,
                userId = getString("userId") ?: getString("applicantId") ?: return null,
                status = ApplicationStatus.fromFirestore(getString("status")),
                appliedAt = getLong("appliedAt") ?: 0L,
                updatedAt = getLong("updatedAt") ?: getLong("appliedAt") ?: 0L,
                jobTitle = getString("jobTitle") ?: jobMeta?.get("title"),
                company = getString("company") ?: jobMeta?.get("company"),
                location = getString("location") ?: jobMeta?.get("location"),
                salary = getString("salary") ?: jobMeta?.get("salary")
            )
        }.getOrNull()
}
