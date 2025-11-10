// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MinimalERC20
 * @notice Minimal ERC-20 implementation with initializer pattern for clones
 * @dev Designed to be deployed as an implementation then cloned via ERC-1167
 */
contract MinimalERC20 {
    string private _name;
    string private _symbol;
    uint8 private constant _decimals = 18;
    uint256 private _totalSupply;
    address private _owner;
    bool private _initialized;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error AlreadyInitialized();
    error NotOwner();

    /**
     * @notice Initialize the token (replaces constructor for clones)
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param initialSupply Initial supply to mint
     * @param owner_ Token owner
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address owner_
    ) external {
        if (_initialized) revert AlreadyInitialized();
        
        _initialized = true;
        _name = name_;
        _symbol = symbol_;
        _owner = owner_;
        
        if (initialSupply > 0) {
            _totalSupply = initialSupply;
            _balances[owner_] = initialSupply;
            emit Transfer(address(0), owner_, initialSupply);
        }

        emit OwnershipTransferred(address(0), owner_);
    }

    // ERC-20 Standard Functions

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external pure returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    // Internal functions

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from zero address");
        require(to != address(0), "ERC20: transfer to zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: insufficient balance");
        
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = _allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}

