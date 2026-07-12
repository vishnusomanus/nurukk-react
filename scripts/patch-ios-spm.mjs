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

const SHARED_SPLASH = '../../../node_modules/@capacitor/splash-screen'
const LOCAL_SPLASH = '../local-plugins/CapacitorSplashScreen'
const SHARED_GEO = '../../../node_modules/@capacitor/geolocation'
const LOCAL_GEO = '../local-plugins/CapacitorGeolocation'
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
  const localSplash = join(
    ROOT,
    `ios-${role}`,
    'App',
    'local-plugins',
    'CapacitorSplashScreen',
    'Package.swift',
  )
  const localRazorpay = join(
    ROOT,
    `ios-${role}`,
    'App',
    'local-plugins',
    'CapacitorRazorpay',
    'Package.swift',
  )

  if (!existsSync(pkgPath)) continue
  const localGeo = join(
    ROOT,
    `ios-${role}`,
    'App',
    'local-plugins',
    'CapacitorGeolocation',
    'Package.swift',
  )

  if (!existsSync(localSplash)) {
    console.warn(`[patch-ios-spm] missing vendored splash plugin for ${role}`)
    continue
  }
  if (!existsSync(localGeo)) {
    console.warn(`[patch-ios-spm] missing vendored geolocation plugin for ${role}`)
  }
  if (!existsSync(localRazorpay)) {
    console.warn(`[patch-ios-spm] missing vendored razorpay plugin for ${role}`)
  }

  const before = readFileSync(pkgPath, 'utf8')
  let after = before.split(SHARED_SPLASH).join(LOCAL_SPLASH)
  after = after.split(SHARED_GEO).join(LOCAL_GEO)
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
