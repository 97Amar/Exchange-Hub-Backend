import { ethers } from "ethers";

export class EthService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Initialize provider using the specified Sepolia public RPC URL
    this.provider = new ethers.JsonRpcProvider("https://ethereum-sepolia.rpc.subquery.network/public");
  }

  /**
   * Generates a new random Ethereum wallet.
   * Note: The provider is attached to enable querying on-chain data if needed later.
   */
  public generateWallet() {
    const wallet = ethers.Wallet.createRandom().connect(this.provider);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  }
}

export const ethService = new EthService();
