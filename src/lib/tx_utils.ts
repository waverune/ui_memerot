import { ethers } from 'ethers';
import { ERC20_ABI, SWAP_ABI } from './contracts';

export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string,
  provider: ethers.Provider
): Promise<string> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(userAddress);
  const decimals = await contract.decimals();
  return ethers.formatUnits(balance, decimals);
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
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = new ethers.Contract(swapContractAddress, SWAP_ABI, signer);

  const path = [wethAddress, spxAddress, mogAddress];
  const sellAmounts = [
    ethers.parseUnits('2', 18),  // 2 WETH
    ethers.parseUnits('1', 18),  // 1 SPX (this won't be used directly in the swap)
    ethers.parseUnits('1', 18)   // 1 MOG (this won't be used directly in the swap)
  ];
  const minAmounts = [
    ethers.parseUnits('1', 0),  // Minimum 1 wei for SPX
    ethers.parseUnits('1', 0)   // Minimum 1 wei for MOG
  ];

  // Approve WETH spending
  const wethContract = new ethers.Contract(wethAddress, ERC20_ABI, signer);
  const approveTx = await wethContract.approve(swapContractAddress, ethers.MaxUint256);
  await approveTx.wait();

  // Perform the swap
  return await contract.swapTokenForMultiTokens(
    sellAmounts,
    minAmounts,
    path,
    Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  );
}
