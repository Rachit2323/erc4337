// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./MinimalERC20.sol";

/**
 * @title BatchTokenFactory
 * @notice Factory for batch deploying multiple ERC-20 tokens using ERC-1167 minimal proxies
 * @dev Clones a MinimalERC20 implementation for gas efficiency
 */
contract BatchTokenFactory {
    address public immutable implementation;

    struct TokenParam {
        string name;
        string symbol;
        uint256 initialSupply;
    }

    event TokenDeployed(
        address indexed token,
        address indexed owner,
        string name,
        string symbol,
        uint256 initialSupply
    );

    event BatchDeployed(
        address indexed owner,
        uint256 count,
        address[] tokens
    );

    error DeploymentFailed(uint256 index);

    /**
     * @notice Constructor
     * @param _implementation Address of MinimalERC20 implementation to clone
     */
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * @notice Deploy multiple ERC-20 tokens in a single transaction
     * @param params Array of token parameters
     * @return tokens Array of deployed token addresses
     * @dev msg.sender becomes the owner of all deployed tokens
     */
    function batchDeployTokens(
        TokenParam[] calldata params
    ) external returns (address[] memory tokens) {
        uint256 count = params.length;
        tokens = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            // Clone the implementation
            address clone = _clone(implementation);
            
            // Initialize the clone
            try MinimalERC20(clone).initialize(
                params[i].name,
                params[i].symbol,
                params[i].initialSupply,
                msg.sender // Smart Account becomes owner
            ) {
                tokens[i] = clone;
                
                emit TokenDeployed(
                    clone,
                    msg.sender,
                    params[i].name,
                    params[i].symbol,
                    params[i].initialSupply
                );
            } catch {
                revert DeploymentFailed(i);
            }
        }

        emit BatchDeployed(msg.sender, count, tokens);
        return tokens;
    }

    /**
     * @notice Deploy a single ERC-20 token
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial supply
     * @return token Address of deployed token
     */
    function deployToken(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply
    ) external returns (address token) {
        token = _clone(implementation);
        MinimalERC20(token).initialize(name, symbol, initialSupply, msg.sender);
        
        emit TokenDeployed(token, msg.sender, name, symbol, initialSupply);
        return token;
    }

    /**
     * @notice Create an ERC-1167 minimal proxy clone
     * @param target Implementation address to clone
     * @return result Address of the clone
     */
    function _clone(address target) internal returns (address result) {
        // ERC-1167 minimal proxy bytecode
        bytes20 targetBytes = bytes20(target);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
        require(result != address(0), "Clone failed");
    }
}

