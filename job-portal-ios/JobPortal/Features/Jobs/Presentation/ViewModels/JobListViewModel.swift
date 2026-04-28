import Foundation

@MainActor
final class JobListViewModel: ObservableObject {
    struct Job: Identifiable, Hashable {
        let id = UUID()
        let title: String
        let company: String
        let location: String
        let mode: Mode
        let salary: Int
        let fitScore: Int
    }

    enum Mode: String, CaseIterable, Identifiable {
        case all = "All", remote = "Remote", hybrid = "Hybrid", onsite = "On-site"
        var id: String { rawValue }
    }

    @Published var searchText = ""
    @Published var selectedMode: Mode = .all
    @Published var locationFilter = ""
    @Published var minimumSalary = 0
    @Published private(set) var jobs: [Job] = []
    @Published private(set) var isLoading = false

    private let pageSize = 10
    private let allJobs = (1...40).map { index in
        Job(
            title: ["iOS Engineer", "Backend Developer", "Product Designer", "QA Engineer"][index % 4],
            company: ["Acme", "Nova Labs", "PixelWorks", "CloudNine"][index % 4],
            location: ["New York", "San Francisco", "Remote", "Austin"][index % 4],
            mode: [.remote, .hybrid, .onsite, .remote][index % 4],
            salary: 60000 + index * 4000,
            fitScore: 60 + (index % 5) * 8
        )
    }

    var filteredJobs: [Job] {
        jobs.filter {
            (searchText.isEmpty || [$0.title, $0.company].joined(separator: " ").localizedCaseInsensitiveContains(searchText)) &&
            (selectedMode == .all || $0.mode == selectedMode) &&
            (locationFilter.isEmpty || $0.location.localizedCaseInsensitiveContains(locationFilter)) &&
            $0.salary >= minimumSalary
        }
    }

    func loadInitialJobs() async {
        guard jobs.isEmpty else { return }
        await loadMoreIfNeeded(currentItem: nil)
    }

    func loadMoreIfNeeded(currentItem: Job?) async {
        guard !isLoading else { return }
        if let currentItem, currentItem != jobs.suffix(3).first { return }
        guard jobs.count < allJobs.count else { return }

        isLoading = true
        defer { isLoading = false }
        try? await Task.sleep(nanoseconds: 250_000_000)
        let nextPage = allJobs.dropFirst(jobs.count).prefix(pageSize)
        jobs.append(contentsOf: nextPage)
    }
}
