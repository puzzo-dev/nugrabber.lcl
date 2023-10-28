import { WalletConnectChainID } from '@tronweb3/walletconnect-tron';
import { Chain } from '@wagmi/core'

export const Tron = {
    id: 43_114,
    name: 'Tron',
    network: WalletConnectChainID.Mainnet,
    nativeCurrency: {
        decimals: 18,
        name: 'Tron',
        symbol: 'TRX',
    },
    rpcUrls: {
        public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
        default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    },
    blockExplorers: {
        etherscan: { name: 'SnowTrace', url: 'https://snowtrace.io' },
        default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
    },
    contracts: {
        multicall3: {
            address: '0xca11bde05977b3631167028862be2a173976ca11',
            blockCreated: 11_907_934,
        },
    },
};

export const satisfies Chain