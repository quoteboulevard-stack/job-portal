package com.jobportal.features.messages.domain.model

data class MessageRequest(
    val id: String,
    val fromUserId: String,
    val toUserId: String,
    val fromName: String?,
    val toName: String?,
    val subject: String,
    val body: String,
    val status: String,
    val createdAt: Long
)
