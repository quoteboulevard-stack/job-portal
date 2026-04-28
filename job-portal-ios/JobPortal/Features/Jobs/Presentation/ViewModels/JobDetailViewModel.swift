import Foundation

@MainActor
final class JobDetailViewModel: ObservableObject {
    struct Job: Identifiable, Hashable {
        let id = UUID()
        let title: String
        let company: String
        let location: String
        let workMode: String
        let employmentType: String
        let salaryText: String
        let description: String
        let requirements: [String]
        let fitScore: Int?
        let missingSkills: [String]
        let isJobSeeker: Bool
    }

    @Published private(set) var job: Job
    @Published private(set) var isSaved = false
    @Published private(set) var hasApplied = false

    init(job: Job) {
        self.job = job
    }

    convenience init(job: JobListViewModel.Job, isJobSeeker: Bool = true) {
        self.init(job: Job(
            title: job.title,
            company: job.company,
            location: job.location,
            workMode: job.mode.rawValue,
            employmentType: "fulltime",
            salaryText: "$\(job.salary.formatted()) / year",
            description: "Join \(job.company) to build high-impact products and collaborate across design, engineering, and product.",
            requirements: ["3+ years of experience", "Strong communication", "Experience shipping production features"],
            fitScore: isJobSeeker ? job.fitScore : nil,
            missingSkills: ["System Design", "SwiftUI Testing"],
            isJobSeeker: isJobSeeker
        ))
    }

    func toggleSave() {
        isSaved.toggle()
    }

    func apply() {
        hasApplied = true
    }

    var shareText: String {
        "\(job.title) at \(job.company) in \(job.location)"
    }
}
