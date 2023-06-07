"use client";

import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { abi } from "./usdcAbi";
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
    console.log("chain Id:", 5);
    console.log("nonce", nonce);

    console.log("myAccount", myAccount);
    const spenderAccount = "0x59b96884db1acf2b6881ab8153C363c38DD11B2D";
    console.log("spender account", spenderAccount);
    const ammount = 1000;
    console.log("amount to approve", ammount);

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
        version: "1",
        chainId: 5,
        verifyingContract: "0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557", // goerli usdc contratc address
      },
      message: {
        owner: myAccount, // account 1
        spender: spenderAccount, // account 2
        value: amount,
        nonce: nonce,
        deadline: deadline,
      },
    };

    let signature = await signer.provider.send("eth_signTypedData_v4", [
      myAccount,
      JSON.stringify(typedData),
    ]);
    console.log("signature", signature);

    const splitSignature = ethers.utils.splitSignature(signature);

    console.log("r: ", splitSignature.r);
    console.log("s: ", splitSignature.s);
    console.log("v: ", splitSignature.v);

    // goerli usdc info
    const provider = new ethers.providers.JsonRpcProvider(
      "https://goerli.infura.io/v3/a14041d30b9a4bcc9104dc73c3908672"
    );

    const signer2 = await provider.getSigner(spenderAccount);
    console.log("2nd signer", signer2.getAddress());
    const usdcContractAddress = "0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557";
    const usdcContractABI = abi;

    const usdcContract = new ethers.Contract(
      usdcContractAddress,
      usdcContractABI,
      signer2
    );
    // console.log("contract", usdcContract);
    const tx = await usdcContract.permit(
      myAccount,
      spenderAccount,
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
    </main>
  );
}
