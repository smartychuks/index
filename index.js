import React, {useEffect,useState, useRef} from 'react';
import Web3Modal from "web3modal";
import {Contract, providers, utils} from 'ethers';
import styles from "../styles/Home.module.css";
import Head from 'next/head';
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants';

export default function Home() {
    const [isOwner, setIsOwner] = useState(false);
    const [presaleStarted, setPresaleStarted] = useState(false);
    const [presaleEnded, setPresaleEnded] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [numTokensMinted, setNumTokensMinted] = useState("0");
    const [loading, setLoading] = useState(false);
    const web3ModalRef = useRef();

    const getNumMintedTokens = async () => {
      try{
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          provider
        );

        const numTokenIds = await nftContract.tokenIds();
        setNumTokensMinted(numTokenIds.toString());
      }catch(error){
        console.error(error);
      }
    }

    const presaleMint = async ()=>{
      try{

        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );

        const txn = await nftContract.presaleMint({
          value: utils.parseEther("0.005"),
        })
        await txn.wait();//Wait for transaction to be mined
        window.alert("Minted Crypto Mania successfully");
      }catch(error){
        console.error(error);
      }
    }

    const publicMint = async() =>{
      try{
        setLoading(true);
        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );

        const txn = await nftContract.mint({
          value: utils.parseEther("0.01"),
        })
        await txn.wait();//Wait for transaction to be mined
        window.alert("Minted Crypto Mania successfully");
      }catch(error){
        console.error(error);
      }
      setLoading(false);
    }

    const getOwner = async() =>{
      try{
        const signer = await getProviderOrSigner(true);

        // Get instance of Nft Contract
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );

        const owner = await nftContract.owner();
        const userAddress = await signer.getAddress();

        if(owner.toLowerCase() === (await userAddress).toLowerCase()){
          setIsOwner(true);
        }


      }catch(error){
        console.error(error);
      }
    }

    const startPresale = async() => {
      try{
        setLoading(true);
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );

        const txn = await nftContract.startPresale();
        await txn.wait();

      }catch(error){
        console.error(error);
      }
      setPresaleStarted(true);
      setLoading(false);
    }

    const checkIfPresaleEnded = async() =>{
      try{
        const provider = await getProviderOrSigner();

        // Get instance of Nft Contract
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          provider
        );

        const presaleEndTime = await nftContract.presaleEnded();// This returns time in seconds
        const currentTimeInSeconds = Date.now()/1000;
        const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));
        
        setPresaleEnded(hasPresaleEnded);

      }catch(error){
        console.error(error);
      }
    }

    const checkIfPresaleStarted = async() =>{
      try{
        const provider = await getProviderOrSigner();

        // Get instance of Nft Contract
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          provider
        );

        const isPresaleStarted = await nftContract.presaleStarted();
        setPresaleStarted(isPresaleStarted);
        
        return isPresaleStarted;
      }catch(error){
        console.error(error);
        return false;
      }
    }


    const connectWallet = async() =>{
      try{
        await getProviderOrSigner();
        setWalletConnected(true);
      }catch(error){
        console.error(error);
      }
    }

    const getProviderOrSigner = async (needSigner = false) =>{
      
      // To gain access to the provider/signer which is metamask
      const provider = await web3ModalRef.current.connect();// this line is what pops up metamask
      const web3Provider = new providers.Web3Provider(provider);

      // If user is not connected to georli
      const {chainId} = await web3Provider.getNetwork();
      if(chainId !== 5){
        window.alert('Pls switch to goerli');
        throw new Error('Incorrect network');
      }

      if(needSigner){
        const signer = web3Provider.getSigner();
        return signer;
      }
    }

    const onPageLoad = async () => {
      await connectWallet();
      await getOwner();
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted){
        await checkIfPresaleEnded()
      }
      await getNumMintedTokens();

      // To track in real time the number of minted NFTs every 5 secs
      setInterval(async()=>{
        await getNumMintedTokens()
      }, 5 * 1000)

      // Track in real time the status of presale, if ended or started
      setInterval(async()=>{
        const presaleStarted = await checkIfPresaleStarted();
        if(presaleStarted){
          await checkIfPresaleEnded();
        }
      }, 5 * 1000)
    }

    useEffect(() => {
      if(!walletConnected){
        web3ModalRef.current = new Web3Modal({
          network: "goerli",
          providerOptions: {},
          disableInjectedProvider: false,
        });

        onPageLoad();
      }
    }, [])

    function renderBody(){
      if (!walletConnected){
        return(
          <button onClick={connectWallet} className={styles.button}>
            Connect Wallet
          </button>
        );
      }

      if(loading){
        return(
          <span className={styles.description}>Loading...</span>
        )
      }

      if (isOwner && !presaleStarted){
        // Button to start the presale
        return (
          <>
            <button className={styles.button} onClick={startPresale}>
              Start Presale
            </button>
          </>
        );
      }

      if (!presaleStarted){
        // Presale has not started
        return(
          <div>
            <span className={styles.description}></span>
            Presale has not Started yet
          </div>
        )
      
      }

      if(presaleStarted && !presaleEnded){
        // TO allow mint presale for whitelisted
        return(
          <div>
            <span className={styles.description}>
            Presale has Started(*_*). For whitelist mint only!!
            </span>
            <button onClick={presaleMint} className={styles.button}>
              Presale Mint
            </button>
            
          </div>
        )
      
      } 

      if(presaleEnded){
        // Public mint
        return(
          <div>
            <span className={styles.description}>
              Presale has ended.
              Try mint in presale, if any remain
            </span>
            <button onClick={publicMint} className={styles.button}>Public Mint</button>
          </div>
        )
      }
    }
  return (
    <div>
      <Head>
        <title>Crypto Mania</title>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoMania NFT</h1>
          <div className={styles.description}>
            CryptoMania Nft is for onboarding web2 people to web3
          </div>
          <div className={styles.description}>
            {numTokensMinted}/20 have been minted already(`_`)
          </div>

          {renderBody()}
        </div>
        <img className={styles.image} src="./cryptomania/0.svg" />        
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by iSmarty
      </footer>
    </div>
  );
}
