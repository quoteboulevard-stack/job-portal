package com.jobportal.features.jobs.domain.model

data class Job(
    val id: String,
    val title: String,
    val company: String,
    val location: String,
    val description: String,
    val salary: String?,
    val workMode: WorkMode,
    val employmentType: EmploymentType,
    val skills: List<String>,
    val employerId: String,
    val postedAt: Long
)

enum class WorkMode(val value: String) {
    REMOTE("remote"), HYBRID("hybrid"), ONSITE("onsite");
    companion object {
        fun from(s: String?): WorkMode = entries.firstOrNull { it.value == s?.lowercase() } ?: ONSITE
    }
}

enum class EmploymentType(val value: String) {
    FULLTIME("fulltime"), PARTTIME("parttime"), CONTRACT("contract"),
    INTERNSHIP("internship"), FREELANCE("freelance");
    companion object {
        fun from(s: String?): EmploymentType = entries.firstOrNull { it.value == s?.lowercase() } ?: FULLTIME
    }
}
