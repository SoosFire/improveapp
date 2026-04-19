//
//  LibraryView.swift
//  Improve
//
//  Lists the courses the user has liked. Tapping opens LessonFlowView as a
//  sheet. A completed course gets a small checkmark badge so users can see
//  progress at a glance.
//

import SwiftUI

struct LibraryView: View {
    @Environment(ContentStore.self) private var content
    @Environment(LikedCoursesStore.self) private var liked

    @State private var openCourseId: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#0a0a0b").ignoresSafeArea()
                if likedCards.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(likedCards) { card in
                                Button { openCourseId = card.id } label: {
                                    LibraryRow(card: card, isCompleted: liked.isCompleted(card.id))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(20)
                    }
                }
            }
            .navigationTitle("Library")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(Color(hex: "#0a0a0b"), for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .sheet(item: Binding(
            get: { openCourseId.map(CourseIdWrapper.init) },
            set: { openCourseId = $0?.id }
        )) { wrapper in
            LessonFlowView(courseId: wrapper.id)
        }
    }

    private var likedCards: [CourseCard] {
        content.cards
            .filter { liked.likedIds.contains($0.id) }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("❤️").font(.system(size: 64))
            Text("Nothing liked yet")
                .font(.title2.bold())
                .foregroundStyle(.white)
            Text("Swipe right on topics you want to learn, and they'll live here.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)
        }
    }
}

private struct LibraryRow: View {
    let card: CourseCard
    let isCompleted: Bool

    var body: some View {
        let accent = Color(hex: card.accentColor)
        HStack(spacing: 14) {
            ZStack {
                RadialGradient(
                    colors: [accent, accent.darkened(0.65)],
                    center: .center,
                    startRadius: 0,
                    endRadius: 44
                )
                if UIImage(systemName: card.coverSymbol.sfSymbol) != nil {
                    Image(systemName: card.coverSymbol.sfSymbol)
                        .font(.system(size: 28, weight: .medium))
                        .foregroundStyle(.white)
                } else {
                    Text(card.coverSymbol.fallbackEmoji).font(.system(size: 28))
                }
            }
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(card.category.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.3)
                    .foregroundStyle(accent)
                Text(card.title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                HStack(spacing: 6) {
                    Text("\(card.estimatedMinutes) min")
                    Circle().fill(.white.opacity(0.3)).frame(width: 2, height: 2)
                    Text(card.difficulty.rawValue.capitalized)
                }
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(Color(hex: "#3AB77A"))
            } else {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(.white.opacity(0.06)))
    }
}

/// Sheet's Identifiable wrapper (Swift sheets need an Identifiable, String isn't one).
private struct CourseIdWrapper: Identifiable { let id: String }
