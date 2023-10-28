import { useState, useEffect } from 'react';
import { createWeb3Modal, useWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import web3 from 'web3'
import { WagmiConfig, useAccount, useDisconnect } from 'wagmi'
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
/**
+ * ConnectButton Component.
+ *
+ * This component renders a button that connects to a Web3 provider using useWeb3Modal hook. It also displays the user's address and balance if connected.
+ *
+ * @returns {JSX.Element} - The ConnectButton component.
            + */
function ConnectButton() {
    const { open } = useWeb3Modal();
    const { address, isConnected, isDisconnected } = useAccount();
    const { disconnect } = useDisconnect();
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
                const web3connect = new web3(createWeb3Modal({ wagmiConfig, projectId, chains }).provider); // Initialize Web3 with the provider
                const weiBalance = await web3connect.eth.getBalance(address);
                const ethBalance = web3connect.utils.fromWei(weiBalance, 'ether');
                setBalance(ethBalance);
                console.log(web3connect)

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

    console.log(balance)

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