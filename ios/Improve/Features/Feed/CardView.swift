//
//  CardView.swift
//  Improve
//
//  Template C — the visual design locked in after evaluating photos vs. AI
//  generation vs. rich templated covers. A dramatic gradient "stage" (top ~60%)
//  with a large SF Symbol centered in it, and a compact info panel at the
//  bottom (~40%) showing category, title, teaser and meta tags.
//
//  Color comes entirely from the course's accentColor. No photos, no network.
//

import SwiftUI

struct CardView: View {
    let card: CourseCard

    private let cornerRadius: CGFloat = 28

    var body: some View {
        VStack(spacing: 0) {
            stage
            infoPanel
        }
        .background(Color(hex: "#12121a"))
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.45), radius: 30, x: 0, y: 20)
        .shadow(color: .black.opacity(0.25), radius: 8, x: 0, y: 4)
    }

    // MARK: - Stage (gradient + centered symbol)

    private var stage: some View {
        ZStack {
            RadialGradient(
                colors: [
                    Color(hex: card.accentColor),
                    Color(hex: card.accentColor).darkened(0.65)
                ],
                center: .center,
                startRadius: 0,
                endRadius: 260
            )

            gridPattern
                .blendMode(.softLight)

            symbol
                .shadow(color: .black.opacity(0.35), radius: 16, x: 0, y: 14)
        }
        .frame(maxHeight: .infinity)
        .clipped()
    }

    /// Soft overlay grid that fades out at the edges. Pure Canvas — no asset.
    private var gridPattern: some View {
        GeometryReader { geo in
            Canvas { ctx, size in
                let step: CGFloat = 40
                let lineColor = Color.white.opacity(0.14)
                var path = Path()
                var x: CGFloat = 0
                while x <= size.width {
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: size.height))
                    x += step
                }
                var y: CGFloat = 0
                while y <= size.height {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: size.width, y: y))
                    y += step
                }
                ctx.stroke(path, with: .color(lineColor), lineWidth: 1)
            }
            .mask(
                RadialGradient(
                    colors: [.black, .clear],
                    center: .center,
                    startRadius: 40,
                    endRadius: min(geo.size.width, geo.size.height) * 0.55
                )
            )
        }
    }

    /// Prefer SF Symbol; fall back to the emoji on the rare case a symbol name
    /// doesn't resolve on this iOS version.
    @ViewBuilder
    private var symbol: some View {
        if UIImage(systemName: card.coverSymbol.sfSymbol) != nil {
            Image(systemName: card.coverSymbol.sfSymbol)
                .font(.system(size: 96, weight: .medium))
                .foregroundStyle(.white)
                .symbolRenderingMode(.hierarchical)
        } else {
            Text(card.coverSymbol.fallbackEmoji)
                .font(.system(size: 96))
        }
    }

    // MARK: - Info panel

    private var infoPanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(breadcrumb)
                .font(.system(size: 11, weight: .bold))
                .tracking(1.6)
                .textCase(.uppercase)
                .foregroundStyle(Color(hex: card.accentColor))
                .lineLimit(1)

            Text(card.title)
                .font(.system(size: 20, weight: .bold, design: .default))
                .foregroundStyle(.white)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            Text(card.teaser)
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.72))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            metaRow.padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(22)
        .background(Color(hex: "#12121a"))
        .overlay(alignment: .top) {
            Rectangle()
                .frame(height: 1)
                .foregroundStyle(.white.opacity(0.06))
        }
    }

    private var breadcrumb: String {
        if let sub = card.subcategories.first {
            return "\(card.category) · \(sub)"
        }
        return card.category
    }

    private var metaRow: some View {
        HStack(spacing: 8) {
            Text(card.difficulty.rawValue)
            dot
            Text("\(card.estimatedMinutes) min")
            if card.hasQuiz {
                dot
                Text("Quiz")
            }
        }
        .font(.system(size: 11, weight: .semibold))
        .tracking(1)
        .textCase(.uppercase)
        .foregroundStyle(.white.opacity(0.6))
    }

    private var dot: some View {
        Circle()
            .fill(.white.opacity(0.4))
            .frame(width: 3, height: 3)
    }
}

// MARK: - Preview

#Preview("Viking Sunstone") {
    ZStack {
        Color.black.ignoresSafeArea()
        CardView(card: .vikingSunstoneSample)
            .frame(width: 340, height: 520)
    }
    .preferredColorScheme(.dark)
}

// A static sample so the canvas preview works without the bundle loaded.
extension CourseCard {
    static let vikingSunstoneSample = CourseCard(
        id: "viking-sunstone",
        language: "en",
        title: "The Viking Sunstone",
        teaser: "How did the Vikings navigate without a compass — even when the sun was hidden?",
        category: "History",
        subcategories: ["Viking Age", "Seafaring"],
        tags: ["vikings", "navigation", "optics"],
        emoji: "🧭",
        accentColor: "#4A6FA5",
        coverSymbol: CoverSymbol(sfSymbol: "sun.haze.fill", fallbackEmoji: "🌫️"),
        difficulty: .beginner,
        estimatedMinutes: 4,
        lessonCount: 5,
        hasQuiz: true
    )
}
