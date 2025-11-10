import { ethers } from 'ethers';
import { ADDRESSES } from './constants';

export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: bigint;
  gasFees: string;
  paymasterAndData: string;
  signature: string;
}

export interface TokenParam {
  name: string;
  symbol: string;
  initialSupply: bigint;
}

// Pack two uint128 values into bytes32
function packUint128(high: bigint, low: bigint): string {
  const packed = (high << 128n) | low;
  return '0x' + packed.toString(16).padStart(64, '0');
}

// Encode SmartAccount.execute(target, value, data)
export function encodeExecute(target: string, value: bigint, data: string): string {
  const executeSelector = ethers.id('execute(address,uint256,bytes)').slice(0, 10);
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256', 'bytes'],
    [target, value, data]
  );
  return executeSelector + encoded.slice(2);
}

// Build UserOperation
export function buildUserOp(params: {
  sender: string;
  nonce: bigint;
  callData: string;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}): UserOperation {
  return {
    sender: params.sender,
    nonce: params.nonce,
    initCode: '0x',
    callData: params.callData,
    accountGasLimits: packUint128(params.verificationGasLimit, params.callGasLimit),
    preVerificationGas: params.preVerificationGas,
    gasFees: packUint128(params.maxPriorityFeePerGas, params.maxFeePerGas),
    paymasterAndData: '0x',
    signature: '0x',
  };
}

// Get UserOp hash for signing
export function getUserOpHash(
  userOp: UserOperation,
  entryPointAddress: string,
  chainId: bigint
): string {
  const packedUserOp = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'bytes32', 'bytes32', 'bytes32', 'uint256', 'bytes32', 'bytes32'],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.initCode),
        ethers.keccak256(userOp.callData),
        userOp.accountGasLimits,
        userOp.preVerificationGas,
        userOp.gasFees,
        ethers.keccak256(userOp.paymasterAndData),
      ]
    )
  );

  const finalHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'address', 'uint256'],
      [packedUserOp, entryPointAddress, chainId]
    )
  );

  return finalHash;
}

// Sign UserOp
export async function signUserOp(
  userOpHash: string,
  signer: ethers.Signer
): Promise<string> {
  // Sign with EIP-191 prefix
  const signature = await signer.signMessage(ethers.getBytes(userOpHash));
  return signature;
}

// Estimate gas limits
export function estimateGasLimits() {
  return {
    verificationGasLimit: 500000n,
    callGasLimit: 2000000n,
    preVerificationGas: 100000n,
  };
}

// Get or create SmartAccount address
export async function getSmartAccountAddress(
  factoryAddress: string,
  ownerAddress: string,
  provider: ethers.Provider
): Promise<string> {
  const factory = new ethers.Contract(
    factoryAddress,
    [
      'function getAddress(address owner, uint256 salt) external view returns (address)',
    ],
    provider
  );

  const salt = 0;
  const predictedAddress = await factory['getAddress(address,uint256)'](ownerAddress, salt);
  return predictedAddress;
}

// Check if SmartAccount exists
export async function smartAccountExists(
  accountAddress: string,
  provider: ethers.Provider
): Promise<boolean> {
  const code = await provider.getCode(accountAddress);
  return code !== '0x';
}

// Create SmartAccount
export async function createSmartAccount(
  factoryAddress: string,
  ownerAddress: string,
  signer: ethers.Signer
): Promise<string> {
  const factory = new ethers.Contract(
    factoryAddress,
    [
      'function createAccount(address owner, uint256 salt) external returns (address)',
    ],
    signer
  );

  const salt = 0;
  const tx = await factory.createAccount(ownerAddress, salt);
  await tx.wait();

  // Get the created address
  const provider = signer.provider!;
  const predictedAddress = await getSmartAccountAddress(factoryAddress, ownerAddress, provider);
  return predictedAddress;
}

