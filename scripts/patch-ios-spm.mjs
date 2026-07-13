#!/usr/bin/env node
/**
 * Capacitor regenerates CapApp-SPM/Package.swift to point at shared
 * node_modules paths. Xcode SPM cannot open the same local package from
 * multiple workspaces (buyer, seller, delivery).
 *
 * Rewrite those deps to per-app vendored copies under local-plugins,
 * and ensure CapacitorRazorpay (SPM) is linked for native checkout.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const ROLES = ['buyer', 'seller', 'delivery']

const REWRITES = [
  {
    shared: '../../../node_modules/@capacitor/splash-screen',
    local: '../local-plugins/CapacitorSplashScreen',
    folder: 'CapacitorSplashScreen',
    label: 'splash',
  },
  {
    shared: '../../../node_modules/@capacitor/geolocation',
    local: '../local-plugins/CapacitorGeolocation',
    folder: 'CapacitorGeolocation',
    label: 'geolocation',
  },
  {
    shared: '../../../node_modules/@capacitor/browser',
    local: '../local-plugins/CapacitorBrowser',
    folder: 'CapacitorBrowser',
    label: 'browser',
  },
  {
    shared: '../../../node_modules/@capacitor/camera',
    local: '../local-plugins/CapacitorCamera',
    folder: 'CapacitorCamera',
    label: 'camera',
  },
  {
    shared: '../../../node_modules/@capacitor/app',
    local: '../local-plugins/CapacitorApp',
    folder: 'CapacitorApp',
    label: 'app',
  },
]

const LOCAL_RAZORPAY = '../local-plugins/CapacitorRazorpay'
const SHARED_RAZORPAY = '../../../node_modules/capacitor-razorpay'

function ensureRazorpayDependency(source) {
  if (source.includes('CapacitorRazorpay') || source.includes('local-plugins/CapacitorRazorpay')) {
    return source.replaceAll(SHARED_RAZORPAY, LOCAL_RAZORPAY)
  }

  // Cap sync skipped CocoaPods-only capacitor-razorpay — inject SPM package manually.
  if (!source.includes('.package(')) return source

  let next = source
  if (!next.includes(LOCAL_RAZORPAY) && !next.includes('CapacitorRazorpay')) {
    next = next.replace(
      /dependencies:\s*\[/,
      `dependencies: [\n        .package(name: "CapacitorRazorpay", path: "${LOCAL_RAZORPAY}"),`,
    )
    next = next.replace(
      /dependencies:\s*\[\s*\n(\s*)\.product\(name: "Capacitor"/,
      `dependencies: [\n$1.product(name: "CapacitorRazorpay", package: "CapacitorRazorpay"),\n$1.product(name: "Capacitor"`,
    )

    // Fallback: insert product after Cordova product line
    if (!next.includes('product(name: "CapacitorRazorpay"')) {
      next = next.replace(
        /(\.product\(name: "Cordova", package: "capacitor-swift-pm"\),?)/,
        `$1\n                .product(name: "CapacitorRazorpay", package: "CapacitorRazorpay"),`,
      )
    }
  }

  return next.replaceAll(SHARED_RAZORPAY, LOCAL_RAZORPAY)
}

let patched = 0

for (const role of ROLES) {
  const pkgPath = join(ROOT, `ios-${role}`, 'App', 'CapApp-SPM', 'Package.swift')
  if (!existsSync(pkgPath)) continue

  for (const rewrite of REWRITES) {
    const localPkg = join(
      ROOT,
      `ios-${role}`,
      'App',
      'local-plugins',
      rewrite.folder,
      'Package.swift',
    )
    if (!existsSync(localPkg)) {
      console.warn(`[patch-ios-spm] missing vendored ${rewrite.label} plugin for ${role}`)
    }
  }

  const localRazorpay = join(
    ROOT,
    `ios-${role}`,
    'App',
    'local-plugins',
    'CapacitorRazorpay',
    'Package.swift',
  )
  if (!existsSync(localRazorpay)) {
    console.warn(`[patch-ios-spm] missing vendored razorpay plugin for ${role}`)
  }

  const before = readFileSync(pkgPath, 'utf8')
  let after = before
  for (const rewrite of REWRITES) {
    after = after.split(rewrite.shared).join(rewrite.local)
  }
  after = ensureRazorpayDependency(after)

  if (after !== before) {
    writeFileSync(pkgPath, after)
    patched += 1
    console.log(`[patch-ios-spm] ${role}: Package.swift updated`)
  }
}

if (patched === 0) {
  console.log('[patch-ios-spm] nothing to patch')
}
