import { useState, useEffect } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  ConnectButton,
} from '@rainbow-me/rainbowkit';
// import { Wallet } from '@rainbow-me/rainbowkit/dist/Wallet';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  zora,
  bsc
} from 'wagmi/chains';
// import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora, bsc],
  [
    // eslint-disable-next-line no-undef
    // alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_ID }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'New Grabber By Puzzo',
  projectId: 'f33fcd27c9ce58e7176e36666876b4d1',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})


export function TokenBalance() {
  const [balances, setBalances] = useState({});
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    async function fetchTokenBalances() {
      const wallet = new Wallet(walletAddress);
      const tokenBalances = {};

      for (const token of wallet.tokens) {
        const balance = await wallet.getBalance(token);
        tokenBalances[token] = balance;
      }

      setBalances(tokenBalances);
    }

    if (walletAddress) {
      fetchTokenBalances();
    }
  }, [walletAddress]);

  const handleScanQRCode = async () => {
    try {
      const address = await Wallet.scanQRCode();
      setWalletAddress(address);
    } catch (error) {
      console.error('Failed to scan QR code:', error);
    }
  };

  return (
    <div>
      <h1>Token Balances</h1>
      {walletAddress ? (
        <div>
          <p>Wallet Address: {walletAddress}</p>
          <ul>
            {Object.entries(balances).map(([token, balance]) => (
              <li key={token}>
                {token}: {balance}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button onClick={handleScanQRCode}>Scan QR Code</button>
      )}
    </div>
  );
}
const YourApp = () => {
  return <ConnectButton />;
};

function App() {

  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <YourApp />
        </RainbowKitProvider>
      </WagmiConfig>
      <TokenBalance />
    </>
  );


  // return (
  //   <>
  //     {/* <div>
  //       <a href="https://vitejs.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.jsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p> */}

  //     <div>
  //       <button>Connect Wallet</button>
  //     </div>
  //   </>
  // )
}

export default App
