//
//  Models.swift
//  Improve
//
//  Codable types matching the JSON schema in courses/. The manifest contains
//  a flat CourseCard per course (enough to render the swipe feed); the full
//  Course with lessons + quiz is loaded on demand when a user opens a liked
//  course in their library.
//

import Foundation

// MARK: - Manifest

/// Entry in courses/manifest.json — lightweight, used everywhere in the feed.
struct CourseCard: Codable, Identifiable, Hashable {
    let id: String
    let language: String
    let title: String
    let teaser: String
    let category: String
    let subcategories: [String]
    let tags: [String]
    let emoji: String
    let accentColor: String
    let coverSymbol: CoverSymbol
    let difficulty: Difficulty
    let estimatedMinutes: Int
    let lessonCount: Int
    let hasQuiz: Bool
}

struct CoverSymbol: Codable, Hashable {
    let sfSymbol: String
    let fallbackEmoji: String
}

enum Difficulty: String, Codable, Hashable {
    case beginner
    case intermediate
    case advanced
}

struct Manifest: Codable {
    let version: Int
    let generatedAt: String
    let courseCount: Int
    let courses: [CourseCard]
}

// MARK: - Full course (courses/content/{id}.json)

struct Course: Codable, Identifiable {
    let id: String
    let version: Int
    let language: String
    let card: CardDetails
    let meta: CourseMeta
    let lessons: [Lesson]
    let quiz: [QuizQuestion]
    let sources: [Source]
    let related: [String]
}

struct CardDetails: Codable {
    let title: String
    let teaser: String
    let category: String
    let subcategories: [String]
    let tags: [String]
    let emoji: String
    let accentColor: String
    let coverSymbol: CoverSymbol
    let coverImagePrompt: String
}

struct CourseMeta: Codable {
    let difficulty: Difficulty
    let estimatedMinutes: Int
    let lessonCount: Int
    let hasQuiz: Bool
    let createdBy: String
    let createdAt: String
}

// MARK: - Lessons

enum LessonType: String, Codable {
    case hook
    case concept
    case explanation
    case evidence
    case takeaway

    var label: String {
        switch self {
        case .hook: "Hook"
        case .concept: "Concept"
        case .explanation: "Explanation"
        case .evidence: "Evidence"
        case .takeaway: "Takeaway"
        }
    }
}

struct Lesson: Codable, Identifiable, Hashable {
    var id: Int { index }
    let index: Int
    let type: LessonType
    let title: String
    let body: String
    let visual: LessonVisual
    let keyTerms: [KeyTerm]?
    let funFact: String?
}

struct LessonVisual: Codable, Hashable {
    let sfSymbol: String
    let imagePrompt: String?
}

struct KeyTerm: Codable, Hashable {
    let term: String
    let definition: String
}

// MARK: - Quiz

struct QuizQuestion: Codable, Identifiable, Hashable {
    var id: Int { index }
    let index: Int
    let question: String
    let options: [String]
    let correctIndex: Int
    let explanation: String
}

// MARK: - Sources

struct Source: Codable, Hashable {
    let title: String
    let publisher: String
    let year: Int
}
