//
//  LessonFlowView.swift
//  Improve
//
//  The full post-swipe learning experience: intro → lessons → quiz → completion.
//  Matches the HTML mockup at courses/preview/lesson-flow.html 1:1 in structure,
//  re-implemented in SwiftUI. Opens as a sheet from LibraryView.
//
//  The flow is driven by `Step` state transitions. Sub-screens are private
//  structs declared at the bottom of this file so LessonFlowView is the one
//  place to change the overall UX.
//

import SwiftUI

struct LessonFlowView: View {
    let courseId: String

    @Environment(ContentStore.self) private var content
    @Environment(LikedCoursesStore.self) private var liked
    @Environment(\.dismiss) private var dismiss

    @State private var course: Course?
    @State private var step: Step = .intro

    enum Step: Hashable {
        case intro
        case lesson(Int)
        case quiz(Int)
        case complete
    }

    var body: some View {
        ZStack {
            Color(hex: "#0a0a0b").ignoresSafeArea()

            if let course {
                VStack(spacing: 0) {
                    navBar(course: course)
                    progressBar(course: course)
                    content(course: course)
                }
            } else {
                ProgressView().tint(.white)
            }
        }
        .task { course = content.fullCourse(id: courseId) }
        .preferredColorScheme(.dark)
    }

    // MARK: - Chrome

    private func navBar(course: Course) -> some View {
        HStack {
            Button { dismiss() } label: {
                Label("Library", systemImage: "chevron.left")
                    .labelStyle(.titleAndIcon)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(stepLabel(course: course))
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
            Spacer()
            Color.clear.frame(width: 80) // balance the chevron
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    private func progressBar(course: Course) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(.white.opacity(0.06))
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(hex: course.card.accentColor))
                    .frame(width: geo.size.width * progressFraction(course: course))
            }
        }
        .frame(height: 3)
        .padding(.horizontal, 20)
        .animation(.easeInOut(duration: 0.25), value: step)
    }

    // MARK: - Current screen

    @ViewBuilder
    private func content(course: Course) -> some View {
        ScrollView {
            Group {
                switch step {
                case .intro:
                    IntroScreen(course: course) { step = .lesson(0) }
                case .lesson(let i):
                    LessonScreen(
                        course: course,
                        lesson: course.lessons[i],
                        isFirst: i == 0,
                        isLast: i == course.lessons.count - 1,
                        onNext: { advanceFromLesson(course: course, after: i) },
                        onBack: { regressFromLesson(i: i) }
                    )
                case .quiz(let i):
                    QuizScreen(
                        course: course,
                        question: course.quiz[i],
                        isLast: i == course.quiz.count - 1,
                        onNext: { advanceFromQuiz(course: course, after: i) }
                    )
                case .complete:
                    CompletionScreen(course: course, onClose: { dismiss() })
                        .onAppear { liked.markComplete(course.id) }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 40)
            .transition(.asymmetric(
                insertion: .opacity.combined(with: .move(edge: .trailing)),
                removal: .opacity.combined(with: .move(edge: .leading))
            ))
            .id(step)
        }
        .animation(.easeInOut(duration: 0.25), value: step)
    }

    // MARK: - Step transitions

    private func advanceFromLesson(course: Course, after index: Int) {
        if index + 1 < course.lessons.count {
            step = .lesson(index + 1)
        } else if !course.quiz.isEmpty {
            step = .quiz(0)
        } else {
            step = .complete
        }
    }

    private func regressFromLesson(i: Int) {
        step = i == 0 ? .intro : .lesson(i - 1)
    }

    private func advanceFromQuiz(course: Course, after index: Int) {
        if index + 1 < course.quiz.count {
            step = .quiz(index + 1)
        } else {
            step = .complete
        }
    }

    // MARK: - Progress helpers

    private func stepLabel(course: Course) -> String {
        switch step {
        case .intro:
            "Intro"
        case .lesson(let i):
            "Lesson \(i + 1) of \(course.lessons.count)"
        case .quiz(let i):
            "Quiz \(i + 1) of \(course.quiz.count)"
        case .complete:
            "Complete"
        }
    }

    private func progressFraction(course: Course) -> Double {
        let total = 1 + course.lessons.count + course.quiz.count + 1
        let current: Int
        switch step {
        case .intro: current = 1
        case .lesson(let i): current = 1 + i + 1
        case .quiz(let i): current = 1 + course.lessons.count + i + 1
        case .complete: current = total
        }
        return Double(current) / Double(total)
    }
}

// MARK: - Shared UI bits

private struct Stage: View {
    let accent: Color
    let symbol: String?
    let emoji: String?
    var height: CGFloat = 240
    var symbolSize: CGFloat = 96

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [accent, accent.darkened(0.65)],
                center: .center,
                startRadius: 0,
                endRadius: 220
            )
            if let symbol, UIImage(systemName: symbol) != nil {
                Image(systemName: symbol)
                    .font(.system(size: symbolSize, weight: .medium))
                    .foregroundStyle(.white)
                    .symbolRenderingMode(.hierarchical)
                    .shadow(color: .black.opacity(0.35), radius: 14, x: 0, y: 12)
            } else if let emoji {
                Text(emoji).font(.system(size: symbolSize))
            }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

private struct TypePill: View {
    let type: LessonType
    let accent: Color

    var body: some View {
        Text(type.label.uppercased())
            .font(.system(size: 10, weight: .heavy))
            .tracking(1.5)
            .foregroundStyle(accent)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(accent.opacity(0.18), in: Capsule())
    }
}

private struct CTAButton: View {
    let title: String
    var primary: Bool = true
    var accent: Color = .white
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(primary ? accent : Color.white.opacity(0.08))
                .foregroundStyle(primary ? Color.black : Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Screens

private struct IntroScreen: View {
    let course: Course
    let onStart: () -> Void

    var body: some View {
        let accent = Color(hex: course.card.accentColor)
        VStack(alignment: .leading, spacing: 18) {
            Stage(
                accent: accent,
                symbol: course.card.coverSymbol.sfSymbol,
                emoji: course.card.coverSymbol.fallbackEmoji,
                height: 300,
                symbolSize: 108
            )

            Text(breadcrumb)
                .font(.system(size: 11, weight: .bold))
                .tracking(1.6)
                .textCase(.uppercase)
                .foregroundStyle(accent)

            Text(course.card.title)
                .font(.system(size: 30, weight: .bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            Text(course.card.teaser)
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.82))
                .fixedSize(horizontal: false, vertical: true)

            stats

            CTAButton(title: "Start learning", accent: accent, action: onStart)
                .padding(.top, 12)
        }
    }

    private var breadcrumb: String {
        if let sub = course.card.subcategories.first {
            return "\(course.card.category) · \(sub)"
        }
        return course.card.category
    }

    private var stats: some View {
        HStack(spacing: 8) {
            stat(value: "\(course.lessons.count)", label: "Lessons")
            stat(value: "\(course.quiz.count)", label: "Quiz Qs")
            stat(value: "\(course.meta.estimatedMinutes)", label: "Min")
            stat(value: course.meta.difficulty.rawValue, label: "Level")
        }
    }

    private func stat(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
            Text(label).font(.system(size: 11)).foregroundStyle(.secondary).textCase(.uppercase)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14).strokeBorder(.white.opacity(0.06))
        }
    }
}

private struct LessonScreen: View {
    let course: Course
    let lesson: Lesson
    let isFirst: Bool
    let isLast: Bool
    let onNext: () -> Void
    let onBack: () -> Void

    var body: some View {
        let accent = Color(hex: course.card.accentColor)
        VStack(alignment: .leading, spacing: 16) {
            Stage(
                accent: accent,
                symbol: lesson.visual.sfSymbol,
                emoji: course.card.coverSymbol.fallbackEmoji,
                height: 240
            )

            TypePill(type: lesson.type, accent: accent)

            Text(lesson.title)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            // Italic (`*text*`) markdown is rendered as an accent highlight.
            Text(markdownStyled(lesson.body, accent: accent))
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.88))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)

            if let terms = lesson.keyTerms, !terms.isEmpty {
                VStack(spacing: 10) {
                    ForEach(terms, id: \.term) { term in
                        KeyTermCard(term: term, accent: accent)
                    }
                }
                .padding(.top, 4)
            }

            if let fact = lesson.funFact {
                FunFactCallout(text: fact)
            }

            HStack(spacing: 10) {
                CTAButton(title: "Back", primary: false, action: onBack)
                CTAButton(title: isLast ? "Start quiz" : "Next",
                          primary: true,
                          accent: accent,
                          action: onNext)
            }
            .padding(.top, 12)
        }
    }

    /// Very small inline formatter — `*text*` → colored emphasis.
    private func markdownStyled(_ input: String, accent: Color) -> AttributedString {
        (try? AttributedString(markdown: input)) ?? AttributedString(input)
    }
}

private struct KeyTermCard: View {
    let term: KeyTerm
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(term.term)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(accent)
            Text(term.definition)
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.78))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(.white.opacity(0.06)))
    }
}

private struct FunFactCallout: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("✨ Fun fact")
                .font(.system(size: 11, weight: .bold))
                .tracking(1.4)
                .textCase(.uppercase)
                .foregroundStyle(Color(hex: "#F5DC8C"))
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(Color(hex: "#F5DC8C").opacity(0.95))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(hex: "#F5C85A").opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color(hex: "#F5C85A").opacity(0.18)))
    }
}

private struct QuizScreen: View {
    let course: Course
    let question: QuizQuestion
    let isLast: Bool
    let onNext: () -> Void

    @State private var selectedIndex: Int?

    var body: some View {
        let accent = Color(hex: course.card.accentColor)
        VStack(alignment: .leading, spacing: 16) {
            Stage(
                accent: accent,
                symbol: "questionmark.circle.fill",
                emoji: "❓",
                height: 160,
                symbolSize: 72
            )

            Text("QUESTION \(question.index + 1)")
                .font(.system(size: 11, weight: .heavy))
                .tracking(1.5)
                .foregroundStyle(accent)

            Text(question.question)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 10) {
                ForEach(Array(question.options.enumerated()), id: \.offset) { idx, text in
                    optionButton(idx: idx, text: text)
                }
            }

            if let selectedIndex {
                VStack(alignment: .leading, spacing: 6) {
                    Text(question.explanation)
                        .font(.system(size: 14))
                        .foregroundStyle(.white.opacity(0.85))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
                .transition(.opacity.combined(with: .move(edge: .top)))

                CTAButton(title: isLast ? "Finish" : "Next question",
                          primary: true,
                          accent: accent,
                          action: onNext)
                    .padding(.top, 8)
                _ = selectedIndex // silence unused warning if any
            }
        }
        .animation(.easeInOut(duration: 0.2), value: selectedIndex)
    }

    private func optionButton(idx: Int, text: String) -> some View {
        let answered = selectedIndex != nil
        let isCorrect = idx == question.correctIndex
        let isChosen = idx == selectedIndex
        let style = optionStyle(answered: answered, isCorrect: isCorrect, isChosen: isChosen)

        return Button {
            guard selectedIndex == nil else { return }
            selectedIndex = idx
        } label: {
            HStack {
                Text(text)
                    .font(.system(size: 15))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if answered && (isCorrect || isChosen) {
                    Image(systemName: isCorrect ? "checkmark" : "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(isCorrect ? Color(hex: "#3AB77A") : Color(hex: "#E36A6A"))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(style.background, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(style.border, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .disabled(answered)
        .opacity(answered && !isCorrect && !isChosen ? 0.55 : 1)
    }

    private struct OptionStyle {
        let background: Color
        let border: Color
    }

    private func optionStyle(answered: Bool, isCorrect: Bool, isChosen: Bool) -> OptionStyle {
        if !answered {
            return OptionStyle(background: .white.opacity(0.04), border: .white.opacity(0.08))
        }
        if isCorrect {
            return OptionStyle(
                background: Color(hex: "#3AB77A").opacity(0.22),
                border: Color(hex: "#3AB77A")
            )
        }
        if isChosen {
            return OptionStyle(
                background: Color(hex: "#E36A6A").opacity(0.22),
                border: Color(hex: "#E36A6A")
            )
        }
        return OptionStyle(background: .white.opacity(0.04), border: .white.opacity(0.08))
    }
}

private struct CompletionScreen: View {
    let course: Course
    let onClose: () -> Void

    var body: some View {
        let accent = Color(hex: course.card.accentColor)
        VStack(alignment: .leading, spacing: 18) {
            Text("🎉")
                .font(.system(size: 88))
                .frame(maxWidth: .infinity)
                .padding(.top, 24)

            Text("COURSE COMPLETE")
                .font(.system(size: 11, weight: .bold))
                .tracking(1.6)
                .foregroundStyle(accent)

            Text("You learned: \(course.card.title)")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            Text("\(course.lessons.count) lessons · \(course.quiz.count) questions · added to your library.")
                .font(.system(size: 15))
                .foregroundStyle(.white.opacity(0.78))

            if !course.sources.isEmpty {
                SectionHeader("Sources")
                ForEach(course.sources, id: \.title) { src in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(src.title)
                            .font(.system(size: 14))
                            .foregroundStyle(.white.opacity(0.88))
                            .fixedSize(horizontal: false, vertical: true)
                        Text("\(src.publisher) · \(String(src.year))")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 10)
                    Divider().overlay(.white.opacity(0.06))
                }
            }

            if !course.related.isEmpty {
                SectionHeader("Related")
                VStack(spacing: 8) {
                    ForEach(course.related, id: \.self) { slug in
                        Text(slug.replacingOccurrences(of: "-", with: " ").capitalized)
                            .font(.system(size: 14))
                            .foregroundStyle(.white.opacity(0.85))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(.white.opacity(0.06)))
                    }
                }
            }

            CTAButton(title: "Back to library", primary: true, accent: accent, action: onClose)
                .padding(.top, 14)
        }
    }
}

private struct SectionHeader: View {
    let title: String
    init(_ title: String) { self.title = title }
    var body: some View {
        Text(title.uppercased())
            .font(.system(size: 11, weight: .bold))
            .tracking(1.6)
            .foregroundStyle(.secondary)
            .padding(.top, 12)
    }
}
