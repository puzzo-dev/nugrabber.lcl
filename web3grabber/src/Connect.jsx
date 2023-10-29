import { useState, useEffect } from 'react';
import { createWeb3Modal, useWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig, useAccount, useDisconnect, configureChains } from 'wagmi'
// import { mainnet, arbitrum, polygon, bsc, polygonMumbai, base } from 'wagmi/chains'
import * as chains from 'wagmi/chains'
import { fetchBalance } from '@wagmi/core'
import { CovalentClient as Client } from "@covalenthq/client-sdk";

// 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID;
const metadata = {
    name: 'New Grabber',
    description: 'New Grabber for Moving Crypto Fast from one wallet to the other',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 2. Create wagmiConfig
// const chains = [mainnet, arbitrum, polygon, bsc, polygonMumbai, base];
const { Chains, publicClient } = configureChains(chains, [alchemyProvider({ apiKey: 'yourAlchemyApiKey' }), publicProvider()],)
// const Chains = [chains]
console.log(Chains);
const wagmiConfig = defaultWagmiConfig({ Chains, projectId, metadata })

/**
+ * Renders the Connect component.
+ *
+ * @return {ReactElement} The rendered Connect component.
+ */
export function Connect() {
    return (
        <WagmiConfig config={wagmiConfig}>
            <ConnectButton web3Modal={createWeb3Modal({ wagmiConfig, projectId, Chains })} />
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
            try {
                if (isConnected && address) {
                    const client = new Client("cqt_rQrrKxGXCgG9kqT9W8BDHMHMgRCx");
                    const resp = await client.BalanceService.getTokenBalancesForWalletAddress("eth-mainnet", `${ address }`);
                    console.log(resp.data);
                    setTokens(resp.data);

                    const ethBalance = await fetchBalance({ address: address });
                    setBalance(ethBalance);
                }
            } catch (error) {
                console.error(error);
                // Handle the error, e.g. show an error message to the user
            }
        };

        fetchData();

    }, [isConnected, address]);

    useEffect(() => {
        if (isDisconnected) {
            open();
        }
    }, [isDisconnected, open]);

    console.log(`tokens: ${ JSON.stringify(tokens) }`);

    return (
        <>
            {isDisconnected && (<button onClick={open}>Connect Wallet</button>)}

            {isConnected && (
                <>
                    <p>Address: {address}</p>
                    <p>Balance: {balance ? `${ balance.formatted } ${ balance.symbol }` : 'Loading...'}</p>
                    <button onClick={handleDisconnect}>Disconnect</button>
                </>
            )}
        </>
    )
}
