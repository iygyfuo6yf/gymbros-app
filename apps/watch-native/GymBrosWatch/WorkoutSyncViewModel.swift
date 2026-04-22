import Foundation

struct WatchWorkoutSnapshot: Codable {
    let activeRoutineName: String
    let currentSet: Int
    let targetRepRange: String
    let capturedAt: String
}

final class WorkoutSyncViewModel: ObservableObject {
    @Published var latestSnapshot: WatchWorkoutSnapshot?

    func apply(snapshotData: Data) {
        guard let decoded = try? JSONDecoder().decode(WatchWorkoutSnapshot.self, from: snapshotData) else {
            return
        }
        latestSnapshot = decoded
    }
}
