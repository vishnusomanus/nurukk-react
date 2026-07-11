#!/usr/bin/env node
/**
 * Capacitor regenerates CapApp-SPM/Package.swift to point at shared
 * node_modules paths. Xcode SPM cannot open the same local package from
 * multiple workspaces (buyer, seller, delivery).
 *
 * Rewrite those deps to per-app vendored copies under local-plugins.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const ROLES = ['buyer', 'seller', 'delivery']

const SHARED = '../../../node_modules/@capacitor/splash-screen'
const LOCAL = '../local-plugins/CapacitorSplashScreen'

let patched = 0

for (const role of ROLES) {
  const pkgPath = join(ROOT, `ios-${role}`, 'App', 'CapApp-SPM', 'Package.swift')
  const localPlugin = join(
    ROOT,
    `ios-${role}`,
    'App',
    'local-plugins',
    'CapacitorSplashScreen',
    'Package.swift',
  )

  if (!existsSync(pkgPath)) continue
  if (!existsSync(localPlugin)) {
    console.warn(`[patch-ios-spm] missing vendored plugin for ${role}`)
    continue
  }

  const before = readFileSync(pkgPath, 'utf8')
  if (!before.includes(SHARED)) {
    continue
  }

  writeFileSync(pkgPath, before.split(SHARED).join(LOCAL))
  patched += 1
  console.log(`[patch-ios-spm] ${role}: Package.swift -> local-plugins`)
}

if (patched === 0) {
  console.log('[patch-ios-spm] nothing to patch')
}
