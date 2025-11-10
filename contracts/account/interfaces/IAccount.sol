// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../../erc4337/IEntryPoint.sol";

/**
 * @title IAccount
 * @notice Interface for ERC-4337 compatible account contracts
 */
interface IAccount {
    /**
     * @notice Validate a UserOperation
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation (for signature verification)
     * @param missingAccountFunds Amount of funds missing from account's deposit
     * @return validationData Packed validation data (validAfter, validUntil, authorizer)
     * @dev The account should return 0 for valid signature, 1 for invalid signature
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

/**
 * @title IAccountExecute
 * @notice Optional interface for account execution
 */
interface IAccountExecute {
    /**
     * @notice Execute a single call
     * @param target Target contract
     * @param value ETH value to send
     * @param data Calldata to execute
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external;

}

