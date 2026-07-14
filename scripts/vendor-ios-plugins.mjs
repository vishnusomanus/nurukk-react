#!/usr/bin/env node
// Copy shared iOS plugin sources into each app's local-plugins folder.
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

const PLUGINS = [
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'splash-screen'),
    folderName: 'CapacitorSplashScreen',
    label: 'splash',
    required: true,
  },
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'geolocation'),
    folderName: 'CapacitorGeolocation',
    label: 'geolocation',
    required: true,
  },
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'browser'),
    folderName: 'CapacitorBrowser',
    label: 'browser',
    required: true,
  },
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'camera'),
    folderName: 'CapacitorCamera',
    label: 'camera',
    required: false,
  },
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'app'),
    folderName: 'CapacitorApp',
    label: 'app',
    required: true,
  },
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'push-notifications'),
    folderName: 'CapacitorPushNotifications',
    label: 'push-notifications',
    required: true,
  },
  {
    src: join(ROOT, 'node_modules', '@capacitor', 'local-notifications'),
    folderName: 'CapacitorLocalNotifications',
    label: 'local-notifications',
    required: true,
  },
]

const RAZORPAY_TEMPLATE = join(ROOT, 'scripts', 'capacitor-razorpay-spm')

for (const plugin of PLUGINS) {
  if (!existsSync(plugin.src)) {
    if (plugin.required) {
      console.error(`[vendor-ios-plugins] missing package for ${plugin.label}: ${plugin.src}`)
      process.exit(1)
    }
    console.warn(`[vendor-ios-plugins] optional package missing for ${plugin.label}; skipping`)
  }
}

function vendorCapacitorPlugin(role, src, folderName, label) {
  if (!existsSync(src)) return
  const parent = join(ROOT, `ios-${role}`, 'App', 'local-plugins')
  const dest = join(parent, folderName)
  mkdirSync(parent, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  cpSync(src, dest, {
    recursive: true,
    filter: (from) => {
      const base = from.split('/').pop() ?? ''
      // Avoid copying SPM/Xcode junk that can confuse multi-workspace opens.
      return !['.swiftpm', '.build', 'node_modules', 'android', 'dist', 'Package.resolved'].includes(base)
    },
  })
  if (!existsSync(join(dest, 'Package.swift'))) {
    console.error(`[vendor-ios-plugins] ${label} failed for ${role}`)
    process.exit(1)
  }
  console.log(`[vendor-ios-plugins] ${role} ${label} (${readdirSync(dest).length} items)`)
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
  for (const plugin of PLUGINS) {
    vendorCapacitorPlugin(role, plugin.src, plugin.folderName, plugin.label)
  }
}

// Payments are buyer-only, but keep seller/delivery packages in sync for CapApp-SPM reuse.
for (const role of ['buyer', 'seller', 'delivery']) {
  vendorRazorpay(role)
}
