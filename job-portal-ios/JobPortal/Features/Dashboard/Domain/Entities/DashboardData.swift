import Foundation

struct DashboardData {
    let stats: Stats
    let fitScoreBins: [FitScoreBin]
    let skills: [SkillStat]

    struct Stats {
        let applications: Int
        let offers: Int
        let profileViews: Int
    }

    struct FitScoreBin: Identifiable {
        let range: String
        let count: Int
        var id: String { range }
    }

    struct SkillStat: Identifiable {
        let skill: String
        let level: Int
        var id: String { skill }
    }
}
