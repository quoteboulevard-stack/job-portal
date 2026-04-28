package com.jobportal.features.messages.domain.model

data class Message(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val text: String,
    val sentAt: Long,
    val readBy: List<String>
)

data class Conversation(
    val id: String,
    val jobSeekerId: String,
    val employerId: String,
    val status: String,
    val messageId: String,
    val title: String?,
    val counterpartName: String?,
    val lastMessage: String?,
    val lastMessageAt: Long
)
