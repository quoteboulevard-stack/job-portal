package com.jobportal.features.profile.data.repository

import android.net.Uri
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.storage.FirebaseStorage
import com.jobportal.features.auth.domain.model.UserRole
import com.jobportal.features.profile.domain.model.Profile
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

sealed class ProfileResult<out T> {
    data class Success<T>(val data: T) : ProfileResult<T>()
    data class Error(val message: String) : ProfileResult<Nothing>()
}

@Singleton
class ProfileRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
    private val storage: FirebaseStorage
) {
    suspend fun loadProfile(): ProfileResult<Profile> = runCatching {
        val user = auth.currentUser ?: error("No authenticated user")
        val userDoc = firestore.collection("users").document(user.uid).get().await()
        val resumeDoc = firestore.collection("resumes").document(user.uid).get().await()

        Profile(
            uid = user.uid,
            email = user.email.orEmpty(),
            displayName = userDoc.getString("displayName") ?: user.displayName.orEmpty(),
            role = UserRole.fromFirestore(userDoc.getString("role")),
            skills = (userDoc.get("skills") as? List<*>)?.filterIsInstance<String>().orEmpty(),
            resumeName = resumeDoc.get("meta.fileName") as? String,
            resumeStatus = resumeDoc.getString("status"),
            resumeError = resumeDoc.getString("error")
        )
    }.fold(
        onSuccess = { ProfileResult.Success(it) },
        onFailure = { ProfileResult.Error(it.message ?: "Failed to load profile") }
    )

    suspend fun updateProfile(displayName: String, skills: List<String>): ProfileResult<Unit> = runCatching {
        val user = auth.currentUser ?: error("No authenticated user")
        firestore.collection("users").document(user.uid)
            .set(
                mapOf(
                    "displayName" to displayName.trim(),
                    "skills" to skills
                ),
                SetOptions.merge()
            )
            .await()
    }.fold(
        onSuccess = { ProfileResult.Success(Unit) },
        onFailure = { ProfileResult.Error(it.message ?: "Failed to update profile") }
    )

    suspend fun uploadResume(fileUri: Uri): ProfileResult<Unit> = runCatching {
        val user = auth.currentUser ?: error("No authenticated user")
        val ref = storage.reference.child("resumes/${user.uid}/${System.currentTimeMillis()}-resume.pdf")
        ref.putFile(fileUri).await()
    }.fold(
        onSuccess = { ProfileResult.Success(Unit) },
        onFailure = { ProfileResult.Error(it.message ?: "Failed to upload resume") }
    )
}
