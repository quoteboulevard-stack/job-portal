import SwiftUI

struct JobListView<JobDetail: View>: View {
    @StateObject private var viewModel: JobListViewModel
    private let destination: (JobListViewModel.Job) -> JobDetail

    init(
        viewModel: JobListViewModel = JobListViewModel(),
        @ViewBuilder destination: @escaping (JobListViewModel.Job) -> JobDetail
    ) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.destination = destination
    }

    var body: some View {
        NavigationSplitView {
            Form {
                Picker("Mode", selection: $viewModel.selectedMode) {
                    ForEach(JobListViewModel.Mode.allCases) { Text($0.rawValue).tag($0) }
                }
                TextField("Location", text: $viewModel.locationFilter)
                VStack(alignment: .leading, spacing: 8) {
                    Text("Minimum Salary: $\(viewModel.minimumSalary)")
                    Slider(value: salaryBinding, in: 0...200000, step: 5000)
                }
            }
            .navigationTitle("Filters")
        } detail: {
            NavigationStack {
                List {
                    ForEach(viewModel.filteredJobs) { job in
                        NavigationLink(value: job) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(job.title).font(.headline)
                                Text(job.company).font(.subheadline).foregroundStyle(.secondary)
                                HStack {
                                    Label(job.location, systemImage: "mappin.and.ellipse")
                                    Spacer()
                                    Text("Fit \(job.fitScore)%").fontWeight(.semibold)
                                }
                                .font(.footnote)
                            }
                            .task { await viewModel.loadMoreIfNeeded(currentItem: job) }
                        }
                    }

                    if viewModel.isLoading {
                        HStack { Spacer(); ProgressView(); Spacer() }
                    }
                }
                .navigationTitle("Jobs")
                .searchable(text: $viewModel.searchText, prompt: "Search jobs")
                .navigationDestination(for: JobListViewModel.Job.self, destination: destination)
                .task { await viewModel.loadInitialJobs() }
            }
        }
    }

    private var salaryBinding: Binding<Double> {
        Binding(
            get: { Double(viewModel.minimumSalary) },
            set: { viewModel.minimumSalary = Int($0) }
        )
    }
}

extension JobListView where JobDetail == EmptyView {
    init(viewModel: JobListViewModel = JobListViewModel()) {
        self.init(viewModel: viewModel) { _ in EmptyView() }
    }
}

#Preview {
    JobListView { job in
        Text(job.title)
    }
}
