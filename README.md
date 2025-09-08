# Last-Lite Browser MMO

A Last Chaos-flavored browser MMO built with TypeScript, Colyseus, and text-based UI, following Test-Driven Development principles.

## 🎯 Project Overview

Last-Lite is a lightweight browser MMO featuring:
- **Hub-and-instance structure** with social zones and instanced dungeons
- **Server-authoritative** gameplay with real-time multiplayer
- **Chromebook-optimized** rendering for low-spec devices
- **TDD-first development** with comprehensive test coverage

## 🏗️ Architecture

- **Client**: Vite + TypeScript + Text UI + colyseus.js
- **Server**: Node.js + TypeScript + Colyseus + Express
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Persistence**: In-memory (v0.1) → Postgres + Prisma (M5)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd last-lite
npm run install:all
```

### Development
```bash
# Start development servers (client + server)
npm run dev

# Or run separately:
npm run dev:client  # Vite dev server on :5173
npm run dev:server  # Colyseus server on :2567
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run e2e
```

### Building & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎮 Game Features (Planned)

### M0 - Vertical Slice ✅
- [x] Basic client-server connection
- [x] Player movement with WASD/Arrow keys
- [x] Quality profile detection (Chromebook optimization)
- [x] HUD with player count display
- [x] Server-authoritative movement system

### M1 - Zones & Doors (Next)
- [ ] Hub ↔ Field zone transitions
- [ ] Door proximity validation
- [ ] Spawn point management

### M2 - Combat & AI
- [ ] 3 classes: Warrior, Ranger, Mage
- [ ] 4 abilities per class with GCD/cooldowns
- [ ] Basic AI with leash mechanics
- [ ] Mob spawning and combat

### M3 - Loot & Economy
- [ ] Item drops with TTL
- [ ] Personal loot system
- [ ] Vendor buy/sell mechanics
- [ ] Gold economy

### M4 - Dungeons & Parties
- [ ] 5-player party system
- [ ] Instanced dungeon rooms
- [ ] Boss with 2 mechanics
- [ ] Party coordination

### M5 - Persistence
- [ ] Postgres + Prisma integration
- [ ] Character data persistence
- [ ] Autosave system
- [ ] Redis session management

### M6 - FTUE & Pets
- [ ] 6-step tutorial quest chain
- [ ] Pet follower system
- [ ] Quest progression tracking

## 🧪 Testing Strategy

### TDD Principles
1. **Red**: Write failing tests first
2. **Green**: Implement minimal code to pass
3. **Blue**: Refactor while keeping tests green

### Test Coverage
- **Unit Tests**: Pure logic, game systems, utilities
- **Integration Tests**: Room interactions, network protocols
- **E2E Tests**: User workflows, multi-client scenarios

### Coverage Thresholds
- **Lines**: ≥85%
- **Branches**: ≥80%
- **Functions**: ≥85%
- **Statements**: ≥85%

## 🎨 Performance Targets

### Client Performance
- **Desktop**: 60 FPS on mid-range hardware
- **Chromebook**: 30 FPS on low-spec devices
- **Entity Budget**: ≤80 visible entities (Field), ≤20 (Dungeon)

### Server Performance
- **Tick Rate**: 60Hz (small rooms), 30Hz (large rooms)
- **Latency**: ≤120ms RTT (North America)
- **Payload**: <4KB per tick per client

## 🔧 Configuration

### Environment Variables
```bash
# Server
TICK_RATE=60              # Server tick rate
WORLD_BOUNDS=20           # World boundary size
MAX_ROOM_CCU=100          # Max players per room

# Client Performance
CLIENT_LOW_SPEC_MODE=1    # Force low-spec profile
CLIENT_RES_SCALE=1.25     # Hardware scaling multiplier
CLIENT_MAX_ENTITIES=80    # Max entities per client
```

### Quality Profiles
- **Low**: Chromebooks, ≤4GB RAM, integrated GPU
- **Medium**: Standard laptops, 8GB RAM
- **High**: Gaming PCs, ≥16GB RAM, dedicated GPU

## 📁 Project Structure

```
last-lite/
├── client/                 # Vite + Text UI client
│   ├── src/
│   │   ├── text-game.ts   # Text-based game class
│   │   ├── network.ts     # Colyseus client
│   │   └── main.ts        # Application entry point
│   └── __tests__/         # Client unit tests
├── server/                 # Node.js + Colyseus server
│   ├── src/
│   │   ├── rooms/         # Game rooms (Hub, Field, Dungeon)
│   │   ├── systems/       # Game systems (Movement, Combat, AI)
│   │   └── server.ts      # Express + Colyseus setup
│   └── tests/             # Server unit tests
├── e2e/                   # Playwright E2E tests
│   └── tests/             # End-to-end test scenarios
├── shared/                # Shared TypeScript types
│   └── types.ts           # Game entity definitions
└── .github/workflows/     # CI/CD pipelines
```

## 🤝 Contributing

1. **Write tests first** (TDD approach)
2. **Keep commits small** and focused
3. **Use conventional commit messages**:
   - `feat(server/combat): enforce GCD`
   - `test(client/ui): hotbar cooldown ring`
   - `fix(network): handle connection drops`

4. **Ensure all tests pass** before submitting PR
5. **Maintain coverage thresholds** on changed files

## 📋 Development Workflow

1. **Create feature branch** from `develop`
2. **Write failing tests** for the feature
3. **Implement minimal code** to pass tests
4. **Refactor** while keeping tests green
5. **Run full test suite** (`npm test && npm run e2e`)
6. **Submit PR** with clear description

## 🚀 Deployment

### Render.com (Recommended)
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `GET /healthz`

### Environment Setup
```bash
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
TICK_RATE=60
WORLD_BOUNDS=20
MAX_ROOM_CCU=100
```

## 📚 Documentation

- [Technical Design Document](./docs/tdd.md) - Detailed architecture and specs
- [API Reference](./docs/api.md) - Network protocol and message types
- [Testing Guide](./docs/testing.md) - TDD practices and test patterns

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ using TDD principles for a robust, maintainable codebase.**
