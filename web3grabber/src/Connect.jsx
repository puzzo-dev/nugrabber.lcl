import { useState, useEffect } from 'react';
import { createWeb3Modal, useWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import web3 from 'web3'
import { WagmiConfig, useAccount } from 'wagmi'
import { mainnet, arbitrum, polygon, bsc } from 'wagmi/chains'
// 1. Get projectId
const projectId = '0e82a2042e9b6e7c12a66c93606876c2';

const metadata = {
    name: 'New Grabber',
    description: 'New Grabber for Moving Crypto Fast from one wallet to the other',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 2. Create wagmiConfig
const chains = [mainnet, arbitrum, polygon, bsc];

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
// const web3Modal = createWeb3Modal({ wagmiConfig, projectId, chains })

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
    const [balance, setBalance] = useState('');

    // Function to handle disconnection
    const handleDisconnect = () => {
        if (isConnected) {
            disconnect(); // Call the disconnect method from useWeb3Modal
        }
    }

    console.log(isConnected);

    // Fetch and update the user's balance
    useEffect(() => {
        const fetchBalance = async () => {
            if (isConnected && address) {
                const balance = await web3.eth.getBalance(address);
                setBalance(web3.utils.fromWei(balance, 'ether'));
            }
        };

        fetchBalance();
    }, [isConnected, address]);

    // Check if the WalletConnect session is already established
    useEffect(() => {
        if (isDisconnected) {
            // When disconnected, initiate the connection
            open();
        }
    }, [isDisconnected, open]);

    return (
        <>
            {isDisconnected && (<button onClick={() => open()}>Open Connect Modal</button>)}

            {isConnected && (
                <>
                    <p>Address: {address}</p>
                    <p>Balance: {balance} ETH</p>
                    <button onClick={handleDisconnect}>Disconnect</button>
                </>
            )}
        </>
    )
}