require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const rawPrivateKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
const rawMnemonic = (process.env.DEPLOYER_MNEMONIC || "").trim();

const privateKeyLooksValid = /^0x[0-9a-fA-F]{64}$/.test(rawPrivateKey);
const privateKeyActuallyMnemonic = rawPrivateKey.includes(" ");
const effectiveMnemonic = privateKeyActuallyMnemonic ? rawPrivateKey : rawMnemonic;
const mantleSepoliaRpc =
  process.env.MANTLE_SEPOLIA_RPC_URL || process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const mantleMainnetRpc =
  process.env.MANTLE_MAINNET_RPC_URL || process.env.MANTLE_RPC_URL || "https://rpc.mantle.xyz";

const accounts = privateKeyLooksValid
  ? [rawPrivateKey]
  : effectiveMnemonic
    ? { mnemonic: effectiveMnemonic }
    : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    mantleSepolia: {
      url: mantleSepoliaRpc,
      chainId: 5003,
      accounts,
    },
    mantle: {
      url: mantleMainnetRpc,
      chainId: 5000,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      mantle: process.env.MANTLE_EXPLORER_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://explorer.mantle.xyz/api",
          browserURL: "https://explorer.mantle.xyz",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
  },
};
