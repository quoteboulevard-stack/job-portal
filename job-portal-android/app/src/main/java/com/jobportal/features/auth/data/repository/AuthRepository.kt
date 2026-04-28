package com.jobportal.features.auth.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.firestore.FirebaseFirestore
import com.jobportal.features.auth.domain.model.User
import com.jobportal.features.auth.domain.model.UserRole
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

sealed class AuthResult {
    data class Success(val user: User) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

@Singleton
class AuthRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) {
    suspend fun login(email: String, password: String): AuthResult = runCatching {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        val firebaseUser = result.user ?: error("Authentication failed")
        val role = fetchRole(firebaseUser.uid)
        User(
            uid = firebaseUser.uid,
            email = firebaseUser.email.orEmpty(),
            displayName = firebaseUser.displayName,
            role = role
        )
    }.fold(
        onSuccess = { AuthResult.Success(it) },
        onFailure = { AuthResult.Error(mapAuthError(it)) }
    )

    suspend fun signup(
        email: String,
        password: String,
        displayName: String,
        role: UserRole = UserRole.JOB_SEEKER
    ): AuthResult = runCatching {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val firebaseUser = result.user ?: error("Account creation failed")
        firestore.collection("users").document(firebaseUser.uid)
            .set(mapOf("role" to role.firestoreValue, "email" to email, "displayName" to displayName))
            .await()
        User(
            uid = firebaseUser.uid,
            email = email,
            displayName = displayName,
            role = role
        )
    }.fold(
        onSuccess = { AuthResult.Success(it) },
        onFailure = { AuthResult.Error(mapAuthError(it)) }
    )

    suspend fun getCurrentUser(): AuthResult {
        val firebaseUser = auth.currentUser
            ?: return AuthResult.Error("No authenticated user")
        return runCatching {
            val role = fetchRole(firebaseUser.uid)
            User(
                uid = firebaseUser.uid,
                email = firebaseUser.email.orEmpty(),
                displayName = firebaseUser.displayName,
                role = role
            )
        }.fold(
            onSuccess = { AuthResult.Success(it) },
            onFailure = { AuthResult.Error(it.message ?: "Failed to load user") }
        )
    }

    fun logout() = auth.signOut()

    suspend fun sendPasswordReset(email: String): AuthResult = runCatching {
        auth.sendPasswordResetEmail(email.trim()).await()
        User(
            uid = "",
            email = email.trim(),
            displayName = null,
            role = UserRole.JOB_SEEKER
        )
    }.fold(
        onSuccess = { AuthResult.Success(it) },
        onFailure = { AuthResult.Error(it.message ?: "Failed to send password reset email") }
    )

    suspend fun updateProfile(uid: String, displayName: String, role: UserRole): AuthResult = runCatching {
        firestore.collection("users").document(uid)
            .set(
                mapOf(
                    "displayName" to displayName.trim(),
                    "role" to role.firestoreValue
                ),
                com.google.firebase.firestore.SetOptions.merge()
            )
            .await()
        val currentUser = auth.currentUser
        User(
            uid = uid,
            email = currentUser?.email.orEmpty(),
            displayName = displayName.trim(),
            role = role
        )
    }.fold(
        onSuccess = { AuthResult.Success(it) },
        onFailure = { AuthResult.Error(it.message ?: "Failed to update profile") }
    )

    private suspend fun fetchRole(uid: String): UserRole {
        val doc = firestore.collection("users").document(uid).get().await()
        return UserRole.fromFirestore(doc.getString("role"))
    }

    private fun mapAuthError(e: Throwable): String = when (e) {
        is FirebaseAuthInvalidCredentialsException -> "Invalid email or password"
        is FirebaseAuthUserCollisionException -> "An account with this email already exists"
        is FirebaseAuthWeakPasswordException -> "Password must be at least 6 characters"
        else -> e.message ?: "An unexpected error occurred"
    }
}
