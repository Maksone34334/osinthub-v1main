"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Search,
  Shield,
  Globe,
  Zap,
  Lock,
  User,
  LogOut,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from "next/dynamic"

/* -------------------------------------------------------------------------- */
/*  WalletConnect uses `window.ethereum`; loading it only in the browser
  avoids multiple evaluations on the server that can trigger
  “Cannot redefine property: ethereum”.                                    */
/* -------------------------------------------------------------------------- */

const WalletConnect = dynamic(() => import("@/components/wallet-connect"), {
  ssr: false,
})
import Image from "next/image"

interface ApiResponse {
  List: Record<
    string,
    {
      InfoLeak: string
      Data: Record<string, any>[]
    }
  >
}

interface OsintUser {
  id: string
  email: string
  login: string
  status: "active" | "pending" | "blocked"
  role: string
  createdAt: string
}

export default function OSINTHub() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<OsintUser | null>(null)
  const [showLogin, setShowLogin] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authMethod, setAuthMethod] = useState<"traditional" | "nft">("traditional")

  // Login/Register form states
  const [loginForm, setLoginForm] = useState({ login: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ email: "" })

  // Search states
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState("")

  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState<"home" | "about">("home")
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Проверяем сохраненную сессию
    const savedUser = localStorage.getItem("osint_user")
    const savedToken = localStorage.getItem("osint_token")

    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        setIsLoggedIn(true)
        setShowLogin(false)
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("osint_user")
        localStorage.removeItem("osint_token")
      }
    }
  }, [])

  const handleLogin = async () => {
    if (!loginForm.login || !loginForm.password) {
      setError("Please enter both login and password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      localStorage.setItem("osint_user", JSON.stringify(data.user))
      localStorage.setItem("osint_token", data.token)

      setCurrentUser(data.user)
      setIsLoggedIn(true)
      setShowLogin(false)

      toast({
        title: "Access Granted",
        description: `Welcome to OSINT HUB, ${data.user.login}`,
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerForm.email) {
      setError("Please enter your email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      toast({
        title: "Request Submitted",
        description: "Your access request has been submitted. Administrator will contact you directly.",
      })

      setShowRegister(false)
      setShowLogin(true)
      setRegisterForm({ email: "" })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("osint_user")
    localStorage.removeItem("osint_token")
    setCurrentUser(null)
    setIsLoggedIn(false)
    setShowLogin(true)
    setApiResponse(null)
    setQuery("")
    setShowTerminal(false)

    toast({
      title: "Session Terminated",
      description: "You have been logged out of OSINT HUB",
    })
  }

  const makeSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a target for analysis")
      return
    }

    if (!isLoggedIn || !currentUser) {
      setError("Authentication required")
      return
    }

    setError("")
    setIsLoading(true)
    setShowTerminal(true)

    try {
      const token = localStorage.getItem("osint_token")

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request: query,
          limit: 1000,
          lang: "en",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setApiResponse(data)

      toast({
        title: "Analysis Complete",
        description: `Intelligence gathered from ${Object.keys(data.List || {}).length} sources`,
      })
    } catch (error: any) {
      const errorMsg = error.message
      setError(errorMsg)

      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNFTClick = () => {
    window.open("https://osintmon.testnet.nfts2.me/", "_blank", "noopener,noreferrer")
  }

  const handlePageTransition = (page: "home" | "about") => {
    if (page === currentPage) return

    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(page)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  const AboutUsPage = () => (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-30"></div>
      <div className="absolute inset-0 matrix-rain"></div>
      <div className="absolute inset-0 scan-lines"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 text-reveal">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center pulse-red">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            OSINT<span className="text-primary">HUB</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <button
            onClick={() => handlePageTransition("home")}
            className="hover:text-primary transition-colors hover-glow"
          >
            Home
          </button>
          <button className="text-primary">About</button>
          <button className="hover:text-primary transition-colors hover-glow">Contact</button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold glitch-text mb-6" data-text="ABOUT US">
              ABOUT US
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Leading the future of open-source intelligence gathering and analysis
            </p>
          </div>

          {/* Mission Section */}
          <Card className="bg-card/90 border-primary/30 backdrop-blur-sm cyber-glow mb-12">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <Globe className="w-6 h-6" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-primary mb-3">About Us</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  We are a young team of crypto enthusiasts who have been studying the crypto space for four years now
                  and dream of finding their home.
                </p>
              </div>

              <div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  From the first minutes of meeting MONAD and its community, we felt a warm vibe and the feeling that we
                  were at home. While studying the monad ecosystem and participating in its testnet, we decided to do
                  our part and do something useful for the community and leave our mark on the ecosystem.
                </p>
              </div>

              <div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Taking into account the fact that our work in real life is closely connected with OSINT exploration,
                  as well as the growing popularity of such a phenomenon as "vibe coding", it was decided to create an
                  OSINT tool application that we use every day - this is{" "}
                  <span className="text-primary font-semibold">ossinthub.link</span>.
                </p>
              </div>

              <div className="border-t border-primary/20 pt-6">
                <h3 className="text-xl font-bold text-primary mb-4">What is ossinthub.link?</h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  What do you think is known about you? What do you think scammers know about you? If you find out in
                  advance what data about you has leaked onto the Internet, you can prevent your accounts from being
                  hacked before it is too late.
                </p>

                <div className="bg-background/30 p-4 rounded border border-primary/20">
                  <h4 className="text-lg font-semibold text-primary mb-3">Through our service you can:</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Find out which of your passwords are no longer secure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Find out which site left your data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Determine who exactly called you at one in the morning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Find the owner of a car parked on the lawn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Return lost documents to the owner</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Identify a telephone hooligan or spammer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Find a namesake or relevant person</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Find out the number of owners of the car you want to buy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="font-semibold">And much more...</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotional Section */}
          <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-primary/50 backdrop-blur-sm cyber-glow mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-primary flex items-center gap-2 justify-center">
                <Zap className="w-6 h-6 animate-pulse" />
                Special Offer for Monad Community
                <Zap className="w-6 h-6 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="bg-background/40 p-6 rounded-lg border border-primary/30 backdrop-blur-sm">
                <p className="text-gray-200 text-lg leading-relaxed text-center">
                  Some similar services ask for some inadequate amounts in US dollars, but we decided to go differently,
                  for our community and exclusively for{" "}
                  <span className="text-primary font-bold">monad testnet participants</span> we minted a collection of{" "}
                  <span className="text-primary font-bold">100 units</span>, which will give its owner{" "}
                  <span className="text-green-400 font-bold">full access to our service, forever</span> for just{" "}
                  <span className="text-yellow-400 font-bold text-xl">1 test token!</span>
                </p>

                <div className="mt-6 text-center">
                  <p className="text-gray-300 mb-4">
                    All you need to do is follow the link{" "}
                    <a
                      href="https://osintmon.testnet.nfts2.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline font-semibold"
                    >
                      https://osintmon.testnet.nfts2.me/
                    </a>{" "}
                    or just click on the mini picture on our main page of our site, pay{" "}
                    <span className="text-yellow-400 font-bold">1 $MON token</span> and dive into the osint theme with
                    us :)
                  </p>

                  <Button
                    onClick={handleNFTClick}
                    className="bg-gradient-to-r from-primary to-red-600 hover:from-primary/90 hover:to-red-600/90 text-white font-bold py-3 px-8 rounded-lg cyber-glow transform hover:scale-105 transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Mint Your NFT Now - Only 1 $MON!
                  </Button>
                </div>

                <div className="mt-4 flex justify-center items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Limited to 100 NFTs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span>Monad Testnet Only</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Section */}
          <Card className="bg-card/90 border-primary/30 backdrop-blur-sm cyber-glow">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <User className="w-6 h-6" />
                Our Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="text-center max-w-md">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-primary/50 flex items-center justify-center cyber-glow overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tolik-katolik.jpg-Z6gXKKZYtqPcSeDrOMZDVXqEFhUVEt.jpeg"
                      alt="Anton Goldini"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Anton Goldini</h3>
                  <Badge className="bg-primary/20 text-primary mb-3">Founder & Lead OSINT Specialist</Badge>
                  <p className="text-gray-400 text-sm">
                    Crypto enthusiast and OSINT expert with 4+ years of experience in the blockchain space. Passionate
                    about building innovative intelligence tools for the Monad ecosystem and empowering the community
                    with cutting-edge OSINT capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-gray-500">
        © 2025 OSSINT HUB • SECURE INTELLIGENCE PLATFORM
      </footer>
    </div>
  )

  // Page transition wrapper
  if (currentPage === "about") {
    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <AboutUsPage />
      </div>
    )
  }

  // Login/Register UI
  if (!isLoggedIn) {
    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 cyber-grid opacity-30"></div>
          <div className="absolute inset-0 matrix-rain"></div>
          <div className="absolute inset-0 scan-lines"></div>
          <div className="absolute inset-0 scan-overlay opacity-50"></div>

          {/* Floating Particles */}
          <div className="floating-particles">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 20}s`,
                  animationDuration: `${15 + Math.random() * 15}s`,
                }}
              />
            ))}
          </div>

          {/* Header */}
          <header className="relative z-10 flex items-center justify-between p-6 text-reveal">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center pulse-red">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                OSINT<span className="text-primary">HUB</span>
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <button
                onClick={() => handlePageTransition("about")}
                className="hover:text-primary transition-colors hover-glow"
              >
                About
              </button>
              <button className="hover:text-primary transition-colors hover-glow">Contact</button>
            </nav>
          </header>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
            {/* Status Indicator */}
            <div className="status-online bg-green-600/20 border-green-500 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
              SYSTEM ONLINE
            </div>

            {/* Main Title */}
            <div className="text-center mb-12 text-reveal relative">
              <div className="flex items-center justify-center gap-8 mb-4">
                <h1 className="text-6xl md:text-8xl font-bold glitch-text" data-text="OSINT">
                  OSINT
                </h1>
                {/* NFT Image Button - Positioned next to OSINT */}
                <button
                  onClick={handleNFTClick}
                  className="relative group hover:scale-105 transition-transform duration-300 cyber-glow"
                  title="Mint OSINT HUB NFT"
                >
                  <Image
                    src="/images/osint-nft.png"
                    alt="OSINT HUB NFT"
                    width={80}
                    height={112}
                    className="rounded border border-primary/30 group-hover:border-primary/60 transition-colors"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <ExternalLink className="w-3 h-3 text-white" />
                  </div>
                </button>
                {/* Animated Text Overlay */}
                <div className="relative mt-4">
                  <div className="text-center">
                    <div className="inline-block relative overflow-hidden">
                      <div
                        className="animate-pulse text-purple-300 border-purple-500 shadow-lg my-[11px] bg-black/80 font-bold leading-7 text-3xl text-center rounded-lg opacity-100 border-2 border-solid px-4 py-2 tracking-wide backdrop-blur-sm"
                        style={{
                          fontFamily: "serif",
                          textShadow: "0 0 10px rgba(168, 85, 247, 0.5), 2px 2px 4px rgba(0,0,0,0.8)",
                          letterSpacing: "0.2em",
                          lineHeight: "1.4",
                        }}
                      >
                        <span
                          className="block text-shadow-lg mb-1"
                          style={{
                            fontVariant: "small-caps",
                            textTransform: "uppercase",
                            fontSize: "1em",
                            fontWeight: "700",
                          }}
                        >
                          ONLY
                        </span>
                        <span
                          className="block text-shadow-lg"
                          style={{
                            fontVariant: "small-caps",
                            textTransform: "uppercase",
                            fontSize: "0.9em",
                            fontWeight: "700",
                          }}
                        >
                          ON MONAD
                        </span>
                      </div>
                      <div
                        className="animate-pulse text-purple-200 border-purple-400 bg-black/80 font-bold rounded-lg opacity-100 border-2 border-solid tracking-widest my-2 text-xl text-center leading-6 px-3 py-1 backdrop-blur-sm"
                        style={{
                          fontFamily: "serif",
                          textShadow: "0 0 8px rgba(196, 181, 253, 0.4), 2px 2px 4px rgba(0,0,0,0.8)",
                          letterSpacing: "0.25em",
                        }}
                      >
                        <span
                          style={{
                            fontVariant: "small-caps",
                            textTransform: "uppercase",
                            fontSize: "1em",
                            fontWeight: "600",
                          }}
                        >
                          TESTNET
                        </span>
                      </div>
                      {/* Animated underline with Monad colors */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse shadow-lg"></div>
                      {/* Enhanced floating particles with Monad theme */}
                      <div className="absolute -top-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-75 shadow-lg shadow-purple-400/50"></div>
                      <div
                        className="absolute -top-1 -right-3 w-2 h-2 bg-purple-500 rounded-full animate-ping opacity-60 shadow-lg shadow-purple-500/50"
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                      <div
                        className="absolute -bottom-2 left-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping opacity-50 shadow-lg shadow-purple-300/50"
                        style={{ animationDelay: "1s" }}
                      ></div>
                      {/* Gothic decorative elements with Monad colors */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60 rounded-full"></div>
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60 rounded-full"></div>
                      {/* Additional Monad-themed decorative elements */}
                      <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-purple-500 to-transparent opacity-40 rounded-full"></div>
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-purple-500 to-transparent opacity-40 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-primary mb-6 typing-effect">INTELLIGENCE</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Professional open-source intelligence gathering and analysis platform
              </p>
            </div>

            {/* Auth Method Selection */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={authMethod === "traditional" ? "default" : "outline"}
                onClick={() => setAuthMethod("traditional")}
                className="flex-1"
              >
                Traditional Login
              </Button>
              <Button
                variant={authMethod === "nft" ? "default" : "outline"}
                onClick={() => setAuthMethod("nft")}
                className="flex-1"
              >
                NFT Access
              </Button>
            </div>

            {/* Auth Forms */}
            {authMethod === "nft" ? (
              <WalletConnect
                onAuthSuccess={(user, token) => {
                  localStorage.setItem("osint_user", JSON.stringify(user))
                  localStorage.setItem("osint_token", token)
                  setCurrentUser(user)
                  setIsLoggedIn(true)
                  setShowLogin(false)
                }}
              />
            ) : (
              <Card className="w-full max-w-md bg-card/90 border-primary/30 backdrop-blur-sm cyber-glow mb-8 card-entrance">
                <CardHeader>
                  <CardTitle className="text-center text-primary">
                    {showRegister ? "REQUEST ACCESS" : "SECURE LOGIN"}
                  </CardTitle>
                  <CardDescription className="text-center text-muted-foreground">
                    {showRegister ? "Submit your request for platform access" : "Enter your authorized credentials"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {showRegister ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@domain.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ email: e.target.value })}
                          className="bg-input border-primary/30 text-foreground"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground bg-background/30 p-3 rounded border border-primary/20">
                        <p className="mb-2">
                          📋 <strong>Access Request Process:</strong>
                        </p>
                        <ul className="space-y-1 text-xs">
                          <li>• Your request will be reviewed manually</li>
                          <li>• Only authorized personnel receive access</li>
                          <li>• Administrator will contact you directly</li>
                          <li>• No automated approvals</li>
                        </ul>
                      </div>
                      <Button
                        onClick={handleRegister}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white cyber-glow"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Submit Request
                          </>
                        )}
                      </Button>
                      <div className="text-center">
                        <button
                          onClick={() => {
                            setShowRegister(false)
                            setShowLogin(true)
                            setError("")
                          }}
                          className="text-primary hover:text-primary/80 text-sm"
                        >
                          Already have access? Login
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login" className="text-foreground">
                          Username
                        </Label>
                        <Input
                          id="login"
                          placeholder="Enter username"
                          value={loginForm.login}
                          onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                          className="bg-input border-primary/30 text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-foreground">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className="bg-input border-primary/30 text-foreground pr-10"
                            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white cyber-glow"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Login
                          </>
                        )}
                      </Button>
                      <div className="text-center">
                        <button
                          onClick={() => {
                            setShowLogin(false)
                            setShowRegister(true)
                            setError("")
                          }}
                          className="text-primary hover:text-primary/80 text-sm"
                        >
                          Need access? Submit request
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
              {[
                {
                  icon: Globe,
                  title: "Global Intelligence",
                  desc: "Access comprehensive data sources worldwide",
                },
                {
                  icon: Zap,
                  title: "Real-time Analysis",
                  desc: "Instant processing and correlation of information",
                },
                {
                  icon: Lock,
                  title: "Secure Platform",
                  desc: "Enterprise-grade security and privacy protection",
                },
              ].map((feature, index) => (
                <Card
                  key={feature.title}
                  className="bg-card/80 border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all hover-glow card-entrance"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <feature.icon className="w-12 h-12 text-primary mx-auto mb-4 pulse-red" />
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="relative z-10 text-center py-6 text-xs text-gray-500 text-reveal">
            © 2025 OSINT HUB • SECURE INTELLIGENCE PLATFORM
          </footer>
        </div>
      </div>
    )
  }

  // Main Application UI (after login)
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            OSINT<span className="text-primary">HUB</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="status-online bg-green-600/20 border-green-500 text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
            SYSTEM ONLINE
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary">
              {currentUser?.login}
            </Badge>
            <Badge className="bg-green-600 text-white">{currentUser?.role}</Badge>
          </div>
          <button
            onClick={handleNFTClick}
            className="relative group hover:scale-105 transition-transform duration-300 cyber-glow"
            title="Mint OSINT HUB NFT"
          >
            <Image
              src="/images/osint-nft.png"
              alt="OSINT HUB NFT"
              width={32}
              height={45}
              className="rounded border border-primary/30 group-hover:border-primary/60 transition-colors"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <ExternalLink className="w-1.5 h-1.5 text-white" />
            </div>
          </button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* OSINT Terminal */}
          <Card className="bg-card/90 border-primary/30 backdrop-blur-sm cyber-glow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                <CardTitle className="text-lg">OSINT TERMINAL</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter target for analysis: email, domain, IP, username..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-input border-primary/30 text-foreground placeholder-muted-foreground"
                    onKeyPress={(e) => e.key === "Enter" && makeSearch()}
                  />
                </div>
                <Button
                  onClick={makeSearch}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-white cyber-glow px-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <span className="text-primary">Examples:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["example@email.com", "google.com", "8.8.8.8", "@username"].map((example) => (
                    <Badge
                      key={example}
                      variant="outline"
                      className="border-primary/30 text-primary cursor-pointer hover:bg-primary/10"
                      onClick={() => setQuery(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {apiResponse && (
            <Card className="bg-card/90 border-primary/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-primary">Intelligence Report</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Data gathered from {Object.keys(apiResponse.List).length} intelligence source(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(apiResponse.List).map(([dbName, dbData]) => (
                    <Card key={dbName} className="bg-secondary/50 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg text-primary">{dbName}</CardTitle>
                        <CardDescription className="text-muted-foreground">{dbData.InfoLeak}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dbData.Data && dbData.Data.length > 0 ? (
                          <div className="space-y-2">
                            {dbData.Data.slice(0, 5).map((item, index) => (
                              <div key={index} className="p-3 bg-background/50 rounded border border-primary/10">
                                {Object.entries(item).map(([key, value]) => (
                                  <div key={key} className="flex justify-between py-1">
                                    <span className="font-medium text-primary">{key}:</span>
                                    <span className="text-foreground break-all">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                            {dbData.Data.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                ... and {dbData.Data.length - 5} more records
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No intelligence found in this source</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
