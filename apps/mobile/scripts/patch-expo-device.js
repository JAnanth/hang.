/**
 * expo-device@6.x uses TARGET_OS_SIMULATOR in Swift, which is not in scope on
 * Xcode 15/16. Replace with Swift's targetEnvironment(simulator).
 *
 * Safe to run repeatedly (idempotent).
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
let expoDeviceRoot;
try {
  expoDeviceRoot = path.dirname(
    require.resolve("expo-device/package.json", { paths: [mobileRoot] }),
  );
} catch {
  process.exit(0);
}

const uidDeviceSwift = path.join(expoDeviceRoot, "ios", "UIDevice.swift");

if (!fs.existsSync(uidDeviceSwift)) {
  process.exit(0);
}

let source = fs.readFileSync(uidDeviceSwift, "utf8");
if (!source.includes("TARGET_OS_SIMULATOR")) {
  process.exit(0);
}

const oldBlock = `  var isSimulator: Bool {
    return TARGET_OS_SIMULATOR != 0
  }`;

const newBlock = `  var isSimulator: Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif
  }`;

if (!source.includes(oldBlock)) {
  console.warn(
    "[patch-expo-device] UIDevice.swift layout changed; manual update may be needed.",
  );
  process.exit(0);
}

source = source.replace(oldBlock, newBlock);
fs.writeFileSync(uidDeviceSwift, source, "utf8");
