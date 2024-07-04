
# Ethereum ATM

Welcome to  Ethereum ATM, a decentralized application (dApp) where users can interact with an Ethereum smart contract to manage ETH transactions.

## Features

- **Connect with MetaMask**: Users can connect their MetaMask wallet to interact with the Ethereum network.
- **Deposit and Withdraw ETH**: Users can deposit and withdraw 1 ETH at a time.
- **Transfer ETH**: Users can transfer 1 ETH to another Ethereum address.
- **New Functions included**: last deposit time, last withdrawal time and transfer.
## Frontend (React)

### HomePage.js

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
  const [transferAddress, setTransferAddress] = useState("");

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
    if (atm) {
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
    if (atm) {
      const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds

      // Check if enough time has passed since last withdrawal (24 hours in this example)
      if (currentTime - lastWithdrawalTime < 24 * 60 * 60) {
        alert("Please wait 24 hours between withdrawals.");
        return;
      }

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

  const transferETH = async () => {
    if (atm && transferAddress) {
      let tx = await atm.transfer(transferAddress, 1);
      await tx.wait();
      getBalance();
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
        <button onClick={deposit}>Deposit 1 ETH</button>
        <button onClick={withdraw}>Withdraw 1 ETH</button>
        <br />
        <br />
        <b>Transfer ETH</b>
        <input
          type="text"
          placeholder="Recipient Address"
          value={transferAddress}
          onChange={(e) => setTransferAddress(e.target.value)}
        />
        <button onClick={transferETH}>Transfer 1 ETH</button>
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
### Assessment.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Assessment {
    address payable public owner;
    uint256 public balance;

    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor(uint256 initBalance) payable {
        owner = payable(msg.sender);
        balance = initBalance;
    }

    function getBalance() public view returns (uint256) {
        return balance;
    }

    function deposit(uint256 _amount) public payable {
        uint256 _previousBalance = balance;

        // Ensure this is the owner
        require(msg.sender == owner, "You are not the owner of this account");

        // Perform transaction
        balance += _amount;

        // Assert transaction completed successfully
        assert(balance == _previousBalance + _amount);

        // Emit the event
        emit Deposit(_amount);
    }

    // Custom error
    error InsufficientBalance(uint256 balance, uint256 withdrawAmount);

    function withdraw(uint256 _withdrawAmount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        uint256 _previousBalance = balance;
        if (balance < _withdrawAmount) {
            revert InsufficientBalance({
                balance: balance,
                withdrawAmount: _withdrawAmount
            });
        }

        // Withdraw the given amount
        balance -= _withdrawAmount;

        // Assert the balance is correct
        assert(balance == _previousBalance - _withdrawAmount);

        // Emit the event
        emit Withdraw(_withdrawAmount);
    }

    function transfer(address payable _to, uint256 _amount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(_to != address(0), "Transfer to the zero address");

        uint256 _previousBalance = balance;

        // Check balance
        if (balance < _amount) {
            revert InsufficientBalance({
                balance: balance,
                withdrawAmount: _amount
            });
        }

        // Transfer the amount
        balance -= _amount;
        _to.transfer(_amount);

        // Emit the event
        emit Transfer(msg.sender, _to, _amount);

        // Assert the balance is correct
        assert(balance == _previousBalance - _amount);
    }
}
```



## Technologies Used

- **React**: Frontend UI library for building the user interface.
- **Ethers.js**: Ethereum JavaScript library for interacting with Ethereum smart contracts.
- **Solidity**: Smart contract language used for the Ethereum smart contract.

