export const ARC_TESTNET = {
  chainIdDecimal: 5042002,
  chainIdHex: '0x4cef52',
  chainName: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
  explorerTx: (hash: string) => `https://testnet.arcscan.app/tx/${hash}`,
  faucet: 'https://faucet.circle.com',
  contracts: {
    usdc: '0x3600000000000000000000000000000000000000',
    gatewayWallet: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
    gatewayMinter: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
    cctpTokenMessengerV2: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  },
} as const;

export type EthereumProvider = {
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
