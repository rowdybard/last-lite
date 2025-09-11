# Last Lite - Hub System

A hybrid text-forward browser RPG with NPCs, quests, and shops. Built with React + TypeScript + Vite frontend and Node.js + Express backend.

## Features

- **Hub View**: Interactive NPC list with keyboard navigation
- **Dialogue System**: Branching conversations with requirements and effects
- **Quest System**: Accept, track, and complete quests with rewards
- **Shop System**: Buy/sell items with dynamic pricing and stock
- **Data-Driven**: All content defined in JSON files for easy modification

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   # Server
   cd server
   npm install
   
   # Client
   cd ../client
   npm install
   ```

2. **Start development servers:**
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev
   
   # Terminal 2 - Client
   cd client
   npm run dev
   ```

3. **Open the game:**
   - Navigate to `http://localhost:5173` (client)
   - Server runs on `http://localhost:3000`

### Production Build

```bash
# Build both client and server
cd client && npm run build
cd ../server && npm run build

# Start production server
cd server && npm start
```

## Game Controls

- **↑/↓**: Navigate NPC list
- **Enter**: Select NPC or dialogue option
- **Esc**: Close modals
- **Mouse**: Click to interact

## Adding Content

### New NPCs

Edit `server/data/npcs.json`:

```json
{
  "id": "npc_new_character",
  "type": "quest",
  "name": "New Character",
  "title": "Helper",
  "hubPosition": { "x": 5, "y": 5 },
  "avatar": "🧙‍♂️",
  "dialogueRoot": "dlg_new_character"
}
```

### New Quests

Edit `server/data/quests.json`:

```json
{
  "id": "q_new_quest",
  "title": "New Quest",
  "giverId": "npc_new_character",
  "summary": "Do something new",
  "description": "Complete this new quest",
  "objectives": [
    { "type": "collect", "itemId": "itm_new_item", "qty": 5 }
  ],
  "rewards": { "xp": 100, "gold": 50 },
  "prerequisites": [],
  "repeatable": false
}
```

### New Items

Edit `server/data/items.json`:

```json
{
  "id": "itm_new_item",
  "name": "New Item",
  "type": "material",
  "desc": "A useful new item",
  "stack": 99,
  "baseValue": 5
}
```

### New Shops

Edit `server/data/shops.json`:

```json
{
  "id": "shop_new_vendor",
  "vendorId": "npc_vendor",
  "buybackLimit": 10,
  "inventory": [
    { "itemId": "itm_new_item", "stock": 20 }
  ],
  "sellRules": {
    "enabled": true,
    "priceFactor": 0.6,
    "blacklistItemTypes": ["quest"]
  }
}
```

### New Dialogue

Edit `server/data/dialogue.json`:

```json
{
  "id": "dlg_new_character",
  "npcId": "npc_new_character",
  "text": "Hello! I have a quest for you.",
  "options": [
    {
      "label": "Accept quest",
      "effects": [{ "type": "questStart", "questId": "q_new_quest" }],
      "next": "end"
    },
    { "label": "Not now", "next": "end" }
  ]
}
```

## Testing

```bash
# Run unit tests
npm test

# Run UI tests (requires Playwright)
npm run test:ui
```

## API Endpoints

- `GET /api/hub` - Get hub information
- `GET /api/npcs` - Get all NPCs
- `GET /api/npcs/:id` - Get specific NPC
- `GET /api/quests` - Get all quests
- `POST /api/quests/start` - Start a quest
- `POST /api/quests/complete` - Complete a quest
- `GET /api/shop/:shopId` - Get shop inventory
- `POST /api/shop/buy` - Buy item
- `POST /api/shop/sell` - Sell item
- `POST /api/dialogue/advance` - Advance dialogue
- `GET /api/player` - Get player state

## Architecture

- **Frontend**: React + TypeScript + Vite + Zustand
- **Backend**: Node.js + Express + TypeScript
- **Data**: JSON files loaded at startup
- **State**: Zustand for client state, in-memory for server state
- **Styling**: CSS with terminal/green theme

## Development

The system is designed to be easily extensible:

1. **Add new NPC types** by extending the NPC interface
2. **Add new quest objectives** by extending the QuestObjective interface
3. **Add new dialogue effects** by extending the Effect interface
4. **Add new item types** by extending the Item interface

All data is loaded from JSON files, making it easy to add content without code changes.

## License

MIT