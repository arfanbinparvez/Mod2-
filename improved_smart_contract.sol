// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Assessment {
    address payable public owner;
    uint256 public balance;
    uint256 public lastWithdrawTime;
    uint256 public lastDepositTime;
    bool public paused = false;

    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event Paused(bool isPaused);
    event Terminated(address terminatedBy);
    event OwnerUpdated(address newOwner);

    constructor(uint initBalance) payable {
        owner = payable(msg.sender);
        balance = initBalance;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner of this account");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function getBalance() public view returns (uint256) {
        return balance;
    }

    function deposit(uint256 _amount) public payable onlyOwner whenNotPaused {
        uint256 _previousBalance = balance;

        // Perform transaction
        balance += _amount;

        // Update the last deposit time
        lastDepositTime = block.timestamp;

        // Assert transaction completed successfully
        assert(balance == _previousBalance + _amount);

        // Emit the event
        emit Deposit(_amount);
    }

    // Custom error
    error InsufficientBalance(uint256 balance, uint256 withdrawAmount);

    function withdraw(uint256 _withdrawAmount) public onlyOwner whenNotPaused {
        uint256 _previousBalance = balance;
        if (balance < _withdrawAmount) {
            revert InsufficientBalance({
                balance: balance,
                withdrawAmount: _withdrawAmount
            });
        }

        // Withdraw the given amount
        balance -= _withdrawAmount;

        // Update the last withdraw time
        lastWithdrawTime = block.timestamp;

        // Assert the balance is correct
        assert(balance == _previousBalance - _withdrawAmount);

        // Emit the event
        emit Withdraw(_withdrawAmount);
    }

    function getLastWithdrawTime() public view returns (uint256) {
        return lastWithdrawTime;
    }

    function getLastDepositTime() public view returns (uint256) {
        return lastDepositTime;
    }

    function updateOwner(address payable newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function disconnectWallet() public onlyOwner {
        owner = payable(address(0));
        emit OwnerUpdated(address(0));
    }

    function pauseContract() public onlyOwner {
        paused = true;
        emit Paused(true);
    }

    function resumeContract() public onlyOwner {
        paused = false;
        emit Paused(false);
    }

    function terminateContract() public onlyOwner {
        emit Terminated(owner);
        selfdestruct(owner);
    }
}
