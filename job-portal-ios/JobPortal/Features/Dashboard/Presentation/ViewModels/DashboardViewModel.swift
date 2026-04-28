import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
    struct StatCard: Identifiable {
        let id = UUID()
        let title: String
        let value: Int
        let symbol: String
    }

    struct FitScoreBin: Identifiable {
        let id = UUID()
        let range: String
        let count: Int
    }

    struct SkillStat: Identifiable {
        let id = UUID()
        let skill: String
        let level: Int
    }

    @Published private(set) var stats: [StatCard] = []
    @Published private(set) var fitScores: [FitScoreBin] = []
    @Published private(set) var skills: [SkillStat] = []
    @Published private(set) var isLoading = false

    func loadDashboard() async {
        guard !isLoading, stats.isEmpty else { return }
        isLoading = true
        defer { isLoading = false }

        try? await Task.sleep(nanoseconds: 350_000_000)
        stats = [
            .init(title: "Applications", value: 24, symbol: "doc.text"),
            .init(title: "Offers", value: 3, symbol: "briefcase.fill"),
            .init(title: "Profile Views", value: 128, symbol: "eye.fill")
        ]
        fitScores = [
            .init(range: "50-59", count: 2),
            .init(range: "60-69", count: 4),
            .init(range: "70-79", count: 7),
            .init(range: "80-89", count: 5),
            .init(range: "90-100", count: 2)
        ]
        skills = [
            .init(skill: "Swift", level: 92),
            .init(skill: "SwiftUI", level: 88),
            .init(skill: "Firebase", level: 74),
            .init(skill: "System Design", level: 61)
        ]
    }
}
