//
//  LikedCoursesStore.swift
//  Improve
//
//  Persists liked course IDs + per-course lesson progress to UserDefaults.
//  Good enough for MVP; swap to CoreData / CloudKit / a backend when you
//  outgrow ~10k liked courses per user.
//

import Foundation
import Observation

@Observable
final class LikedCoursesStore {
    private(set) var likedIds: Set<String> = []
    private(set) var completedIds: Set<String> = []

    private let likedKey = "likedCourseIds_v1"
    private let completedKey = "completedCourseIds_v1"

    init() {
        likedIds = Self.loadSet(key: likedKey)
        completedIds = Self.loadSet(key: completedKey)
    }

    // MARK: - Liking

    func like(_ id: String) {
        guard !likedIds.contains(id) else { return }
        likedIds.insert(id)
        save(likedIds, key: likedKey)
    }

    func unlike(_ id: String) {
        guard likedIds.contains(id) else { return }
        likedIds.remove(id)
        save(likedIds, key: likedKey)
    }

    func isLiked(_ id: String) -> Bool {
        likedIds.contains(id)
    }

    // MARK: - Completion

    func markComplete(_ id: String) {
        completedIds.insert(id)
        save(completedIds, key: completedKey)
    }

    func isCompleted(_ id: String) -> Bool {
        completedIds.contains(id)
    }

    // MARK: - Persistence

    private static func loadSet(key: String) -> Set<String> {
        guard let data = UserDefaults.standard.data(forKey: key),
              let arr = try? JSONDecoder().decode([String].self, from: data)
        else { return [] }
        return Set(arr)
    }

    private func save(_ set: Set<String>, key: String) {
        if let data = try? JSONEncoder().encode(Array(set)) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
