#!/usr/bin/env node
/**
 * Run a Capacitor Android app on a connected emulator/device without Android Studio.
 *
 * Usage: node scripts/run-android-emulator.mjs buyer|seller|delivery
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const role = process.argv[2] || 'buyer'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  '/opt/homebrew/share/android-commandlinetools'
const javaHome = process.env.JAVA_HOME || '/opt/homebrew/opt/openjdk@21'
const appDirs = {
  buyer: 'android-buyer',
  seller: 'android-seller',
  delivery: 'android-delivery',
}
const packages = {
  buyer: 'com.candlestack.nurukk.buyer',
  seller: 'com.candlestack.nurukk.seller',
  delivery: 'com.candlestack.nurukk.delivery',
}

if (!appDirs[role]) {
  console.error(`Unknown role "${role}". Use buyer|seller|delivery.`)
  process.exit(1)
}

const env = {
  ...process.env,
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
  JAVA_HOME: javaHome,
  PATH: [
    path.join(javaHome, 'bin'),
    path.join(androidHome, 'cmdline-tools', 'latest', 'bin'),
    path.join(androidHome, 'platform-tools'),
    path.join(androidHome, 'emulator'),
    process.env.PATH || '',
  ].join(path.delimiter),
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    cwd: opts.cwd || root,
    shell: false,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env,
    cwd: root,
  })
  return (result.stdout || '') + (result.stderr || '')
}

const adb = path.join(androidHome, 'platform-tools', 'adb')
const emulatorBin = path.join(androidHome, 'emulator', 'emulator')
const devices = capture(adb, ['devices'])
const hasDevice = /^emulator-\d+\s+device$/m.test(devices) || /^[0-9a-f]+\s+device$/im.test(devices)

if (!hasDevice) {
  const avds = capture(emulatorBin, ['-list-avds'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const avd = avds[0]
  if (!avd) {
    console.error('No Android emulator/device found and no AVDs available.')
    console.error('Create one with: avdmanager create avd -n Pixel_API_36 -k "system-images;android-36;google_apis;arm64-v8a"')
    process.exit(1)
  }
  console.log(`Starting emulator ${avd}...`)
  const child = spawnSync(
    emulatorBin,
    ['-avd', avd, '-no-metrics', '-gpu', 'swiftshader_indirect', '-memory', '1024', '-cores', '2', '-no-snapshot', '-no-boot-anim'],
    { env, detached: true, stdio: 'ignore' },
  )
  // spawnSync with detached still waits — use spawn instead via shell nohup
  if (child.error) {
    // fallback handled below
  }
  spawnSync('bash', [
    '-lc',
    `nohup "${emulatorBin}" -avd "${avd}" -no-metrics -gpu swiftshader_indirect -memory 1024 -cores 2 -no-snapshot -no-boot-anim >/tmp/android-emulator-run.log 2>&1 &`,
  ], { env, stdio: 'inherit' })

  console.log('Waiting for emulator boot...')
  run(adb, ['wait-for-device'])
  for (let i = 0; i < 90; i += 1) {
    const boot = capture(adb, ['shell', 'getprop', 'sys.boot_completed']).trim()
    if (boot === '1') break
    spawnSync('sleep', ['3'])
  }
}

const androidDir = path.join(root, appDirs[role])
const localProps = path.join(androidDir, 'local.properties')
fs.writeFileSync(localProps, `sdk.dir=${androidHome}\n`)

console.log(`Installing ${role} debug build...`)
run('./gradlew', [':app:installDebug', '--no-daemon'], { cwd: androidDir })

const pkg = packages[role]
console.log(`Launching ${pkg}...`)
run(adb, ['shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'])
console.log('Done. App should be open on the emulator.')
