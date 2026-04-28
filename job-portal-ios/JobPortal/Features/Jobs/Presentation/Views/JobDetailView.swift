import SwiftUI

struct JobDetailView: View {
    @StateObject private var viewModel: JobDetailViewModel

    init(viewModel: JobDetailViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(viewModel.job.title).font(.title2.bold())
                    Text(viewModel.job.company).font(.headline)
                    Label(viewModel.job.location, systemImage: "mappin.and.ellipse")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    HStack {
                        Label(viewModel.job.workMode, systemImage: "briefcase")
                    Label(viewModel.job.employmentType, systemImage: "doc.text")
                        Spacer()
                        Text(viewModel.job.salaryText).fontWeight(.semibold)
                    }
                    .font(.subheadline)
                }

                if viewModel.job.isJobSeeker, let fitScore = viewModel.job.fitScore {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Your Fit Score").font(.headline)
                        Text("\(fitScore)% match")
                            .font(.title3.bold())
                            .foregroundStyle(.blue)
                    }
                }

                if !viewModel.job.missingSkills.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Missing Skills").font(.headline)
                        ForEach(viewModel.job.missingSkills, id: \.self) { skill in
                            Label(skill, systemImage: "exclamationmark.circle")
                                .foregroundStyle(.orange)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Job Description").font(.headline)
                    Text(viewModel.job.description)
                    Text("Requirements").font(.headline).padding(.top, 4)
                    ForEach(viewModel.job.requirements, id: \.self) { requirement in
                        Label(requirement, systemImage: "checkmark.circle")
                    }
                }

                Button(viewModel.hasApplied ? "Applied" : "Apply Now") {
                    viewModel.apply()
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .controlSize(.large)
                .disabled(viewModel.hasApplied)
            }
            .padding()
        }
        .navigationTitle("Job Details")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button(viewModel.isSaved ? "Saved" : "Save") { viewModel.toggleSave() }
                ShareLink(item: viewModel.shareText)
            }
        }
    }
}

#Preview {
    NavigationStack {
        JobDetailView(viewModel: JobDetailViewModel(job: .init(
            title: "iOS Engineer",
            company: "Acme",
            location: "Remote",
            workMode: "remote",
            employmentType: "fulltime",
            salaryText: "$120,000 / year",
            description: "Build the next generation of mobile experiences.",
            requirements: ["Swift", "SwiftUI", "Firebase"],
            fitScore: 88,
            missingSkills: ["CI/CD"],
            isJobSeeker: true
        )))
    }
}
