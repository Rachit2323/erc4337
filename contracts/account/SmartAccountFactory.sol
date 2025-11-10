// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./SmartAccount.sol";
import "../erc4337/IEntryPoint.sol";

/**
 * @title SmartAccountFactory
 * @notice Factory contract for deploying SmartAccount instances
 * @dev Uses CREATE2 for deterministic addresses
 */
contract SmartAccountFactory {
    IEntryPoint public immutable entryPoint;

    event AccountCreated(address indexed account, address indexed owner, uint256 salt);

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
    }

    /**
     * @notice Create a new SmartAccount
     * @param owner Owner's EOA address
     * @param salt Salt for CREATE2
     * @return account Address of created account
     */
    function createAccount(
        address owner,
        uint256 salt
    ) external returns (SmartAccount account) {
        bytes32 finalSalt = keccak256(abi.encodePacked(owner, salt));
        
        account = new SmartAccount{salt: finalSalt}(entryPoint, owner);
        
        emit AccountCreated(address(account), owner, salt);
    }

    /**
     * @notice Get the address of a SmartAccount before deployment
     * @param owner Owner's EOA address
     * @param salt Salt for CREATE2
     * @return Predicted account address
     */
    function getAddress(
        address owner,
        uint256 salt
    ) external view returns (address) {
        bytes32 finalSalt = keccak256(abi.encodePacked(owner, salt));
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                finalSalt,
                keccak256(
                    abi.encodePacked(
                        type(SmartAccount).creationCode,
                        abi.encode(entryPoint, owner)
                    )
                )
            )
        );
        return address(uint160(uint256(hash)));
    }
}

