import Charts
import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel: DashboardViewModel
    @Environment(\.horizontalSizeClass) private var sizeClass

    init(viewModel: DashboardViewModel = DashboardViewModel()) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                statsSection
                chartSection
            }
            .padding()
        }
        .navigationTitle("Dashboard")
        .task { await viewModel.loadDashboard() }
    }

    private var statsSection: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: sizeClass == .regular ? 3 : 1), spacing: 12) {
            if viewModel.isLoading {
                ForEach(0..<3, id: \.self) { _ in loadingCard.frame(height: 96) }
            } else {
                ForEach(viewModel.stats) { stat in
                    VStack(alignment: .leading, spacing: 10) {
                        Image(systemName: stat.symbol).font(.title3).foregroundStyle(.blue)
                        Text("\(stat.value)").font(.title2.bold())
                        Text(stat.title).font(.subheadline).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.background, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(.quaternary))
                }
            }
        }
    }

    private var chartSection: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 16), count: sizeClass == .regular ? 2 : 1), spacing: 16) {
            chartCard("Fit Score Distribution") {
                if viewModel.isLoading {
                    loadingCard.frame(height: 220)
                } else {
                    Chart(viewModel.fitScores) { item in
                        BarMark(x: .value("Range", item.range), y: .value("Jobs", item.count))
                            .foregroundStyle(.blue.gradient)
                    }
                    .frame(height: 220)
                }
            }
            chartCard("Top Skills") {
                if viewModel.isLoading {
                    loadingCard.frame(height: 220)
                } else {
                    Chart(viewModel.skills) { item in
                        BarMark(x: .value("Level", item.level), y: .value("Skill", item.skill))
                            .foregroundStyle(.green.gradient)
                    }
                    .frame(height: 220)
                }
            }
        }
    }

    private func chartCard<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.headline)
            content()
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(.quaternary))
    }

    private var loadingCard: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color(.systemGray6))
            .overlay(ProgressView())
    }
}

#Preview {
    NavigationStack {
        DashboardView()
    }
}
