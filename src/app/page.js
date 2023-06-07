"use client";

import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { abi } from "./usdcAbi";

import Web3Modal from "web3modal";

export default function Home() {
  const [signer, setSigner] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [myAccount, setMyAccount] = useState(null);

  useEffect(() => {
    const connectToSigner = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          setSigner(signer);
          const myAccount = await signer.getAddress();
          setMyAccount(myAccount);
          const nonce = await provider.getTransactionCount(myAccount);
          setNonce(nonce);
          console.log("initial setup done");
        } catch (error) {
          console.error("Error connecting to signer:", error);
        }
      } else {
        console.error("No Ethereum provider found");
      }
    };

    connectToSigner();
  }, []);

  async function handleSign() {
    console.log("signing...");
    console.log("signer account", myAccount);
    const amount = 1000;
    const deadline = +new Date() + 60 * 60;
    console.log("deadline: " + deadline);
    localStorage.setItem("deadline", JSON.stringify(deadline));

    console.log("chain Id:", 5);
    console.log("nonce", nonce);

    console.log("myAccount", myAccount);
    const spenderAccount = "0x59b96884db1acf2b6881ab8153C363c38DD11B2D";
    console.log("spender account", spenderAccount);
    console.log("amount to approve", amount);

    const typedData = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "Permit",
      domain: {
        name: "Goerli USD Coin",
        version: "2",
        chainId: 5,
        verifyingContract: "0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557", // goerli usdc contratc address
      },
      message: {
        owner: myAccount, // account 1
        spender: spenderAccount, // account 2
        value: amount,
        nonce: nonce, // if failing second time because of nonce then try incrementing it manually like nonce + 1
        deadline: deadline,
      },
    };

    let signature = await signer.provider.send("eth_signTypedData_v4", [
      myAccount,
      JSON.stringify(typedData),
    ]);
    console.log("signature for ", myAccount, signature);
    localStorage.setItem("signature", JSON.stringify(signature));

    const splitSignature = ethers.utils.splitSignature(signature);

    console.log("r: ", splitSignature.r);
    console.log("s: ", splitSignature.s);
    console.log("v: ", splitSignature.v);
  }

  async function handlePermit() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer2 = provider.getSigner();

    console.log("2nd signer", signer2);
    const usdcContractAddress = "0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557";
    const usdcContractABI = abi;

    const usdcContract = new ethers.Contract(
      usdcContractAddress,
      usdcContractABI,
      signer2
    );
    console.log("contract", usdcContract);
    let account1 = "0xB3B4F48c36674A17e6C288B6Ad78266ed5a1bc3F";
    let account2 = "0x59b96884db1acf2b6881ab8153C363c38DD11B2D";
    console.log(account1, account2);
    const amount = 1000;
    const deadline = JSON.parse(localStorage.getItem("deadline"));
    console.log("deadline permit", deadline);

    const signature = JSON.parse(localStorage.getItem("signature"));
    console.log("signature permit", signature);
    const splitSignature = ethers.utils.splitSignature(signature);
    console.log("r: ", splitSignature.r);
    console.log("s: ", splitSignature.s);
    console.log("v: ", splitSignature.v);

    const tx = await usdcContract.permit(
      account1,
      account2,
      amount,
      deadline,
      splitSignature.v,
      splitSignature.r,
      splitSignature.s
    );
    await tx.wait();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button onClick={handleSign}>Sign with account 1</button>
      <button onClick={handlePermit}>call permit with account 2</button>
    </main>
  );
}
