# ProofNet

ProofNet is a modern web application built with a microservices architecture, consisting of a Next.js frontend, Node.js backend server, and a CLI tool i.e an npm package to detect proof of location sending UDP pins.

## Project Structure

```
ProofNet/
├── frontend/        
├── server/          
└── buffalu-cli/     
```

## Components

### Frontend
- Built with Next.js 15.2.3
- Features modern UI components using Radix UI
- Includes Solana wallet integration
- Uses TailwindCSS for styling
- Implements real-time features with Socket.IO
- TypeScript support

Key Features:
- Modern, responsive UI
- Wallet integration
- Real-time communication
- Dark/light theme support
- Interactive components

### Backend Server
- Node.js based server
- Features:
  - Express.js web framework
  - Socket.IO for real-time communication
  - Redis integration
  - WebSocket support
  - Geolocation capabilities
  - Environment configuration support

### Buffalu CLI
- Command-line interface tool for project management
- Built with Node.js

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- Redis (for backend)

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
cp .env.example .env  # Configure your environment variables
npm install
node index.js
```

### CLI Tool Setup
```bash
cd buffalu-cli
npm install
node index.js
```

## Technologies Used

### Frontend
- Next.js
- React
- TailwindCSS
- Socket.IO Client
- TypeScript
- Framer Motion
- Aceternity UI
- Various React utilities and hooks

### Backend
- Node.js
- Express
- Socket.IO
- Redis
- WebSocket
- Various utility libraries

### Smart Contracts
- Solana
- Midnight



