import FirebaseAuth
import FirebaseFirestore
import Foundation

final class DashboardRepository {
    static let shared = DashboardRepository()
    private init() {}

    private let db = Firestore.firestore()
    private var cache: DashboardData?
    private var cacheExpiry: Date = .distantPast

    func fetchDashboard() async throws -> DashboardData {
        if Date() < cacheExpiry, let hit = cache { return hit }
        guard let uid = Auth.auth().currentUser?.uid else {
            throw DashboardRepositoryError.unauthenticated
        }
        do {
            async let appsSnap = db.collection("applications")
                .whereField("candidateId", isEqualTo: uid).getDocuments()
            async let userSnap = db.collection("users").document(uid).getDocument()
            let (apps, user) = try await (appsSnap, userSnap)
            let data = Self.build(apps: apps.documents, user: user)
            cache = data
            cacheExpiry = Date(timeIntervalSinceNow: 300)
            return data
        } catch let e as DashboardRepositoryError { throw e }
        catch { throw DashboardRepositoryError(error) }
    }

    func invalidateCache() { cache = nil; cacheExpiry = .distantPast }

    private static func build(apps: [QueryDocumentSnapshot], user: DocumentSnapshot) -> DashboardData {
        let userData = user.data() ?? [:]
        var appCount = 0, offerCount = 0
        var buckets: [String: Int] = [:]

        for doc in apps {
            let d = doc.data()
            appCount += 1
            if d["status"] as? String == "offered" { offerCount += 1 }
            if let score = d["fitScore"] as? Int { buckets[bucket(score), default: 0] += 1 }
        }

        let bins = ["50-59", "60-69", "70-79", "80-89", "90-100"].map {
            DashboardData.FitScoreBin(range: $0, count: buckets[$0] ?? 0)
        }
        let skills = (userData["skills"] as? [[String: Any]] ?? [])
            .compactMap { d -> DashboardData.SkillStat? in
                guard let name = d["name"] as? String,
                      let level = d["level"] as? Int else { return nil }
                return .init(skill: name, level: level)
            }
            .sorted { $0.level > $1.level }.prefix(6).map { $0 }

        return DashboardData(
            stats: .init(applications: appCount, offers: offerCount,
                         profileViews: userData["profileViews"] as? Int ?? 0),
            fitScoreBins: bins,
            skills: skills
        )
    }

    private static func bucket(_ score: Int) -> String {
        switch score {
        case 50..<60: return "50-59"
        case 60..<70: return "60-69"
        case 70..<80: return "70-79"
        case 80..<90: return "80-89"
        default:      return "90-100"
        }
    }
}

enum DashboardRepositoryError: LocalizedError {
    case unauthenticated, network, unknown(String)

    init(_ error: Error) {
        switch FirestoreErrorCode(rawValue: (error as NSError).code) {
        case .unavailable, .deadlineExceeded: self = .network
        default: self = .unknown(error.localizedDescription)
        }
    }

    var errorDescription: String? {
        switch self {
        case .unauthenticated: return "You must be signed in to view the dashboard."
        case .network:         return "Network error. Check your connection."
        case .unknown(let m):  return m
        }
    }
}
