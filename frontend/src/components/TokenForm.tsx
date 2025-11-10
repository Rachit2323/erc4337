import React, { useState } from 'react';
import { ethers } from 'ethers';

export interface TokenInput {
  id: string;
  name: string;
  symbol: string;
  initialSupply: string;
}

interface TokenFormProps {
  tokens: TokenInput[];
  setTokens: React.Dispatch<React.SetStateAction<TokenInput[]>>;
}

export const TokenForm: React.FC<TokenFormProps> = ({ tokens, setTokens }) => {
  const [currentToken, setCurrentToken] = useState<Omit<TokenInput, 'id'>>({
    name: '',
    symbol: '',
    initialSupply: '',
  });

  const addToken = () => {
    if (!currentToken.name || !currentToken.symbol || !currentToken.initialSupply) {
      alert('Please fill all fields!');
      return;
    }

    try {
      // Validate supply is a number
      ethers.parseEther(currentToken.initialSupply);
    } catch (e) {
      alert('Invalid supply amount!');
      return;
    }

    const newToken: TokenInput = {
      ...currentToken,
      id: Date.now().toString(),
    };

    setTokens([...tokens, newToken]);
    setCurrentToken({ name: '', symbol: '', initialSupply: '' });
  };

  const removeToken = (id: string) => {
    setTokens(tokens.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add Token Form */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Add Token Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Token Name</label>
            <input
              type="text"
              placeholder="e.g., My Token"
              className="input-field"
              value={currentToken.name}
              onChange={(e) =>
                setCurrentToken({ ...currentToken, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Symbol</label>
            <input
              type="text"
              placeholder="e.g., MTK"
              className="input-field"
              value={currentToken.symbol}
              onChange={(e) =>
                setCurrentToken({ ...currentToken, symbol: e.target.value.toUpperCase() })
              }
            />
          </div>

          <div>
            <label className="label">Initial Supply</label>
            <input
              type="text"
              placeholder="e.g., 1000000"
              className="input-field"
              value={currentToken.initialSupply}
              onChange={(e) =>
                setCurrentToken({ ...currentToken, initialSupply: e.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={addToken}
          className="btn-secondary mt-6 w-full md:w-auto"
        >
          ➕ Add Token to List
        </button>
      </div>

      {/* Token List */}
      {tokens.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Tokens to Deploy ({tokens.length})
          </h3>
          <div className="space-y-3">
            {tokens.map((token, index) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-primary to-secondary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">
                      {token.name} ({token.symbol})
                    </div>
                    <div className="text-sm text-gray-600">
                      Supply: {token.initialSupply} tokens
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeToken(token.id)}
                  className="text-red-500 hover:text-red-700 font-bold text-xl px-3 py-1 hover:bg-red-50 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

