// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/tokens/MinimalERC20.sol";
import "../contracts/tokens/BatchTokenFactory.sol";
import "../contracts/account/SmartAccountFactory.sol";
import "../contracts/erc4337/IEntryPoint.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address entryPoint = vm.envAddress("ENTRYPOINT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MinimalERC20 implementation
        MinimalERC20 implementation = new MinimalERC20();
        console.log("MinimalERC20 Implementation:", address(implementation));

        // 2. Deploy BatchTokenFactory
        BatchTokenFactory factory = new BatchTokenFactory(address(implementation));
        console.log("BatchTokenFactory:", address(factory));

        // 3. Deploy SmartAccountFactory
        SmartAccountFactory accountFactory = new SmartAccountFactory(IEntryPoint(entryPoint));
        console.log("SmartAccountFactory:", address(accountFactory));

        vm.stopBroadcast();

        // Write addresses to file
        string memory addresses = string(abi.encodePacked(
            '{\n',
            '  "entryPoint": "', vm.toString(entryPoint), '",\n',
            '  "minimalERC20Implementation": "', vm.toString(address(implementation)), '",\n',
            '  "batchTokenFactory": "', vm.toString(address(factory)), '",\n',
            '  "smartAccountFactory": "', vm.toString(address(accountFactory)), '"\n',
            '}'
        ));
        
        vm.writeFile("deployments.json", addresses);
        console.log("\nDeployment addresses written to deployments.json");
    }
}

