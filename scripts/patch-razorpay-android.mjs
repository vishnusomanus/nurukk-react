#!/usr/bin/env node
/**
 * capacitor-razorpay still references removed Gradle APIs (jcenter, old proguard file).
 * Patch node_modules so Android AGP 9+ builds succeed.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const buildGradle = join(ROOT, 'node_modules', 'capacitor-razorpay', 'android', 'build.gradle')

if (!existsSync(buildGradle)) {
  console.log('[patch-razorpay-android] capacitor-razorpay not installed — skip')
  process.exit(0)
}

const before = readFileSync(buildGradle, 'utf8')
let after = before
  .replaceAll('jcenter()', 'mavenCentral()')
  .replaceAll(
    "getDefaultProguardFile('proguard-android.txt')",
    "getDefaultProguardFile('proguard-android-optimize.txt')",
  )

if (after === before) {
  console.log('[patch-razorpay-android] already patched')
  process.exit(0)
}

writeFileSync(buildGradle, after)
console.log('[patch-razorpay-android] patched capacitor-razorpay android/build.gradle')
