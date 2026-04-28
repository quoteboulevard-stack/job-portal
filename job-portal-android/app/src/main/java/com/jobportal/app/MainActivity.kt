package com.jobportal.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.jobportal.features.applications.presentation.screen.ApplicationTrackerScreen
import com.jobportal.features.applications.presentation.screen.EmployerApplicantsScreen
import com.jobportal.features.auth.presentation.screen.ForgotPasswordScreen
import com.jobportal.features.auth.presentation.screen.LoginScreen
import com.jobportal.features.auth.presentation.screen.SignupScreen
import com.jobportal.features.auth.presentation.viewmodel.SessionViewModel
import com.jobportal.features.credits.presentation.screen.CreditShopScreen
import com.jobportal.features.dashboard.presentation.screen.DashboardScreen
import com.jobportal.features.jobs.presentation.screen.JobDetailScreen
import com.jobportal.features.jobs.presentation.screen.JobListScreen
import com.jobportal.features.jobs.presentation.screen.PostJobScreen
import com.jobportal.features.jobs.presentation.screen.SavedJobsScreen
import com.jobportal.features.messages.presentation.screen.ChatScreen
import com.jobportal.features.messages.presentation.screen.ConversationListScreen
import com.jobportal.features.messages.presentation.screen.MessageRequestsScreen
import com.jobportal.features.profile.presentation.screen.ProfileScreen
import com.jobportal.ui.theme.JobPortalTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            JobPortalTheme {
                JobPortalApp()
            }
        }
    }
}

private enum class AppRoute(val route: String, val label: String) {
    Login("login", "Login"),
    Signup("signup", "Signup"),
    ForgotPassword("forgot-password", "Forgot Password"),
    Dashboard("dashboard", "Dashboard"),
    Jobs("jobs", "Jobs"),
    JobDetail("jobs/{jobId}", "Job Detail"),
    Applications("applications", "Applications"),
    SavedJobs("saved-jobs", "Saved Jobs"),
    Conversations("conversations", "Conversations"),
    Chat("chat/{conversationId}", "Chat"),
    Credits("credits", "Credits"),
    PostJob("post-job", "Post Job"),
    EmployerApplicants("employer-applicants", "Applicants"),
    MessageRequests("message-requests", "Message Requests"),
    Profile("profile", "Profile")
}

private data class NavItem(val route: AppRoute, val visibleForEmployer: Boolean? = null)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun JobPortalApp(
    sessionViewModel: SessionViewModel = hiltViewModel()
) {
    val navController = rememberNavController()
    val context = LocalContext.current
    val session by sessionViewModel.uiState.collectAsStateWithLifecycle()
    val backStack by navController.currentBackStackEntryAsState()
    val currentDestination = backStack?.destination
    val isAuthed = session.user != null
    val isEmployer = session.user?.role?.firestoreValue == "employer"

    val navItems = listOf(
        NavItem(AppRoute.Dashboard, null),
        NavItem(AppRoute.Jobs, null),
        NavItem(AppRoute.Applications, false),
        NavItem(AppRoute.SavedJobs, false),
        NavItem(AppRoute.Conversations, null),
        NavItem(AppRoute.Credits, false),
        NavItem(AppRoute.PostJob, true),
        NavItem(AppRoute.EmployerApplicants, true),
        NavItem(AppRoute.MessageRequests, true),
        NavItem(AppRoute.Profile, null)
    ).filter { item ->
        item.visibleForEmployer == null || item.visibleForEmployer == isEmployer
    }

    var lastAuthHandled by remember { mutableStateOf(false) }
    LaunchedEffect(isAuthed) {
        if (isAuthed && !lastAuthHandled) {
            navController.navigate(AppRoute.Dashboard.route) {
                popUpTo(AppRoute.Login.route) { inclusive = true }
            }
            lastAuthHandled = true
        } else if (!isAuthed) {
            lastAuthHandled = false
            navController.navigate(AppRoute.Login.route) {
                popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        when {
                            currentDestination?.route == AppRoute.Login.route -> "Login"
                            currentDestination?.route == AppRoute.Signup.route -> "Sign Up"
                            currentDestination?.route == AppRoute.ForgotPassword.route -> "Forgot Password"
                            else -> "Job Portal"
                        }
                    )
                }
            )
        },
        bottomBar = {
            if (isAuthed) {
                NavigationBar {
                    navItems.forEach { item ->
                        val selected = currentDestination?.hierarchy?.any { it.route == item.route.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Text(item.route.label.take(1)) },
                            label = { Text(item.route.label) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = AppRoute.Login.route,
            modifier = Modifier.padding(padding)
        ) {
            composable(AppRoute.Login.route) {
                LoginScreen(
                    onSignupClick = { navController.navigate(AppRoute.Signup.route) },
                    onForgotPasswordClick = { navController.navigate(AppRoute.ForgotPassword.route) },
                    onLoginSuccess = { sessionViewModel.refresh() }
                )
            }
            composable(AppRoute.Signup.route) {
                SignupScreen(
                    onLoginClick = { navController.popBackStack() },
                    onSignupSuccess = { sessionViewModel.refresh() }
                )
            }
            composable(AppRoute.ForgotPassword.route) {
                ForgotPasswordScreen(onBackToLogin = { navController.popBackStack() })
            }
            composable(AppRoute.Dashboard.route) { DashboardScreen() }
            composable(AppRoute.Jobs.route) {
                JobListScreen(onJobClick = { id -> navController.navigate("jobs/$id") })
            }
            composable(AppRoute.JobDetail.route) { JobDetailScreen() }
            composable(AppRoute.Applications.route) { ApplicationTrackerScreen() }
            composable(AppRoute.SavedJobs.route) {
                SavedJobsScreen(onJobClick = { id -> navController.navigate("jobs/$id") })
            }
            composable(AppRoute.Conversations.route) {
                ConversationListScreen(
                    onConversationClick = { id -> navController.navigate("chat/$id") }
                )
            }
            composable(AppRoute.Chat.route) { ChatScreen() }
            composable(AppRoute.Credits.route) {
                CreditShopScreen(
                    onCheckoutOpened = { url ->
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    }
                )
            }
            composable(AppRoute.PostJob.route) {
                PostJobScreen(onJobPosted = { id -> navController.navigate("jobs/$id") })
            }
            composable(AppRoute.EmployerApplicants.route) { EmployerApplicantsScreen() }
            composable(AppRoute.MessageRequests.route) {
                MessageRequestsScreen(
                    onConversationOpened = { id -> navController.navigate("chat/$id") }
                )
            }
            composable(AppRoute.Profile.route) { ProfileScreen() }
        }
    }
}
