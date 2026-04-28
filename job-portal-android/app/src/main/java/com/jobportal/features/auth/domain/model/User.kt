package com.jobportal.features.auth.domain.model

enum class UserRole(val firestoreValue: String) {
    JOB_SEEKER("job_seeker"),
    EMPLOYER("employer"),
    ADMIN("admin");

    companion object {
        fun fromFirestore(value: String?): UserRole =
            entries.firstOrNull { it.firestoreValue == value } ?: JOB_SEEKER
    }
}

data class User(
    val uid: String,
    val email: String,
    val displayName: String?,
    val role: UserRole
)