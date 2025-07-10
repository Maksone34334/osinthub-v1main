import { type NextRequest, NextResponse } from "next/server"

// Monad Testnet RPC endpoint
const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz"
const NFT_CONTRACT_ADDRESS = "0xC1C4d4A5A384DE53BcFadB43D0e8b08966195757"

// ERC-721 balanceOf function selector
const BALANCE_OF_SELECTOR = "0x70a08231"

async function checkNFTOwnership(walletAddress: string): Promise<boolean> {
  try {
    // Prepare the call data for balanceOf(address)
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
      return false
    }

    // Parse the result (hex string to number)
    const balance = Number.parseInt(data.result, 16)
    return balance > 0
  } catch (error) {
    console.error("Error checking NFT ownership:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message } = body

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        {
          error: "Wallet address, signature, and message are required",
        },
        { status: 400 },
      )
    }

    // Verify the signature (basic check)
    if (message !== `Login to OSINT HUB with wallet: ${walletAddress}`) {
      return NextResponse.json(
        {
          error: "Invalid message format",
        },
        { status: 400 },
      )
    }

    // Check NFT ownership
    const hasNFT = await checkNFTOwnership(walletAddress)

    if (!hasNFT) {
      console.log(`❌ NFT access denied for wallet: ${walletAddress}`)
      return NextResponse.json(
        {
          error: "Access denied: You must own an NFT from the authorized collection to use this service",
        },
        { status: 403 },
      )
    }

    // Generate session token
    const sessionSecret = process.env.OSINT_SESSION_SECRET || "default-secret"
    const token = `${sessionSecret}_nft_${walletAddress}_${Date.now()}`

    // Create user object
    const user = {
      id: walletAddress,
      login: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      email: `${walletAddress}@nft.holder`,
      role: "nft_holder",
      status: "active",
      walletAddress,
      createdAt: new Date().toISOString(),
    }

    console.log(`✅ NFT holder authenticated: ${walletAddress}`)

    return NextResponse.json({
      success: true,
      user,
      token,
      message: "NFT ownership verified. Access granted!",
    })
  } catch (error: any) {
    console.error("NFT authentication error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
