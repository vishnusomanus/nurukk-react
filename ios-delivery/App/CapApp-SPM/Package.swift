// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1"),
        .package(name: "CapacitorApp", path: "../local-plugins/CapacitorApp"),
        .package(name: "CapacitorBrowser", path: "../local-plugins/CapacitorBrowser"),
        .package(name: "CapacitorCamera", path: "../local-plugins/CapacitorCamera"),
        .package(name: "CapacitorGeolocation", path: "../local-plugins/CapacitorGeolocation"),
        .package(name: "CapacitorSplashScreen", path: "../local-plugins/CapacitorSplashScreen"),
        .package(name: "CapacitorRazorpay", path: "../local-plugins/CapacitorRazorpay")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorBrowser", package: "CapacitorBrowser"),
                .product(name: "CapacitorCamera", package: "CapacitorCamera"),
                .product(name: "CapacitorGeolocation", package: "CapacitorGeolocation"),
                .product(name: "CapacitorSplashScreen", package: "CapacitorSplashScreen"),
                .product(name: "CapacitorRazorpay", package: "CapacitorRazorpay")
            ]
        )
    ]
)
