#!/usr/bin/env node
// Copy shared iOS plugin sources into each app's local-plugins folder.
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SPLASH_SRC = join(ROOT, 'node_modules', '@capacitor', 'splash-screen')
const GEO_SRC = join(ROOT, 'node_modules', '@capacitor', 'geolocation')
const RAZORPAY_TEMPLATE = join(ROOT, 'scripts', 'capacitor-razorpay-spm')

if (!existsSync(SPLASH_SRC)) {
  console.error('[vendor-ios-plugins] @capacitor/splash-screen not installed')
  process.exit(1)
}

if (!existsSync(GEO_SRC)) {
  console.error('[vendor-ios-plugins] @capacitor/geolocation not installed')
  process.exit(1)
}

function vendorCapacitorPlugin(role, src, folderName, label) {
  const parent = join(ROOT, `ios-${role}`, 'App', 'local-plugins')
  const dest = join(parent, folderName)
  mkdirSync(parent, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  cpSync(src, dest, { recursive: true })
  if (!existsSync(join(dest, 'Package.swift'))) {
    console.error(`[vendor-ios-plugins] ${label} failed for ${role}`)
    process.exit(1)
  }
  console.log(`[vendor-ios-plugins] ${role} ${label} (${readdirSync(dest).length} items)`)
}

function vendorSplash(role) {
  vendorCapacitorPlugin(role, SPLASH_SRC, 'CapacitorSplashScreen', 'splash')
}

function vendorGeolocation(role) {
  vendorCapacitorPlugin(role, GEO_SRC, 'CapacitorGeolocation', 'geolocation')
}

function vendorRazorpay(role) {
  const parent = join(ROOT, `ios-${role}`, 'App', 'local-plugins')
  const dest = join(parent, 'CapacitorRazorpay')
  const sources = join(dest, 'ios', 'Sources', 'CheckoutPlugin')

  mkdirSync(parent, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(sources, { recursive: true })

  writeFileSync(join(dest, 'Package.swift'), readFileSync(join(RAZORPAY_TEMPLATE, 'Package.swift'), 'utf8'))
  writeFileSync(join(dest, 'package.json'), readFileSync(join(RAZORPAY_TEMPLATE, 'package.json'), 'utf8'))
  cpSync(join(RAZORPAY_TEMPLATE, 'CheckoutPlugin.swift'), join(sources, 'CheckoutPlugin.swift'))

  console.log(`[vendor-ios-plugins] ${role} razorpay (SPM Checkout plugin)`)
}

for (const role of ['buyer', 'seller', 'delivery']) {
  vendorSplash(role)
  vendorGeolocation(role)
}

// Payments are buyer-only, but keep seller/delivery packages in sync for CapApp-SPM reuse.
for (const role of ['buyer', 'seller', 'delivery']) {
  vendorRazorpay(role)
}
