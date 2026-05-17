import { config as loadEnv } from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

loadEnv();
loadEnv({ path: '.env.local' });

const PRIVATE_KEY = process.env.ARC_DEPLOYER_PRIVATE_KEY;
const ARC_TESTNET_RPC_URL = process.env.ARC_TESTNET_RPC_URL ?? 'https://rpc.testnet.arc.network';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    arcTestnet: {
      url: ARC_TESTNET_RPC_URL,
      chainId: 5042002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 20_000_000_000,
    },
  },
};

export default config;
