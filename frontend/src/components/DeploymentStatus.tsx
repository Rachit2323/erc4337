import React from 'react';

interface DeployedToken {
  name: string;
  symbol: string;
  address: string;
  owner: string;
  supply: string;
}

interface DeploymentStatusProps {
  status: 'idle' | 'deploying' | 'success' | 'error';
  message: string;
  txHash?: string;
  deployedTokens?: DeployedToken[];
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({
  status,
  message,
  txHash,
  deployedTokens,
}) => {
  if (status === 'idle') return null;

  return (
    <div className="card mt-6">
      {status === 'deploying' && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <h3 className="text-xl font-bold text-gray-800">Deploying Tokens...</h3>
          <p className="text-gray-600 mt-2">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="text-center mb-6">
            <div className="inline-block text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              Deployment Successful!
            </h3>
            <p className="text-gray-600">{message}</p>
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-primary hover:text-secondary font-semibold underline"
              >
                View on Etherscan →
              </a>
            )}
          </div>

          {deployedTokens && deployedTokens.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-gray-800">Deployed Tokens:</h4>
              {deployedTokens.map((token, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg text-gray-800">
                      {token.name} ({token.symbol})
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Deployed
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Address:</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-secondary font-mono text-xs underline"
                      >
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Supply:</span>
                      <span className="font-semibold">{token.supply}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="inline-block text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-red-600 mb-2">Deployment Failed</h3>
          <p className="text-gray-600">{message}</p>
        </div>
      )}
    </div>
  );
};

