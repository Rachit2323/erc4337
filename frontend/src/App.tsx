import { useState } from 'react';
import { ethers } from 'ethers';
import { TokenForm, TokenInput } from './components/TokenForm';
import { DeploymentStatus } from './components/DeploymentStatus';
import { web3Service } from './utils/web3';
import {
  buildUserOp,
  getUserOpHash,
  signUserOp,
  encodeExecute,
  estimateGasLimits,
  getSmartAccountAddress,
  smartAccountExists,
  createSmartAccount,
} from './utils/erc4337';
import { ADDRESSES, ABIS, SEPOLIA_CHAIN_ID } from './utils/constants';

interface DeployedToken {
  name: string;
  symbol: string;
  address: string;
  owner: string;
  supply: string;
}

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>('');
  const [smartAccountExists_, setSmartAccountExists_] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>('0');
  const [smartAccountBalance, setSmartAccountBalance] = useState<string>('0');
  const [tokens, setTokens] = useState<TokenInput[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'idle' | 'deploying' | 'success' | 'error';
    message: string;
    txHash?: string;
    deployedTokens?: DeployedToken[];
  }>({
    status: 'idle',
    message: '',
  });

  const connectWallet = async () => {
    try {
      const address = await web3Service.connectWallet();
      setWalletAddress(address);

      // Get balance
      const bal = await web3Service.getBalance(address);
      setBalance(bal);

      // Check SmartAccount
      await checkSmartAccount(address);
    } catch (error: any) {
      alert(error.message || 'Failed to connect wallet');
    }
  };

  const checkSmartAccount = async (ownerAddress: string) => {
    try {
      const provider = web3Service.getProvider();
      const accountAddress = await getSmartAccountAddress(
        ADDRESSES.smartAccountFactory,
        ownerAddress,
        provider
      );
      setSmartAccountAddress(accountAddress);

      const exists = await smartAccountExists(accountAddress, provider);
      setSmartAccountExists_(exists);

      // Get SmartAccount balance
      if (exists) {
        const bal = await web3Service.getBalance(accountAddress);
        setSmartAccountBalance(bal);
      }
    } catch (error) {
      console.error('Error checking SmartAccount:', error);
    }
  };

  const handleCreateSmartAccount = async () => {
    try {
      setDeploymentStatus({
        status: 'deploying',
        message: 'Creating your SmartAccount...',
      });

      const signer = web3Service.getSigner();
      const accountAddress = await createSmartAccount(
        ADDRESSES.smartAccountFactory,
        walletAddress,
        signer
      );

      setSmartAccountAddress(accountAddress);
      setSmartAccountExists_(true);

      setDeploymentStatus({
        status: 'success',
        message: `SmartAccount created at ${accountAddress}`,
      });

      setTimeout(() => {
        setDeploymentStatus({ status: 'idle', message: '' });
      }, 5000);
    } catch (error: any) {
      setDeploymentStatus({
        status: 'error',
        message: error.message || 'Failed to create SmartAccount',
      });
    }
  };

  const deployTokens = async () => {
    if (tokens.length === 0) {
      alert('Please add at least one token!');
      return;
    }

    if (!smartAccountExists_) {
      alert('Please create a SmartAccount first!');
      return;
    }

    // Check if SmartAccount has enough ETH
    try {
      const smartAccountBalance = await web3Service.getBalance(smartAccountAddress);
      if (parseFloat(smartAccountBalance) < 0.01) {
        setDeploymentStatus({
          status: 'error',
          message: `⚠️ Your SmartAccount needs ETH! Current balance: ${parseFloat(smartAccountBalance).toFixed(4)} ETH. Please send at least 0.02 ETH to your SmartAccount: ${smartAccountAddress}`,
        });
        return;
      }
    } catch (e) {
      console.error('Error checking balance:', e);
    }

    try {
      setDeploymentStatus({
        status: 'deploying',
        message: 'Step 1: Preparing UserOperation...',
      });

      const provider = web3Service.getProvider();
      const signer = web3Service.getSigner();
      const chainId = BigInt(SEPOLIA_CHAIN_ID);

      // Get SmartAccount nonce
      const smartAccount = new ethers.Contract(
        smartAccountAddress,
        ABIS.SmartAccount,
        provider
      );
      const nonce = await smartAccount.nonce();

      // Prepare token parameters
      const tokenParams = tokens.map((t) => ({
        name: t.name,
        symbol: t.symbol,
        initialSupply: ethers.parseEther(t.initialSupply),
      }));

      // Encode BatchTokenFactory call
      const factoryInterface = new ethers.Interface(ABIS.BatchTokenFactory);
      const batchDeployCalldata = factoryInterface.encodeFunctionData(
        'batchDeployTokens',
        [tokenParams]
      );

      // Encode SmartAccount.execute() call
      const executeCallData = encodeExecute(
        ADDRESSES.batchTokenFactory,
        0n,
        batchDeployCalldata
      );

      setDeploymentStatus({
        status: 'deploying',
        message: 'Step 2: Building UserOperation...',
      });

      // Build UserOperation
      const gasLimits = estimateGasLimits();
      const feeData = await provider.getFeeData();

      const userOp = buildUserOp({
        sender: smartAccountAddress,
        nonce: nonce,
        callData: executeCallData,
        verificationGasLimit: gasLimits.verificationGasLimit,
        callGasLimit: gasLimits.callGasLimit,
        preVerificationGas: gasLimits.preVerificationGas,
        maxFeePerGas: feeData.maxFeePerGas || ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei'),
      });

      setDeploymentStatus({
        status: 'deploying',
        message: 'Step 3: Signing UserOperation...',
      });

      // Hash and sign UserOperation
      const userOpHash = getUserOpHash(userOp, ADDRESSES.entryPoint, chainId);
      const signature = await signUserOp(userOpHash, signer);
      userOp.signature = signature;

      setDeploymentStatus({
        status: 'deploying',
        message: 'Step 4: Submitting to EntryPoint (please confirm in MetaMask)...',
      });

      // Submit to EntryPoint
      const entryPoint = new ethers.Contract(
        ADDRESSES.entryPoint,
        ABIS.EntryPoint,
        signer
      );

      const tx = await entryPoint.handleOps([userOp], walletAddress);

      setDeploymentStatus({
        status: 'deploying',
        message: 'Step 5: Waiting for confirmation...',
      });

      const receipt = await tx.wait();

      // Parse logs to find deployed tokens
      const factory = new ethers.Contract(
        ADDRESSES.batchTokenFactory,
        ABIS.BatchTokenFactory,
        provider
      );

      const deployedTokens: DeployedToken[] = [];
      receipt.logs.forEach((log: any) => {
        try {
          const parsed = factory.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          if (parsed && parsed.name === 'TokenDeployed') {
            deployedTokens.push({
              name: parsed.args.name,
              symbol: parsed.args.symbol,
              address: parsed.args.token,
              owner: parsed.args.owner,
              supply: ethers.formatEther(parsed.args.initialSupply),
            });
          }
        } catch (e) {}
      });

      setDeploymentStatus({
        status: 'success',
        message: `Successfully deployed ${deployedTokens.length} tokens via ERC-4337!`,
        txHash: tx.hash,
        deployedTokens,
      });

      // Clear token list
      setTokens([]);
    } catch (error: any) {
      console.error('Deployment error:', error);
      
      let errorMessage = 'Failed to deploy tokens';
      
      // Handle specific error cases
      if (error.message?.includes('missing revert data') || error.message?.includes('CALL_EXCEPTION')) {
        errorMessage = `⚠️ Transaction failed! Common causes:\n\n1. Your SmartAccount needs ETH (check balance below)\n2. SmartAccount address: ${smartAccountAddress}\n3. Send 0.02-0.05 ETH to this address\n\nThen try again!`;
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = `⚠️ Insufficient funds! Your SmartAccount needs ETH to pay for gas.\n\nSend ETH to: ${smartAccountAddress}`;
      } else if (error.message?.includes('user rejected')) {
        errorMessage = '❌ Transaction was rejected in MetaMask';
      } else {
        errorMessage = error.message || 'Failed to deploy tokens';
      }
      
      setDeploymentStatus({
        status: 'error',
        message: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            🚀 ERC-4337 Token Deployer
          </h1>
          <p className="text-gray-600">
            Deploy multiple ERC-20 tokens in a single transaction using Account Abstraction
          </p>
        </div>

        {/* Wallet Connection */}
        {!walletAddress ? (
          <div className="card text-center">
            <div className="text-6xl mb-4">🦊</div>
            <h2 className="text-2xl font-bold mb-4">Connect MetaMask Wallet</h2>
            <p className="text-gray-600 mb-6">
              This app uses <strong>MetaMask ONLY</strong>. We'll automatically switch to Sepolia
              testnet after connection.
            </p>
            <button onClick={connectWallet} className="btn-primary">
              🦊 Connect MetaMask
            </button>
            <p className="text-xs text-gray-500 mt-4">
              MetaMask supported
            </p>
          </div>
        ) : (
          <>
            {/* Wallet Info */}
            <div className="card mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Connected Wallet</div>
                  <div className="font-mono font-semibold text-gray-800">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Balance: {parseFloat(balance).toFixed(4)} ETH
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">SmartAccount</div>
                  {smartAccountAddress ? (
                    <>
                      <div className="font-mono font-semibold text-gray-800">
                        {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
                      </div>
                      <div className="text-sm mt-1">
                        {smartAccountExists_ ? (
                          <>
                            <span className="text-green-600 font-semibold">✓ Active</span>
                            <div className="text-xs text-gray-600 mt-1">
                              Balance: {parseFloat(smartAccountBalance).toFixed(4)} ETH
                              {parseFloat(smartAccountBalance) < 0.01 && (
                                <span className="text-red-600 font-semibold ml-1">⚠️ Low!</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <button onClick={handleCreateSmartAccount} className="btn-secondary text-xs">
                            Create Account
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">Loading...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Low Balance Warning */}
            {smartAccountExists_ && parseFloat(smartAccountBalance) < 0.01 && (
              <div className="card mb-6 border-2 border-red-300 bg-red-50">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">SmartAccount Needs ETH!</h3>
                    <p className="text-red-700 mb-3">
                      Your SmartAccount has <strong>{parseFloat(smartAccountBalance).toFixed(4)} ETH</strong> which is too low to deploy tokens.
                      You need at least <strong>0.02 ETH</strong> to pay for gas fees.
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Send ETH to your SmartAccount:</p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
                          {smartAccountAddress}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(smartAccountAddress)}
                          className="btn-secondary text-xs"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      💡 Tip: Use MetaMask to send 0.02-0.05 ETH from your wallet to the SmartAccount address above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Token Form */}
            {smartAccountExists_ && <TokenForm tokens={tokens} setTokens={setTokens} />}

            {/* Deploy Button */}
            {smartAccountExists_ && tokens.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={deployTokens}
                  disabled={deploymentStatus.status === 'deploying'}
                  className="btn-primary w-full text-lg py-4"
                >
                  {deploymentStatus.status === 'deploying'
                    ? '⏳ Deploying...'
                    : `🚀 Deploy ${tokens.length} Token${tokens.length > 1 ? 's' : ''} via ERC-4337`}
                </button>
                <p className="text-center text-sm text-gray-600 mt-3">
                  All tokens will be deployed in a single transaction using Account Abstraction
                </p>
              </div>
            )}

            {/* Deployment Status */}
            <DeploymentStatus {...deploymentStatus} />
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-white/80 text-sm">
          <p>Powered by ERC-4337 Account Abstraction</p>
          <p className="mt-1">EntryPoint: {ADDRESSES.entryPoint.slice(0, 10)}...</p>
        </div>
      </div>
    </div>
  );
}

export default App;

