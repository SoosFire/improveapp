//
//  ImproveApp.swift
//  Improve
//
//  Entry point + root TabView. Creates and shares the two @Observable stores
//  (ContentStore for the manifest/courses, LikedCoursesStore for user state)
//  across the whole app via .environment().
//

import SwiftUI

@main
struct ImproveApp: App {
    @State private var content = ContentStore()
    @State private var liked = LikedCoursesStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(content)
                .environment(liked)
                .preferredColorScheme(.dark)
        }
    }
}

struct RootTabView: View {
    var body: some View {
        TabView {
            SwipeFeedView()
                .tabItem { Label("Feed", systemImage: "house.fill") }

            CategoriesPlaceholder()
                .tabItem { Label("Categories", systemImage: "square.grid.2x2.fill") }

            LibraryView()
                .tabItem { Label("Library", systemImage: "heart.fill") }

            ProfilePlaceholder()
                .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(Color(hex: "#6B8DE3"))
    }
}

// MARK: - Placeholder tabs
//
// Categories and Profile aren't implemented in Swift yet; port from the HTML
// mockups at courses/preview/categories.html when you're ready.

private struct CategoriesPlaceholder: View {
    var body: some View {
        ZStack {
            Color(hex: "#0a0a0b").ignoresSafeArea()
            VStack(spacing: 10) {
                Text("📚").font(.system(size: 56))
                Text("Categories").font(.title.bold()).foregroundStyle(.white)
                Text("See courses/preview/categories.html for the reference design.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 40)
            }
        }
    }
}

private struct ProfilePlaceholder: View {
    var body: some View {
        ZStack {
            Color(hex: "#0a0a0b").ignoresSafeArea()
            VStack(spacing: 10) {
                Text("👤").font(.system(size: 56))
                Text("Profile").font(.title.bold()).foregroundStyle(.white)
            }
        }
    }
}
