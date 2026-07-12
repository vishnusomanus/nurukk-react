#!/usr/bin/env node
/**
 * Capacitor 8 iOS uses SPM. Official capacitor-razorpay is CocoaPods-only,
 * so Cap sync skips it and Checkout.open() fails on iOS.
 *
 * Inject an SPM Package.swift + Cap 8 bridged plugin sources into
 * node_modules/capacitor-razorpay so `npx cap sync ios` links it.
 */
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = join(root, 'node_modules', 'capacitor-razorpay')
const templateDir = join(root, 'scripts', 'capacitor-razorpay-spm')

if (!existsSync(pluginRoot)) {
  console.warn('[link-razorpay-spm] capacitor-razorpay is not installed; skip')
  process.exit(0)
}

writeFileSync(join(pluginRoot, 'Package.swift'), readFileSync(join(templateDir, 'Package.swift'), 'utf8'))

const sourcesDir = join(pluginRoot, 'ios', 'Sources', 'CheckoutPlugin')
rmSync(sourcesDir, { recursive: true, force: true })
mkdirSync(sourcesDir, { recursive: true })
cpSync(join(templateDir, 'CheckoutPlugin.swift'), join(sourcesDir, 'CheckoutPlugin.swift'))

console.log('[link-razorpay-spm] Injected SPM Package.swift into capacitor-razorpay')
