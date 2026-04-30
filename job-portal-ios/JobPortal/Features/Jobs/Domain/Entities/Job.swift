import Foundation

struct Job: Identifiable {
    let id: String
    let title: String
    let company: String
    let location: String
    let workMode: WorkMode
    let employmentType: EmploymentType
    let experience: String
    let salary: Int?
    let description: String
    let requirements: [String]
    let skills: [String]
    let perks: [String]
    let employerId: String?
    let postedAt: Date

    enum WorkMode: String {
        case remote = "remote"
        case hybrid = "hybrid"
        case onsite = "onsite"
    }

    enum EmploymentType: String {
        case fulltime    = "fulltime"
        case parttime    = "parttime"
        case contract    = "contract"
        case internship  = "internship"
        case freelance   = "freelance"
    }
}

struct JobFilters {
    var workMode: Job.WorkMode?
    var employmentType: Job.EmploymentType?
    var location: String?
    var minimumSalary: Int?
}
