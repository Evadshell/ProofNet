# ProofNet

ProofNet is a decentralized proof of location system built on Solana blockchain. It combines modern web technologies with blockchain to provide secure and verifiable location proofs through UDP pins.

## Project Structure

```
ProofNet/
├── frontend/         # Next.js web application
├── server/          # Node.js backend server
├── buffalu-cli/     # CLI tool for UDP pin management
└── buffalusc/       # Solana smart contracts
```

## Components

### Frontend (Next.js Web App)
- Built with Next.js 15.2.3 and React 19
- Features:
  - Modern UI with Radix UI components
  - Solana wallet integration (@solana/wallet-adapter)
  - Real-time updates via Socket.IO
  - Responsive design with TailwindCSS
  - Type safety with TypeScript
  - Beautiful animations with Framer Motion
  - Dark/light theme support
  - Interactive components and carousels

### Backend Server
- Node.js based server with:
  - Express.js for REST API
  - Socket.IO for real-time communication
  - Redis for caching and pub/sub
  - WebSocket support
  - Geolocation capabilities (geolib)
  - STUN server integration
  - Environment configuration (dotenv)
  - Crypto operations for security

### Buffalu CLI
- Command-line interface for:
  - UDP pin management
  - Location proof generation
  - Network communication
- Built with Node.js

### Smart Contracts (buffalusc)
- Solana blockchain integration
- Built with Anchor framework
- Features:
  - Location proof verification
  - Token management
  - Secure state management
- Includes test suite with Mocha

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Redis server
- Rust and Solana CLI tools (for smart contract development)
- Solana wallet with testnet/mainnet SOL

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:3000`

### Backend Setup
```bash
cd server
cp .env.example .env  # Configure environment variables
npm install
node index.js
```

### Smart Contract Setup
```bash
cd buffalusc
npm install
anchor build
anchor deploy
```

### CLI Tool Setup
```bash
cd buffalu-cli
npm install
node index.js
```

## Key Features
- Decentralized proof of location
- Real-time location verification
- Secure UDP pin system
- Solana blockchain integration
- Responsive and modern UI
- Real-time updates and notifications
- Wallet integration
- Dark/light theme

## Technologies Used

### Frontend
- Next.js & React
- TypeScript
- TailwindCSS
- Radix UI Components
- Three.js & React Three Fiber
- Framer Motion
- Socket.IO Client
- Solana Web3.js
- Tanstack Query
- Various React utilities

### Backend
- Node.js
- Express
- Socket.IO
- Redis
- WebSocket (ws)
- STUN server
- Geolib
- Various utility libraries

### Blockchain & Smart Contracts
- Solana
- Midnight
- Anchor Framework
- Metaplex
- SPL Token

### Development Tools
- TypeScript
- ESLint
- Prettier
- Mocha/Chai for testing

## License
ISC



