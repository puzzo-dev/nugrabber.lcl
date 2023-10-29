import { useState, useEffect } from "react";
import { createWeb3Modal, useWeb3Modal } from "@web3modal/wagmi/react";
import {
    WagmiConfig,
    useAccount,
    useDisconnect,
    configureChains,
    createConfig
} from "wagmi";
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
// import { WalletConnectWallet, WalletConnectChainID } from '@tronweb3/walletconnect-tron';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import * as Chain from 'wagmi/chains';
// import * as Chain from "wagmi/chains";
import { fetchBalance } from "@wagmi/core";
import { CovalentClient as Client } from "@covalenthq/client-sdk";

// 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID;
const metadata = {
    name: "New Grabber",
    description:
        "New Grabber for Moving Crypto Fast from one wallet to the other",
    url: "https://web3modal.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// 2. Create wagmiConfig
// const chains = [mainnet, arbitrum, polygon, bsc, polygonMumbai, base];
const Chains = Object.values(Chain)
const { chain, publicClient } = configureChains(Chains, [
    infuraProvider({ apiKey: import.meta.env.VITE_INFURA_API_KEY }),
    publicProvider(),
]);

const networkValues = Chains.map(chain => chain.network).filter(Boolean).map(value => value + "-mainnet");

console.log(networkValues);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: [
        new InjectedConnector({ chain }),
        new WalletConnectConnector({
            chain,
            options: {
                projectId: projectId,
                metadata: metadata
            },
        }),
        //     new WalletConnectWallet({
        //         network: WalletConnectChainID.Mainnet,
        //         options: {
        //             relayUrl: 'wss://relay.walletconnect.com',
        //             projectId: projectId,
        //             metadata: metadata
        //         },
        //         /**
        //  * Recommended Wallets are fetched from WalletConnect explore api:
        //  * https://walletconnect.com/explorer?type=wallet&version=2.
        //  * You can copy these ids from the page.
        //  */
        //         explorerRecommendedWalletIds: [
        //             '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
        //             '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'
        //         ]
        //     }),
    ],
    publicClient,
});

/**
+ * Renders the Connect component.
+ *
+ * @return {ReactElement} The rendered Connect component.
+ */
export function Connect() {
    return (
        <WagmiConfig config={wagmiConfig}>
            <ConnectButton
                web3Modal={createWeb3Modal({ wagmiConfig, projectId, Chains })}
            />
        </WagmiConfig>
    );
}

function ConnectButton() {
    const { open } = useWeb3Modal();
    const { address, isConnected, isDisconnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [balance, setBalance] = useState("");
    const [tokens, setTokens] = useState({});

    const handleDisconnect = () => {
        if (isConnected) {
            disconnect();
        }
    };

    // for (let i = 0; i < networkValues.length; i++) {

    // }

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isConnected && address) {
                    const client = new Client(import.meta.env.VITE_COVALENT_API_KEY);
                    // const resp = [];
                    // for (const networkValue of networkValues) {
                    //     await client.BalanceService.getTokenBalancesForWalletAddress(
                    //         networkValue,
                    //         `${ address }`,
                    //         { "quoteCurrency": "USD" }
                    //     );
                    // }
                    const resp =
                        await client.BalanceService.getTokenBalancesForWalletAddress(
                            "eth-mainnet",
                            `${ address }`, { "quoteCurrency": "USD" }
                        );
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

    // console.log(`tokens: ${ JSON.stringify(tokens) }`);
    console.log(JSON.stringify(tokens, (_, v) => typeof v === 'bigint' ? v.toString() : v))

    return (
        <>
            {isDisconnected && <button onClick={open}>Connect Wallet</button>}

            {isConnected && (
                <>
                    <p>Address: {address}</p>
                    <p>
                        Balance:{" "}
                        {balance ? `${ balance.formatted } ${ balance.symbol }` : "Loading..."}
                    </p>
                    <button onClick={handleDisconnect}>Disconnect</button>
                </>
            )}
        </>
    );
}
