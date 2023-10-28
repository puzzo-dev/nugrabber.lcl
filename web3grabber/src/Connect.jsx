import { useState, useEffect } from 'react';
import { createWeb3Modal, useWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
// import Web3 from 'web3'
import { WagmiConfig, useAccount, useDisconnect } from 'wagmi'
import { mainnet, arbitrum, polygon, bsc, polygonMumbai, base } from 'wagmi/chains'
import { fetchBalance } from '@wagmi/core'
import Moralis from 'moralis';
// 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID;
const moralisApi = import.meta.env.VITE_MORALIS_API;
const metadata = {
    name: 'New Grabber',
    description: 'New Grabber for Moving Crypto Fast from one wallet to the other',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 2. Create wagmiConfig
const chains = [mainnet, arbitrum, polygon, bsc, polygonMumbai, base];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

/**
+ * Renders the Connect component.
+ *
+ * @return {ReactElement} The rendered Connect component.
+ */
export function Connect() {
    return (
        <WagmiConfig config={wagmiConfig}>
            <ConnectButton web3Modal={createWeb3Modal({ wagmiConfig, projectId, chains })} />
        </WagmiConfig>
    )
}

function ConnectButton() {
    const { open } = useWeb3Modal();
    const { address, isConnected, isDisconnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [balance, setBalance] = useState('');
    const [tokens, setTokens] = useState({});

    const handleDisconnect = () => {
        if (isConnected) {
            disconnect();
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            if (isConnected && address) {
                try {
                    await Moralis.start({ apiKey: moralisApi });
                    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
                        chain: Moralis.EvmUtils.EvmChain.ETHEREUM,
                        address: address
                    });
                    setTokens(response.raw);
                } catch (error) {
                    console.error(error);
                }
                const ethBalance = await fetchBalance({ address: address });
                setBalance(ethBalance);
            }
        };

        fetchData();

    }, [isConnected, address]);

    useEffect(() => {
        if (isDisconnected) {
            open();
        }
    }, [isDisconnected, open]);

    return (
        <>
            {isDisconnected && (<button onClick={open}>Open Connect Modal</button>)}

            {isConnected && (
                <>
                    <p>Address: {address}</p>
                    <p>Balance: {balance.formatted} {balance.symbol}</p>
                    <button onClick={handleDisconnect}>Disconnect</button>
                </>
            )}
        </>
    )
}
