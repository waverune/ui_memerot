import { ethers } from 'ethers';
import { ERC20_ABI, SWAP_ABI } from './contracts';

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: ethers.Provider
): Promise<string> {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );
  const balance = await tokenContract.balanceOf(walletAddress);
  return balance.toString(); // Return the raw balance as a string
}

export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await contract.approve(spenderAddress, ethers.parseUnits(amount, 18));
}

export async function performSwap(
  swapContractAddress: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  minAmountOut: string,
  userAddress: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = new ethers.Contract(swapContractAddress, SWAP_ABI, signer);
  return await contract.swap(
    tokenInAddress,
    tokenOutAddress,
    ethers.parseUnits(amountIn, 18),
    ethers.parseUnits(minAmountOut, 18),
    userAddress,
    { value: tokenInAddress === ethers.ZeroAddress ? ethers.parseUnits(amountIn, 18) : '0' }
  );
}

export async function getExpectedOutputAmount(
  swapContractAddress: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  provider: ethers.Provider
): Promise<string> {
  const contract = new ethers.Contract(swapContractAddress, SWAP_ABI, provider);
  const amountOut = await contract.getAmountOut(tokenInAddress, tokenOutAddress, ethers.parseUnits(amountIn, 18));
  return ethers.formatUnits(amountOut, 18);
}

// New function for hardcoded swap
export async function performHardcodedSwap(
  swapContractAddress: string,
  wethAddress: string,
  spxAddress: string,
  mogAddress: string,
  spx6900Amount: string,
  mogAmount: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = new ethers.Contract(swapContractAddress, [
    "function swapTokenForMultiTokens(uint256[] memory sellAmounts, uint256[] memory minAmounts, address[] memory path, uint256 deadline) external returns (uint256[] memory amounts)"
  ], signer);

  const path = [wethAddress, spxAddress, mogAddress];
  const sellAmounts = [
    ethers.parseUnits('2', 18),
    ethers.parseUnits('1', 18),
    ethers.parseUnits('1', 18)
  ];
  const minAmounts = [
    ethers.parseUnits("1", 0),  // Minimum amount for SPX6900 (adjust as needed)
    ethers.parseUnits("1", 0)   // Minimum amount for MOG (adjust as needed)
  ];
  const deadline = 1929063379; // 20 minutes from now
  // Log contract call parameters
  console.log("Contract call parameters:");
  console.log("path:", path);
  console.log("sellAmounts:", sellAmounts);
  console.log("minAmounts:", minAmounts);
  console.log("deadline:", deadline);
  return await contract.swapTokenForMultiTokens(
    sellAmounts,
    minAmounts,
    path,
    deadline,
    { gasLimit: 300000, gasPrice: 100000000000000 } // Add a gas limit to ensure the transaction goes through
  );
}

const swapTokenForMultiTokens = async () => {
  try {
    const path = [WETH_ADDRESS, SPX_ADDRESS, MOG_ADDRESS];
    const sellAmounts = [
      ethers.parseEther("2"),  // 2 WETH
      ethers.parseEther("1"),  // 1 SPX (this is ignored in the contract)
      ethers.parseEther("1")   // 1 MOG (this is ignored in the contract)
    ];
    const minAmounts = [
      ethers.parseEther("0.000001"),  // Minimum SPX to receive
      ethers.parseEther("0.000001")   // Minimum MOG to receive
    ];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    console.log("Swap parameters:", { path, sellAmounts, minAmounts, deadline });

    // Ensure approval is set
    const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, signer);
    await wethContract.approve(SWAP_CONTRACT_ADDRESS, ethers.MaxUint256);

    const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_ABI, signer);
    const tx = await swapContract.swapTokenForMultiTokens(
      sellAmounts,
      minAmounts,
      path,
      deadline,
      { gasLimit: 300000 }
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    // Handle successful swap
  } catch (error) {
    console.error("Swap failed:", error);
    // Handle error (e.g., show user-friendly message)
  }
};
