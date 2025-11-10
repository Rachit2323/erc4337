.PHONY: install build test deploy create-account deposit batch-deploy clean help

# Default target
help:
	@echo "ERC-4337 Batch Token Factory"
	@echo "============================"
	@echo ""
	@echo "Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make build          - Compile contracts"
	@echo "  make test           - Run tests"
	@echo "  make deploy         - Deploy contracts"
	@echo "  make create-account - Create smart account"
	@echo "  make deposit        - Deposit to EntryPoint"
	@echo "  make batch-deploy   - Batch deploy tokens"
	@echo "  make clean          - Clean build artifacts"
	@echo ""

# Install dependencies
install:
	npm install
	forge install

# Build contracts
build:
	forge build

# Run tests
test:
	forge test -vv

# Deploy contracts
deploy:
	@echo "Deploying contracts..."
	forge script script/Deploy.s.sol:DeployScript --rpc-url $(RPC_URL) --broadcast

# Create smart account
create-account:
	npm run create-account

# Deposit to EntryPoint
deposit:
	npm run deposit

# Batch deploy tokens
batch-deploy:
	npm run batch-deploy

# Clean build artifacts
clean:
	forge clean
	rm -rf node_modules
	rm -rf out
	rm -rf cache
	rm -f deployments.json

# Start local node
anvil:
	anvil

# Run all tests with gas report
test-gas:
	forge test --gas-report

# Format code
format:
	forge fmt

