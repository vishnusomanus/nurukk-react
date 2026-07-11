#!/usr/bin/env node
// Copy @capacitor/splash-screen into each ios app local-plugins folder.
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'node_modules', '@capacitor', 'splash-screen')

if (!existsSync(SRC)) {
  console.error('[vendor-ios-plugins] @capacitor/splash-screen not installed')
  process.exit(1)
}

for (const role of ['buyer', 'seller', 'delivery']) {
  const parent = join(ROOT, `ios-${role}`, 'App', 'local-plugins')
  const dest = join(parent, 'CapacitorSplashScreen')
  mkdirSync(parent, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  cpSync(SRC, dest, { recursive: true })
  if (!existsSync(join(dest, 'Package.swift'))) {
    console.error(`[vendor-ios-plugins] failed for ${role}`)
    process.exit(1)
  }
  console.log(`[vendor-ios-plugins] ${role} (${readdirSync(dest).length} items)`)
}
