package com.jobportal.features.profile.domain.model

import com.jobportal.features.auth.domain.model.UserRole

data class Profile(
    val uid: String,
    val email: String,
    val displayName: String,
    val role: UserRole,
    val skills: List<String>,
    val resumeName: String?,
    val resumeStatus: String?,
    val resumeError: String?
)
