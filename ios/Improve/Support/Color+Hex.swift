//
//  Color+Hex.swift
//  Improve
//
//  Hex string init for SwiftUI Color plus a simple darken() mix toward near-black
//  that we use to derive the radial-gradient second stop on Template C cards.
//

import SwiftUI
import UIKit

extension Color {
    /// Parses "#RRGGBB" or "#RRGGBBAA". Returns mid-gray on malformed input.
    init(hex: String) {
        let cleaned = hex
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")

        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)

        let r, g, b, a: Double
        switch cleaned.count {
        case 6:
            r = Double((value >> 16) & 0xff) / 255
            g = Double((value >> 8) & 0xff) / 255
            b = Double(value & 0xff) / 255
            a = 1
        case 8:
            r = Double((value >> 24) & 0xff) / 255
            g = Double((value >> 16) & 0xff) / 255
            b = Double((value >> 8) & 0xff) / 255
            a = Double(value & 0xff) / 255
        default:
            r = 0.5; g = 0.5; b = 0.5; a = 1
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }

    /// Mix this color toward near-black. `amount` in 0...1.
    /// Matches the `darken()` function used in scripts/build-preview.mjs so the
    /// SwiftUI render matches the HTML previews.
    func darkened(_ amount: Double) -> Color {
        let clamp = max(0, min(1, amount))
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(self).getRed(&r, green: &g, blue: &b, alpha: &a)
        let target: CGFloat = 12.0 / 255.0
        let nr = r * (1 - clamp) + target * clamp
        let ng = g * (1 - clamp) + target * clamp
        let nb = b * (1 - clamp) + target * clamp
        return Color(.sRGB, red: Double(nr), green: Double(ng), blue: Double(nb), opacity: Double(a))
    }
}
