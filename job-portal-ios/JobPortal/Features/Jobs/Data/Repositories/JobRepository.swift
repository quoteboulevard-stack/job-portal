import FirebaseFirestore
import Foundation

final class JobRepository {
    static let shared = JobRepository()
    private init() {}

    private let collection = Firestore.firestore().collection("jobs")

    func fetchJobs(filters: JobFilters = .init()) async throws -> [Job] {
        var query: Query = collection.order(by: "postedAt", descending: true).limit(to: 50)
        if let mode = filters.workMode {
            query = query.whereField("workMode", isEqualTo: mode.rawValue)
        }
        if let type = filters.employmentType {
            query = query.whereField("employmentType", isEqualTo: type.rawValue)
        }
        if let loc = filters.location, !loc.isEmpty {
            query = query.whereField("location", isEqualTo: loc)
        }
        if let min = filters.minimumSalary, min > 0 {
            query = query.whereField("salary", isGreaterThanOrEqualTo: min)
        }
        do {
            return try await query.getDocuments().documents.compactMap(Self.map)
        } catch {
            throw JobRepositoryError(error)
        }
    }

    func getJobById(_ id: String) async throws -> Job {
        do {
            let doc = try await collection.document(id).getDocument()
            guard doc.exists, let job = Self.map(doc) else { throw JobRepositoryError.notFound }
            return job
        } catch let e as JobRepositoryError { throw e }
        catch { throw JobRepositoryError(error) }
    }

    func searchJobs(keyword: String) async throws -> [Job] {
        let q = keyword.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        do {
            return try await collection
                .whereField("title", isGreaterThanOrEqualTo: q)
                .whereField("title", isLessThanOrEqualTo: q + "\u{f8ff}")
                .limit(to: 20)
                .getDocuments().documents.compactMap(Self.map)
        } catch {
            throw JobRepositoryError(error)
        }
    }

    private static func map(_ doc: QueryDocumentSnapshot) -> Job? {
        build(id: doc.documentID, data: doc.data())
    }

    private static func map(_ doc: DocumentSnapshot) -> Job? {
        guard let data = doc.data() else { return nil }
        return build(id: doc.documentID, data: data)
    }

    private static func build(id: String, data: [String: Any]) -> Job {
        // Backward-compat: old docs stored location+employment in a single "mode" field.
        let legacyMode = data["mode"] as? String ?? ""
        let workModeStr = data["workMode"] as? String ?? (legacyMode == "remote" ? "remote" : "onsite")
        let employmentTypeStr = data["employmentType"] as? String ?? (legacyMode != "remote" ? legacyMode : "fulltime")

        return Job(
            id: id,
            title: data["title"] as? String ?? "",
            company: data["company"] as? String ?? "",
            location: data["location"] as? String ?? "",
            workMode: Job.WorkMode(rawValue: workModeStr) ?? .onsite,
            employmentType: Job.EmploymentType(rawValue: employmentTypeStr) ?? .fulltime,
            salary: data["salary"] as? Int ?? 0,
            description: data["description"] as? String ?? "",
            requirements: data["requirements"] as? [String] ?? [],
            employerId: data["employerId"] as? String,
            postedAt: (data["postedAt"] as? Timestamp)?.dateValue() ?? Date()
        )
    }
}

enum JobRepositoryError: LocalizedError {
    case notFound, network, unknown(String)

    init(_ error: Error) {
        switch FirestoreErrorCode(rawValue: (error as NSError).code) {
        case .notFound:
            self = .notFound
        case .unavailable, .deadlineExceeded:
            self = .network
        default:
            self = .unknown(error.localizedDescription)
        }
    }

    var errorDescription: String? {
        switch self {
        case .notFound:          return "Job not found."
        case .network:           return "Network error. Check your connection."
        case .unknown(let msg):  return msg
        }
    }
}
