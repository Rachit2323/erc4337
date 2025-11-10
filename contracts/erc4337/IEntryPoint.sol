// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IEntryPoint
 * @notice Interface for ERC-4337 EntryPoint contract
 * @dev Based on the canonical EntryPoint v0.7
 */

struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}

interface IEntryPoint {
    /**
     * @notice Execute a batch of UserOperations
     * @param ops Array of UserOperations to execute
     * @param beneficiary Address to receive collected fees
     */
    function handleOps(
        PackedUserOperation[] calldata ops,
        address payable beneficiary
    ) external;

    /**
     * @notice Get hash of a UserOperation (for signing)
     * @param userOp The UserOperation to hash
     * @return Hash of the UserOperation
     */
    function getUserOpHash(
        PackedUserOperation calldata userOp
    ) external view returns (bytes32);

    /**
     * @notice Deposit ETH for an account to pay for gas
     * @param account Account to deposit for
     */
    function depositTo(address account) external payable;

    /**
     * @notice Get deposit balance of an account
     * @param account Account to check
     * @return Deposit balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Withdraw deposit to an address
     * @param withdrawAddress Address to withdraw to
     * @param withdrawAmount Amount to withdraw
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 withdrawAmount
    ) external;
}

