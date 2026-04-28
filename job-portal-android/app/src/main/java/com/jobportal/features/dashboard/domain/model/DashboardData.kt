package com.jobportal.features.dashboard.domain.model

data class ChartEntry(val label: String, val value: Float)

data class DashboardStats(
    val totalJobs: Int,
    val totalApplications: Int,
    val activeConversations: Int,
    val newJobsThisWeek: Int
)

data class DashboardData(
    val stats: DashboardStats,
    val jobsByType: List<ChartEntry>,
    val applicationsByStatus: List<ChartEntry>,
    val jobsPostedPerDay: List<ChartEntry>
)