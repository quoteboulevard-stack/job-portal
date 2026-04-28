import Foundation

struct Message: Identifiable {
    let id: String
    let fromUserId: String
    let toUserId: String
    let subject: String
    let body: String
    let status: Status
    let createdAt: Date

    enum Status: String {
        case waiting  = "waiting"
        case sent     = "sent"
        case seen     = "seen"
        case accepted = "accepted"
        case rejected = "rejected"
        case expired  = "expired"
        case invalid  = "invalid"
    }
}
