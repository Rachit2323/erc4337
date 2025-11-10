// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IAccount.sol";
import "../erc4337/IEntryPoint.sol";

/**
 * @title SmartAccount
 * @notice Simple ERC-4337 compatible smart contract account
 * @dev Implements single ECDSA owner with nonce-based replay protection
 */
contract SmartAccount is IAccount, IAccountExecute {
    IEntryPoint public immutable entryPoint;
    address public owner;
    uint256 public nonce;

    event AccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);
    event AccountExecuted(address indexed target, uint256 value, bytes data);

    error OnlyEntryPoint();

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert OnlyEntryPoint();
        _;
    }

    /**
     * @notice Initialize the account
     * @param _entryPoint EntryPoint contract address
     * @param _owner Owner's EOA address
     */
    constructor(IEntryPoint _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
        emit AccountInitialized(_entryPoint, _owner);
    }

    /**
     * @notice Validate UserOperation signature and nonce
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash to verify signature against
     * @param missingAccountFunds Funds to deposit if needed
     * @return validationData 0 for valid, 1 for invalid
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external onlyEntryPoint returns (uint256 validationData) {
        // Verify nonce
        if (userOp.nonce != nonce) {
            return 1;
        }

        // Verify signature (ECDSA over userOpHash)
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));
        address recovered = _recoverSigner(hash, userOp.signature);
        
        if (recovered != owner) {
            return 1;
        }

        // Increment nonce
        nonce++;

        // Deposit missing funds if needed
        if (missingAccountFunds > 0) {
            (bool success,) = payable(address(entryPoint)).call{value: missingAccountFunds}("");
            require(success, "Deposit failed");
        }

        return 0;
    }

    /**
     * @notice Execute a single call
     * @param target Target contract
     * @param value ETH value to send
     * @param data Calldata
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyEntryPoint {
        _call(target, value, data);
    }

    /**
     * @notice Internal call execution
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit AccountExecuted(target, value, data);
    }

    /**
     * @notice Recover signer from signature
     */
    function _recoverSigner(
        bytes32 hash,
        bytes calldata signature
    ) internal pure returns (address) {
        if (signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return address(0);
        }

        return ecrecover(hash, v, r, s);
    }

    /**
     * @notice Accept ETH deposits
     */
    receive() external payable {}
}

