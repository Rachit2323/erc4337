// Network Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';

// Contract Addresses (from your deployments.json)
export const ADDRESSES = {
  entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  minimalERC20Implementation: '0xaFd482eE83aD8b292b95529E6D375345d61575Db',
  batchTokenFactory: '0xa667A04fBe2FDFD3d16c14C60EC1C300e7190d85',
  smartAccountFactory: '0x8838EA1d2188f63f9187573A77d4b0B31193086D',
  // SmartAccount address will be detected from user's wallet
};

// ABIs
export const ABIS = {
  SmartAccountFactory: [
    'function createAccount(address owner, uint256 salt) external returns (address)',
    'function getAddress(address owner, uint256 salt) external view returns (address)',
  ],
  SmartAccount: [
    'function nonce() external view returns (uint256)',
    'function owner() external view returns (address)',
    'function execute(address target, uint256 value, bytes calldata data) external',
  ],
  BatchTokenFactory: [
    'function batchDeployTokens(tuple(string name, string symbol, uint256 initialSupply)[] params) external returns (address[] tokens)',
    'event TokenDeployed(address indexed token, address indexed owner, string name, string symbol, uint256 initialSupply)',
  ],
  EntryPoint: [
    'function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature)[] calldata ops, address payable beneficiary) external',
  ],
  ERC20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function owner() view returns (address)',
  ],
};

