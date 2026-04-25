const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block @wallet-standard / @solana temp dirs that @clerk/expo pulls in.
// Metro tries to watch them but they don't exist at bundle time, causing a crash.
const existingBlockList = config.resolver?.blockList;
const extraBlockList = [/.*@wallet-standard.*_tmp_.*/, /.*@solana.*_tmp_.*/];

config.resolver = {
  ...config.resolver,
  blockList: Array.isArray(existingBlockList)
    ? [...existingBlockList, ...extraBlockList]
    : existingBlockList
    ? [existingBlockList, ...extraBlockList]
    : extraBlockList,
};

module.exports = config;
