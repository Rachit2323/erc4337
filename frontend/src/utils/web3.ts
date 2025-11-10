import { ethers, BrowserProvider } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URL } from './constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  provider: BrowserProvider | null = null;
  signer: ethers.Signer | null = null;

  async connectWallet(): Promise<string> {
    // Explicitly check for MetaMask ONLY (not Phantom or other wallets)
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed! Please install MetaMask browser extension.');
    }

    // Verify this is MetaMask (window.ethereum exists)
    // We explicitly use window.ethereum which is MetaMask
    // We do NOT use window.solana (Phantom) or any other wallet
    console.log('✅ Using MetaMask wallet (window.ethereum)');

    // Request account access from MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create provider and signer
    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    // Switch to Sepolia
    await this.switchToSepolia();

    const address = await this.signer.getAddress();
    return address;
  }

  async switchToSepolia(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed!');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [SEPOLIA_RPC_URL],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Sepolia network');
        }
      } else {
        throw switchError;
      }
    }
  }

  async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return this.signer;
  }

  getProvider(): BrowserProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }
}

export const web3Service = new Web3Service();

