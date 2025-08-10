import { type NextRequest, NextResponse } from "next/server"

const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz"
const NFT_CONTRACT_ADDRESS = "0xC1C4d4A5A384DE53BcFadB43D0e8b08966195757"
const BALANCE_OF_SELECTOR = "0x70a08231"

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

    // Check NFT ownership
    const paddedAddress = walletAddress.slice(2).padStart(64, "0")
    const callData = BALANCE_OF_SELECTOR + paddedAddress

    const response = await fetch(MONAD_TESTNET_RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: NFT_CONTRACT_ADDRESS,
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
      return NextResponse.json(
        {
          error: "Failed to verify NFT ownership",
        },
        { status: 500 },
      )
    }

    const balance = Number.parseInt(data.result, 16)
    const hasNFT = balance > 0

    return NextResponse.json({
      hasNFT,
      balance,
      contractAddress: NFT_CONTRACT_ADDRESS,
      network: "Monad Testnet",
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
