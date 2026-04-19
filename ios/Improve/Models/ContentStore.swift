//
//  ContentStore.swift
//  Improve
//
//  Loads the course manifest at launch and individual full courses on demand.
//  Full Course JSON is only parsed when a user opens a course in their library
//  (keeps memory low even with hundreds of courses).
//

import Foundation
import Observation

@Observable
final class ContentStore {
    private(set) var cards: [CourseCard] = []
    private(set) var manifestVersion: Int = 0
    private var fullCourseCache: [String: Course] = [:]

    init() {
        loadManifest()
    }

    // MARK: - Manifest

    private func loadManifest() {
        guard let url = Bundle.main.url(forResource: "manifest", withExtension: "json") else {
            assertionFailure("manifest.json not found in bundle — see ios/README.md")
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let parsed = try JSONDecoder().decode(Manifest.self, from: data)
            cards = parsed.courses
            manifestVersion = parsed.version
        } catch {
            print("Failed to decode manifest.json: \(error)")
        }
    }

    // MARK: - Full course (lazy)

    /// Loads courses/content/{id}.json from the bundle. Caches in memory.
    func fullCourse(id: String) -> Course? {
        if let cached = fullCourseCache[id] { return cached }
        guard let url = Bundle.main.url(
            forResource: id,
            withExtension: "json",
            subdirectory: "content"
        ) else {
            print("Course \(id).json not found in bundle content/ folder")
            return nil
        }
        do {
            let data = try Data(contentsOf: url)
            let course = try JSONDecoder().decode(Course.self, from: data)
            fullCourseCache[id] = course
            return course
        } catch {
            print("Failed to decode course \(id): \(error)")
            return nil
        }
    }

    // MARK: - Queries used by the feed + categories tab

    /// All unique categories, alphabetically.
    var allCategories: [String] {
        Array(Set(cards.map(\.category))).sorted()
    }

    func cards(for category: String) -> [CourseCard] {
        cards.filter { $0.category == category }
    }

    func cards(in categories: Set<String>) -> [CourseCard] {
        guard !categories.isEmpty else { return cards }
        return cards.filter { categories.contains($0.category) }
    }

    /// Cards for the swipe feed, shuffled. When `categories` is empty the feed
    /// draws from everything (Surprise-me mode).
    func shuffledFeed(categories: Set<String> = []) -> [CourseCard] {
        cards(in: categories).shuffled()
    }
}
