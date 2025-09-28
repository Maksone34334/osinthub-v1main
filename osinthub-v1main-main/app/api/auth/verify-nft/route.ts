import { type NextRequest, NextResponse } from "next/server"

const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz"
const NFT_CONTRACT_ADDRESS_MONAD = "0xC1C4d4A5A384DE53BcFadB43D0e8b08966195757"
const BASE_MAINNET_RPC = "https://1rpc.io/base"
const NFT_CONTRACT_ADDRESS_BASE = "0x8cf392D33050F96cF6D0748486490d3dEae52564"
const BALANCE_OF_SELECTOR = "0x70a08231"

async function checkNFTBalance(rpcUrl: string, contractAddress: string, walletAddress: string): Promise<number> {
  try {
    const paddedAddress = walletAddress.slice(2).padStart(64, "0")
    const callData = BALANCE_OF_SELECTOR + paddedAddress

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: contractAddress,
            data: callData,
          },
          "latest",
        ],
        id: 1,
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("RPC Error:", data.error)
      return 0
    }

    return Number.parseInt(data.result, 16)
  } catch (error) {
    console.error("Error checking NFT balance:", error)
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        {
          error: "Wallet address is required",
        },
        { status: 400 },
      )
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          error: "Invalid wallet address format",
        },
        { status: 400 },
      )
    }

    // Check NFT ownership on both networks
    const [monadBalance, baseBalance] = await Promise.all([
      checkNFTBalance(MONAD_TESTNET_RPC, NFT_CONTRACT_ADDRESS_MONAD, walletAddress),
      checkNFTBalance(BASE_MAINNET_RPC, NFT_CONTRACT_ADDRESS_BASE, walletAddress)
    ])

    const totalBalance = monadBalance + baseBalance
    const hasNFT = totalBalance > 0

    const networks = []
    if (monadBalance > 0) {
      networks.push({
        name: "Monad Testnet",
        balance: monadBalance,
        contractAddress: NFT_CONTRACT_ADDRESS_MONAD
      })
    }
    if (baseBalance > 0) {
      networks.push({
        name: "Base Mainnet",
        balance: baseBalance,
        contractAddress: NFT_CONTRACT_ADDRESS_BASE
      })
    }

    return NextResponse.json({
      hasNFT,
      balance: totalBalance,
      monadBalance,
      baseBalance,
      networks,
      details: {
        monad: {
          hasNFT: monadBalance > 0,
          balance: monadBalance,
          contractAddress: NFT_CONTRACT_ADDRESS_MONAD,
          network: "Monad Testnet"
        },
        base: {
          hasNFT: baseBalance > 0,
          balance: baseBalance,
          contractAddress: NFT_CONTRACT_ADDRESS_BASE,
          network: "Base Mainnet"
        }
      }
    })
  } catch (error: any) {
    console.error("NFT verification error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
