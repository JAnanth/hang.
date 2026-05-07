#!/usr/bin/env node
// Patches expo-device's UIDevice.swift to replace the C macro TARGET_OS_SIMULATOR
// (unavailable in Swift scope on Xcode 15/16) with Swift's native conditional.
const fs = require('fs');
const path = require('path');

const pnpmStore = path.resolve(__dirname, '../node_modules/.pnpm');
const targetRelative = path.join('node_modules', 'expo-device', 'ios', 'UIDevice.swift');
const oldCode = '    return TARGET_OS_SIMULATOR != 0';
const newCode = '    #if targetEnvironment(simulator)\n    return true\n    #else\n    return false\n    #endif';

if (!fs.existsSync(pnpmStore)) {
  process.exit(0);
}

let patched = false;
for (const entry of fs.readdirSync(pnpmStore)) {
  if (!entry.startsWith('expo-device@')) continue;
  const filePath = path.join(pnpmStore, entry, targetRelative);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(oldCode)) {
    console.log('expo-device patch: already applied, skipping');
    continue;
  }
  fs.writeFileSync(filePath, content.replace(oldCode, newCode));
  console.log('Patched expo-device UIDevice.swift for Xcode 15/16 compatibility');
  patched = true;
}

if (!patched && fs.readdirSync(pnpmStore).some(e => e.startsWith('expo-device@'))) {
  // file found but already patched
}
