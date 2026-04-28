package com.jobportal.features.jobs.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.functions.FirebaseFunctions
import com.jobportal.features.jobs.domain.model.EmploymentType
import com.jobportal.features.jobs.domain.model.Job
import com.jobportal.features.jobs.domain.model.WorkMode
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

sealed class JobResult<out T> {
    data class Success<T>(val data: T) : JobResult<T>()
    data class Error(val message: String) : JobResult<Nothing>()
}

@Singleton
class JobRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val functions: FirebaseFunctions
) {
    private val collection get() = firestore.collection("jobs")

    suspend fun fetchJobs(limit: Long = 20, lastDocId: String? = null): JobResult<List<Job>> =
        runCatching {
            var query = collection
                .orderBy("postedAt", Query.Direction.DESCENDING)
                .limit(limit)

            if (lastDocId != null) {
                val lastSnap = collection.document(lastDocId).get().await()
                query = query.startAfter(lastSnap)
            }

            query.get().await().documents.mapNotNull { it.toJob() }
        }.toJobResult()

    suspend fun getJobById(id: String): JobResult<Job> = runCatching {
        val doc = collection.document(id).get().await()
        doc.toJob() ?: error("Job not found")
    }.toJobResult()

    suspend fun createJob(
        title: String,
        company: String,
        location: String,
        description: String,
        salary: String?,
        workMode: WorkMode,
        employmentType: EmploymentType,
        tags: List<String>
    ): JobResult<String> = runCatching {
        require(title.isNotBlank()) { "Title is required" }
        require(company.isNotBlank()) { "Company is required" }
        require(location.isNotBlank()) { "Location is required" }
        require(description.isNotBlank()) { "Description is required" }

        val result = functions
            .getHttpsCallable("createJob")
            .call(mapOf(
                "title"          to title.trim(),
                "company"        to company.trim(),
                "location"       to location.trim(),
                "description"    to description.trim(),
                "salary"         to salary?.trim()?.toDoubleOrNull(),
                "workMode"       to workMode.value,
                "employmentType" to employmentType.value,
                "experience"     to "mid",
                "skills"         to tags.map { it.trim() }.filter { it.isNotBlank() },
                "requirements"   to emptyList<String>(),
                "perks"          to emptyList<String>()
            ))
            .await()

        val data = result.data as? Map<*, *> ?: error("Invalid response from createJob")
        data["jobId"] as? String ?: error("jobId missing in response")
    }.toJobResult()

    suspend fun searchJobs(
        query: String,
        workMode: WorkMode? = null,
        employmentType: EmploymentType? = null,
        location: String? = null,
        limit: Long = 20
    ): JobResult<List<Job>> = runCatching {
        val normalized = query.trim().lowercase()

        var fsQuery: Query = collection.limit(limit * 5)
        workMode?.let { fsQuery = fsQuery.whereEqualTo("workMode", it.value) }
        employmentType?.let { fsQuery = fsQuery.whereEqualTo("employmentType", it.value) }
        location?.let { fsQuery = fsQuery.whereEqualTo("location", it) }

        fsQuery.get().await().documents
            .mapNotNull { it.toJob() }
            .filter { job ->
                normalized.isEmpty() ||
                    job.title.lowercase().contains(normalized) ||
                    job.company.lowercase().contains(normalized) ||
                    job.tags.any { it.lowercase().contains(normalized) }
            }
            .take(limit.toInt())
    }.toJobResult()

    suspend fun fetchSavedJobs(userId: String): JobResult<List<Job>> = runCatching {
        val savedDocs = firestore.collection("saved_jobs")
            .whereEqualTo("userId", userId)
            .get()
            .await()
            .documents
            .sortedByDescending { it.getLong("savedAt") ?: 0L }

        val savedIds = savedDocs.mapNotNull { it.getString("jobId") }

        savedIds.mapNotNull { jobId ->
            collection.document(jobId).get().await().toJob()
        }
    }.toJobResult()

    private fun com.google.firebase.firestore.DocumentSnapshot.toJob(): Job? {
        return try {
            // Backward-compat: old docs stored location+employment in a single "mode"/"type" field.
            val legacyMode = getString("mode") ?: getString("type") ?: ""
            val workModeStr = getString("workMode") ?: if (legacyMode == "remote") "remote" else "onsite"
            val employmentTypeStr = getString("employmentType") ?: if (legacyMode != "remote") legacyMode else "fulltime"

            Job(
                id = id,
                title = getString("title") ?: return null,
                company = getString("company") ?: return null,
                location = getString("location") ?: return null,
                description = getString("description") ?: return null,
                salary = getString("salary"),
                workMode = WorkMode.from(workModeStr),
                employmentType = EmploymentType.from(employmentTypeStr),
                skills = (get("skills") as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
                employerId = getString("employerId") ?: return null,
                postedAt = getTimestamp("postedAt")?.toDate()?.time ?: 0L
            )
        } catch (e: Exception) {
            null
        }
    }

    private fun <T> Result<T>.toJobResult(): JobResult<T> = fold(
        onSuccess = { JobResult.Success(it) },
        onFailure = { JobResult.Error(it.message ?: "An unexpected error occurred") }
    )
}
