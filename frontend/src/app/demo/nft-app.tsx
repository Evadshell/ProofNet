/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
// app/page.tsx
import { useState, useEffect, useMemo } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { generateSigner, percentAmount, publicKey as umiPublicKey, some, signerIdentity } from "@metaplex-foundation/umi"
import {
  mplTokenMetadata,
  createNft,
  fetchAllDigitalAssetWithTokenByOwner,
  transferV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata"
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Loader2, RefreshCw, Plus, Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Define types for wallet data
interface WalletData {
  _id: string
  walletAddress: string
  isVerified: boolean
}

// Define types for NFT data
interface NFTMetadata {
  name: string
  description?: string
  image?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

interface NFT {
  publicKey: string
  mint: string
  metadata: NFTMetadata
}

function NFTApp() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey, connected } = wallet

  // State variables
  const [nfts, setNfts] = useState<NFT[]>([])
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null)
  const [isAirdropModalOpen, setIsAirdropModalOpen] = useState(false)
  const [isMintModalOpen, setIsMintModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Mint form state
  const [nftName, setNftName] = useState("")
  const [nftSymbol, setNftSymbol] = useState("")
  const [nftUri, setNftUri] = useState("")

  // Create Umi instance with proper signer configuration
  const umi = useMemo(() => {
    if (!connected || !publicKey) return null

    const umiInstance = createUmi(connection)
      .use(mplTokenMetadata())
      .use(signerIdentity(createSignerFromWalletAdapter(wallet)))

    return umiInstance
  }, [connection, connected, publicKey, wallet])

  // Fetch wallets from API
  useEffect(() => {
    async function fetchWallets() {
      try {
        const response = await fetch("/api/wallet")
        if (!response.ok) throw new Error("Failed to fetch wallets")
        const data = await response.json()
        setWallets(data)
      } catch (error) {
        console.error("Error fetching wallets:", error)
        toast({
          title: "Error",
          description: "Failed to fetch wallet data",
          variant: "destructive",
        })
      }
    }

    fetchWallets()
  }, [])

  // Fetch NFTs when wallet connects
  useEffect(() => {
    if (umi && publicKey) {
      fetchNFTs()
    } else {
      setNfts([])
    }
  }, [umi, publicKey])

  // Fetch NFTs owned by the connected wallet
  const fetchNFTs = async () => {
    if (!umi || !publicKey) return

    try {
      setRefreshing(true)
      const assets = await fetchAllDigitalAssetWithTokenByOwner(umi, umiPublicKey(publicKey.toBase58()))

      const nftData = await Promise.all(
        assets.map(async (asset) => {
          let metadata: NFTMetadata = {
            name: asset.metadata.name,
          }

          if (asset.metadata.uri) {
            try {
              const metadataResponse = await fetch(asset.metadata.uri)
              if (metadataResponse.ok) {
                metadata = await metadataResponse.json()
              }
            } catch (error) {
              console.error("Error fetching NFT metadata:", error)
            }
          }

          return {
            publicKey: asset.publicKey.toString(),
            mint: asset.mint.publicKey.toString(),
            metadata,
          }
        }),
      )

      setNfts(nftData)
    } catch (error) {
      console.error("Error fetching NFTs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch your NFTs",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Mint a new NFT
  const mintNFT = async () => {
    if (!umi) {
      toast({
        title: "Error",
        description: "Wallet not connected",
        variant: "destructive",
      })
      return
    }

    if (!nftName || !nftSymbol || !nftUri) {
      toast({
        title: "Error",
        description: "Please fill all NFT details",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const nftSigner = generateSigner(umi)

      const builder = createNft(umi, {
        mint: nftSigner,
        name: nftName,
        symbol: nftSymbol,
        uri: nftUri,
        sellerFeeBasisPoints: percentAmount(5),
        collection: undefined,
        uses: undefined,
        isMutable: true,
      })

      const result = await builder.sendAndConfirm(umi)

      toast({
        title: "Success",
        description: "NFT minted successfully!",
        variant: "default",
      })

      await fetchNFTs()
      setIsMintModalOpen(false)
      setNftName("")
      setNftSymbol("")
      setNftUri("")
    } catch (error) {
      console.error("Error minting NFT:", error)
      toast({
        title: "Error",
        description: "Failed to mint NFT",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Transfer NFT to another wallet
// Transfer NFT to another wallet
// Transfer NFT to another wallet
const transferNFT = async () => {
    if (!umi || !selectedWallet || !selectedNFT) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      })
      return
    }
  
    if (!selectedWallet.isVerified) {
      toast({
        title: "Warning",
        description: "User must be verified to receive NFT",
        variant: "default",
      })
      return
    }
  
    try {
      setLoading(true)
  
      const nft = nfts.find((n) => n.publicKey === selectedNFT)
      if (!nft) throw new Error("NFT not found")
  
      const mint = umiPublicKey(nft.mint)
      const destinationOwner = umiPublicKey(selectedWallet.walletAddress)
      const currentOwner = umi.identity.publicKey
  
      await transferV1(umi, {
        mint,
        authority: umi.identity,
        tokenOwner: currentOwner,
        destinationOwner,
        tokenStandard: TokenStandard.NonFungible, // ✅ Use enum
      }).sendAndConfirm(umi)
  
      toast({
        title: "Success",
        description: "NFT transferred successfully!",
        variant: "default",
      })
  
      await fetchNFTs()
      setIsAirdropModalOpen(false)
      setSelectedNFT(null)
      setSelectedWallet(null)
    } catch (error) {
      console.error("Error transferring NFT:", error)
      toast({
        title: "Error",
        description: `Failed to transfer NFT: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const openAirdropModal = (wallet: WalletData) => {
    setSelectedWallet(wallet)
    setIsAirdropModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center text-purple-800 mb-2">Solana NFT Dashboard</h1>
          <p className="text-center text-gray-600 mb-6">Mint, manage, and transfer your NFTs on Solana</p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex-1 flex justify-center">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
            </div>

            {publicKey && (
              <div className="flex-1 flex justify-center">
                <Badge variant="outline" className="px-4 py-2 text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-mono">
                    {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-6)}
                  </span>
                </Badge>
              </div>
            )}
          </div>
        </header>

        {publicKey && umi ? (
          <>
            <section className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold text-gray-800">Your NFT Collection</h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchNFTs}
                    disabled={refreshing}
                    className="rounded-full"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <Button onClick={() => setIsMintModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" /> Mint New NFT
                </Button>
              </div>

              {refreshing ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : nfts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {nfts.map((nft) => (
                    <Card key={nft.publicKey} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        <img
                          src={nft.metadata.image || `/placeholder.svg?height=300&width=300`}
                          alt={nft.metadata.name || "NFT"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg truncate">{nft.metadata.name || "Unnamed NFT"}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {nft.metadata.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{nft.metadata.description}</p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                          onClick={() => {
                            setSelectedNFT(nft.publicKey)
                            setIsAirdropModalOpen(true)
                          }}
                        >
                          <Send className="h-3 w-3 mr-2" /> Transfer
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-4">You don`t have any NFTs yet</p>
                  <Button onClick={() => setIsMintModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" /> Mint Your First NFT
                  </Button>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Wallets</h2>

              {wallets.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wallet Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {wallets.map((wallet) => (
                          <tr key={wallet._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                              {wallet.walletAddress.slice(0, 10)}...{wallet.walletAddress.slice(-10)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {wallet.isVerified ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-200">
                                  Unverified
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={() => openAirdropModal(wallet)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Send className="h-3 w-3 mr-2" /> Send NFT
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No wallet data available</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your Solana wallet to view your NFTs and interact with the app</p>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 mx-auto" />
          </div>
        )}
      </div>

      <Dialog open={isMintModalOpen} onOpenChange={setIsMintModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mint New NFT</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="nft-name" className="text-sm font-medium">
                NFT Name
              </label>
              <Input
                id="nft-name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="My Awesome NFT"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="nft-symbol" className="text-sm font-medium">
                Symbol
              </label>
              <Input
                id="nft-symbol"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value)}
                placeholder="AWSM"
                maxLength={10}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="nft-uri" className="text-sm font-medium">
                Metadata URI
              </label>
              <Input
                id="nft-uri"
                value={nftUri}
                onChange={(e) => setNftUri(e.target.value)}
                placeholder="https://arweave.net/your-metadata-uri"
              />
              <p className="text-xs text-gray-500">
                URI to a JSON file with your NFT metadata (image, attributes, etc.)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMintModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={mintNFT}
              disabled={loading || !nftName || !nftSymbol || !nftUri}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Mint NFT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAirdropModalOpen} onOpenChange={setIsAirdropModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer NFT</DialogTitle>
          </DialogHeader>

          {selectedWallet && (
            <div className="py-4">
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Recipient</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
                    {selectedWallet.walletAddress.slice(0, 10)}...{selectedWallet.walletAddress.slice(-10)}
                  </Badge>
                  {selectedWallet.isVerified ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      Unverified
                    </Badge>
                  )}
                </div>

                {!selectedWallet.isVerified && (
                  <p className="text-amber-600 text-xs mt-2">
                    Warning: This wallet is not verified. Transfers to unverified wallets are not recommended.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="nft-select" className="text-sm font-medium">
                  Select NFT to Transfer
                </label>
                <Select value={selectedNFT || ""} onValueChange={setSelectedNFT}>
                  <SelectTrigger id="nft-select" className="mt-1">
                    <SelectValue placeholder="Select an NFT" />
                  </SelectTrigger>
                  <SelectContent>
                    {nfts.map((nft) => (
                      <SelectItem key={nft.publicKey} value={nft.publicKey}>
                        {nft.metadata.name || "Unnamed NFT"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAirdropModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={transferNFT}
              disabled={loading || !selectedNFT || !selectedWallet}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Transfer NFT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default function Page() {
  return <NFTApp />
}