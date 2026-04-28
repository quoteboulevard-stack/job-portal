package com.jobportal.features.applications.domain.model

enum class ApplicationStatus {
    APPLIED,
    SHORTLISTED,
    INTERVIEW,
    OFFER,
    REJECTED;

    companion object {
        fun fromFirestore(value: String?): ApplicationStatus =
            entries.firstOrNull { it.name.equals(value?.trim(), ignoreCase = true) } ?: APPLIED
    }
}

data class Application(
    val id: String,
    val jobId: String,
    val userId: String,
    val status: ApplicationStatus,
    val appliedAt: Long,
    val updatedAt: Long,
    val jobTitle: String?,
    val company: String?,
    val location: String?,
    val salary: String?
)
