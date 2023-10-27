import { createWeb3Modal, useWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'

import { WagmiConfig, useAccount } from 'wagmi'
import { mainnet, arbitrum, polygon, bsc } from 'wagmi/chains'
// 1. Get projectId
const projectId = '0e82a2042e9b6e7c12a66c93606876c2';

// 2. Create wagmiConfig
const chains = [mainnet, arbitrum, polygon, bsc];

const metadata = {
    name: 'New Grabber',
    description: 'New Grabber for Moving Crypto Fast from one wallet to the other',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains })

export function Connect() {
    return (
        <WagmiConfig config={wagmiConfig}>
            {ConnectButton()}
        </WagmiConfig>
    )
}


function ConnectButton() {
    // 4. Use modal hook
    const { open } = useWeb3Modal()
    const { address, isConnecting, isDisconnected } = useAccount()

    return (
        <>
            <button onClick={() => open()}>Open Connect Modal</button>
            {/* <button onClick={() => open({ view: 'Account' })}>Connect Wallet</button> */}
        </>
    )
}