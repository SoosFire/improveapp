//
//  SwipeFeedView.swift
//  Improve
//
//  The Tinder-style swipe stack. Top card follows the finger with rotation +
//  offset, optional LIKE/PASS corner hints appear past a small threshold,
//  and committing the swipe calls into LikedCoursesStore on a right-swipe.
//
//  Tuning: DragThreshold controls how far you have to drag before a release
//  commits vs. snaps back. RotationDivisor controls how "bouncy" the rotation
//  feels during drag (higher = more subtle).
//

import SwiftUI

struct SwipeFeedView: View {
    @Environment(ContentStore.self) private var content
    @Environment(LikedCoursesStore.self) private var liked

    /// Optional filter. Empty = draw from every category (Surprise-me mode).
    let categoryFilter: Set<String>

    @State private var queue: [CourseCard] = []
    @State private var dragOffset: CGSize = .zero
    @State private var topCardRotation: Double = 0

    private let dragThreshold: CGFloat = 100
    private let rotationDivisor: CGFloat = 20

    init(categoryFilter: Set<String> = []) {
        self.categoryFilter = categoryFilter
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color(hex: "#0a0a0b").ignoresSafeArea()

                if queue.isEmpty {
                    emptyState
                } else {
                    stack(in: geo.size)
                }
            }
        }
        .onAppear(perform: loadQueue)
        .onChange(of: categoryFilter) { _, _ in loadQueue() }
    }

    // MARK: - Stack layout

    private func stack(in size: CGSize) -> some View {
        ZStack {
            // Render back-to-front so the top card draws last.
            ForEach(visibleCards.reversed()) { card in
                let depth = visibleCards.firstIndex(where: { $0.id == card.id }) ?? 0
                cardContainer(card: card, depth: depth, size: size)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
        .padding(.bottom, 40)
    }

    private var visibleCards: [CourseCard] {
        // Show up to 3 cards — the top one and the next two peeking behind.
        Array(queue.prefix(3))
    }

    private func cardContainer(card: CourseCard, depth: Int, size: CGSize) -> some View {
        let isTop = depth == 0
        let scale = 1.0 - Double(depth) * 0.04
        let verticalOffset = Double(depth) * 10

        return CardView(card: card)
            .overlay(alignment: .topLeading) { passHint.opacity(passHintOpacity(isTop: isTop)) }
            .overlay(alignment: .topTrailing) { likeHint.opacity(likeHintOpacity(isTop: isTop)) }
            .offset(x: isTop ? dragOffset.width : 0,
                    y: (isTop ? dragOffset.height : 0) + verticalOffset)
            .rotationEffect(.degrees(isTop ? topCardRotation : 0))
            .scaleEffect(scale)
            .gesture(isTop ? dragGesture : nil)
            .animation(.interactiveSpring(response: 0.35, dampingFraction: 0.82), value: dragOffset)
            .animation(.easeInOut(duration: 0.2), value: queue.map(\.id))
    }

    // MARK: - Drag gesture

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                dragOffset = value.translation
                topCardRotation = Double(value.translation.width / rotationDivisor)
            }
            .onEnded { value in
                if abs(value.translation.width) > dragThreshold {
                    commitSwipe(direction: value.translation.width > 0 ? .like : .pass)
                } else {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                        dragOffset = .zero
                        topCardRotation = 0
                    }
                }
            }
    }

    private enum SwipeDirection { case like, pass }

    private func commitSwipe(direction: SwipeDirection) {
        guard let top = queue.first else { return }
        if direction == .like {
            liked.like(top.id)
        }
        let flyTo: CGFloat = direction == .like ? 800 : -800
        withAnimation(.easeOut(duration: 0.28)) {
            dragOffset = CGSize(width: flyTo, height: dragOffset.height)
            topCardRotation = Double(flyTo / rotationDivisor)
        }
        // After the fly-off animation, pop the top card.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) {
            queue.removeFirst()
            dragOffset = .zero
            topCardRotation = 0
        }
    }

    // MARK: - Swipe hints

    private var passHint: some View {
        hintLabel(text: "PASS", color: .red, rotation: -12)
    }

    private var likeHint: some View {
        hintLabel(text: "LIKE", color: .green, rotation: 12)
    }

    private func hintLabel(text: String, color: Color, rotation: Double) -> some View {
        Text(text)
            .font(.system(size: 32, weight: .heavy))
            .tracking(2)
            .foregroundStyle(color)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(color, lineWidth: 4)
            )
            .rotationEffect(.degrees(rotation))
            .padding(36)
    }

    private func likeHintOpacity(isTop: Bool) -> Double {
        guard isTop else { return 0 }
        return Double(max(0, min(1, (dragOffset.width - 30) / 100)))
    }

    private func passHintOpacity(isTop: Bool) -> Double {
        guard isTop else { return 0 }
        return Double(max(0, min(1, (-dragOffset.width - 30) / 100)))
    }

    // MARK: - State

    private func loadQueue() {
        queue = content.shuffledFeed(categories: categoryFilter)
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Text("✨").font(.system(size: 72))
            Text("That's everything for now")
                .font(.title2.bold())
                .foregroundStyle(.white)
            Text("Check back later — or tap Surprise me on the Categories tab.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)
        }
    }
}
