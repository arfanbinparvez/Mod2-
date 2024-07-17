
# Ethereum ATM

Welcome to  Ethereum ATM, a decentralized application (dApp) where users can interact with an Ethereum smart contract to manage ETH transactions.

## Features

- **Connect with MetaMask**: Users can connect their MetaMask wallet to interact with the Ethereum network.
- **Deposit and Withdraw ETH**: Users can deposit and withdraw 1 ETH at a time.
- **New Functionalities included**: last deposit time, last withdrawal time, pause contract, resume contract, and disconnect wallet.
## Frontend (React)

### frontend_code.js

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [lastWithdrawalTime, setLastWithdrawalTime] = useState(0);
  const [lastDepositTime, setLastDepositTime] = useState(0);
  const [paused, setPaused] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  };

  const deposit = async () => {
    if (atm && !paused) {
      try {
        let tx = await atm.deposit(1);
        await tx.wait();
        getBalance();

        // Update last deposit time to current time
        const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
        setLastDepositTime(currentTime);
      } catch (error) {
        console.error("Error depositing:", error);
      }
    }
  };

  const withdraw = async () => {
    if (atm && !paused) {
      const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds

      try {
        let tx = await atm.withdraw(1);
        await tx.wait();
        getBalance();

        // Update last withdrawal time to current time
        setLastWithdrawalTime(currentTime);
      } catch (error) {
        console.error("Error withdrawing:", error);
      }
    }
  };

  const pauseContract = async () => {
    if (atm) {
      try {
        let tx = await atm.pauseContract();
        await tx.wait();
        setPaused(true);
      } catch (error) {
        console.error("Error pausing contract:", error);
      }
    }
  };

  const resumeContract = async () => {
    if (atm) {
      try {
        let tx = await atm.resumeContract();
        await tx.wait();
        setPaused(false);
      } catch (error) {
        console.error("Error resuming contract:", error);
      }
    }
  };

  const disconnectWallet = async () => {
    if (atm) {
      try {
        let tx = await atm.disconnectWallet();
        await tx.wait();
        setAccount(undefined);
        setBalance(undefined);
        setLastWithdrawalTime(0);
        setLastDepositTime(0);
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
      }
    }
  };

  const initUser = () => {
    // Check to see if user has MetaMask
    if (!ethWallet) {
      return <p>Please install MetaMask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return (
        <button onClick={connectAccount}>
          Please connect your MetaMask wallet
        </button>
      );
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>
        <p>
          Last Withdrawal Time:{" "}
          {new Date(lastWithdrawalTime * 1000).toLocaleString()}
        </p>
        <p>
          Last Deposit Time:{" "}
          {new Date(lastDepositTime * 1000).toLocaleString()}
        </p>
        <p>Contract Paused: {paused ? "Yes" : "No"}</p>
        <button onClick={deposit} disabled={paused}>Deposit 1 ETH</button>
        <button onClick={withdraw} disabled={paused}>Withdraw 1 ETH</button>
        <br />
        <br />
        <button onClick={pauseContract}>Pause Contract</button>
        <button onClick={resumeContract}>Resume Contract</button>
        <button onClick={disconnectWallet}>Disconnect Wallet</button>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="atm-container">
      <header className="atm-header">
        <h1>Welcome to ARFAN's ETH ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .atm-container {
          text-align: center;
          background-color: #f0f8ff;
          border-radius: 10px;
          padding: 30px;
          max-width: 500px;
          margin: 0 auto;
          box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
        }

        .atm-header {
          margin-bottom: 20px;
        }
      `}</style>
    </main>
  );
}

```
## Smart Contract (Solidity)
### smart_contract.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract smart_contract {
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


```
## Deployment 
### deployment_script.js

```
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const initBalance = 1;
  const cont = await hre.ethers.getContractFactory("cont");
  const smart_contract = await cont.deploy(initBalance);
  await smart_contract.deployed();

  console.log(`A contract with balance of ${initBalance} eth deployed to ${smart_contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```


## Technologies Used

- **React**: Frontend UI library for building the user interface.
- **Ethers.js**: Ethereum JavaScript library for interacting with Ethereum smart contracts.
- **Solidity**: Smart contract language used for the Ethereum smart contract.

