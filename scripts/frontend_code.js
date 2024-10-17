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
