import Foundation

struct User {
    let uid: String
    let email: String
    let name: String
    let role: Role

    enum Role: String, CaseIterable {
        case jobSeeker = "job_seeker"
        case employer  = "employer"

        static func fromFirestore(_ value: String?) -> Role {
            allCases.first { $0.rawValue == value } ?? .jobSeeker
        }
    }
}
