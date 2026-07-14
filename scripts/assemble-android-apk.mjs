#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const role = String(process.argv[2] ?? 'buyer').trim().toLowerCase()
if (!['buyer', 'seller', 'delivery'].includes(role)) {
  console.error(`Usage: node scripts/assemble-android-apk.mjs <buyer|seller|delivery>`)
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidDir = join(root, `android-${role}`)
const gradlew = join(androidDir, 'gradlew')
const outDir = join(root, 'dist-apk')
const builtApk = join(androidDir, 'app/build/outputs/apk/debug/app-debug.apk')
const destApk = join(outDir, `nurukk-${role}-debug.apk`)

const javaHome =
  process.env.JAVA_HOME ||
  '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home'
const homeDir = process.env.HOME || ''
const androidHomeCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  homeDir ? join(homeDir, 'Library/Android/sdk') : '',
  '/opt/homebrew/share/android-commandlinetools',
].filter(Boolean)
const androidHome = androidHomeCandidates.find((p) => existsSync(p)) || androidHomeCandidates[0]

if (!existsSync(join(javaHome, 'bin/java'))) {
  console.error(`JAVA_HOME not found at ${javaHome}. Install OpenJDK 21 first.`)
  process.exit(1)
}
if (!existsSync(androidHome)) {
  console.error(`ANDROID_HOME not found at ${androidHome}. Install Android SDK first.`)
  process.exit(1)
}
if (!existsSync(gradlew)) {
  console.error(`Missing ${gradlew}`)
  process.exit(1)
}

writeFileSync(join(androidDir, 'local.properties'), `sdk.dir=${androidHome}\n`)
mkdirSync(outDir, { recursive: true })

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
  PATH: `${join(javaHome, 'bin')}:${process.env.PATH ?? ''}`,
}

const result = spawnSync(gradlew, ['assembleDebug', '--no-daemon'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

if (!existsSync(builtApk)) {
  console.error(`Gradle finished but APK missing: ${builtApk}`)
  process.exit(1)
}

copyFileSync(builtApk, destApk)
console.log(`\nAPK ready: ${destApk}`)
