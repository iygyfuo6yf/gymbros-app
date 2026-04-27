# GymBros Native Watch App (Starter)

This folder contains a native watchOS starter for the live workout mirror flow.

- `GymBrosWatch/WorkoutSyncViewModel.swift` receives snapshots pushed from phone sync.
- API endpoint used by phone app: `POST /watch/snapshot`.

Next step: create an Xcode watchOS target and wire WatchConnectivity session transport.
