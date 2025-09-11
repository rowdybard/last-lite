import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import hubRouter, { initializeHub } from './routes/hub.js';
import npcsRouter, { initializeNPCs } from './routes/npcs.js';
import questsRouter, { initializeQuests } from './routes/quests.js';
import shopRouter, { initializeShop, setPlayerState as setShopPlayerState } from './routes/shop.js';
import dialogueRouter, { initializeDialogue, setPlayerState as setDialoguePlayerState } from './routes/dialogue.js';

// Import services
import { DialogueService } from './services/dialogue.js';
import { QuestService } from './services/quests.js';
import { ShopService } from './services/shop.js';

// Import types
import { Hub, NPC, Quest, Item, Shop, DialogueNode, PlayerState } from './shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Load data
async function loadData() {
  try {
    // Load JSON data files
    const hubData: Hub = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hub.json'), 'utf8'));
    const npcsData: NPC[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/npcs.json'), 'utf8'));
    const questsData: Quest[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/quests.json'), 'utf8'));
    const itemsData: Item[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/items.json'), 'utf8'));
    const shopsData: Shop[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/shops.json'), 'utf8'));
    const dialogueData: DialogueNode[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dialogue.json'), 'utf8'));

    // Initialize services
    const dialogueService = new DialogueService(dialogueData);
    const questService = new QuestService(questsData);
    const shopService = new ShopService(shopsData, itemsData);

    // Initialize routes
    initializeHub(hubData);
    initializeNPCs(npcsData);
    initializeQuests(questService);
    initializeShop(shopService);
    initializeDialogue(dialogueService);

    // Initialize player state
    const initialPlayerState: PlayerState = {
      gold: 25,
      inventory: [{ itemId: 'itm_health_vial', qty: 2 }],
      questLog: [],
      flags: {}
    };

    setShopPlayerState(initialPlayerState);
    setDialoguePlayerState(initialPlayerState);

    console.log('✅ Data loaded successfully');
    console.log(`📊 Loaded ${npcsData.length} NPCs, ${questsData.length} quests, ${itemsData.length} items, ${shopsData.length} shops`);

    return true;
  } catch (error) {
    console.error('❌ Failed to load data:', error);
    return false;
  }
}

// Routes
app.use('/', hubRouter);
app.use('/', npcsRouter);
app.use('/', questsRouter);
app.use('/', shopRouter);
app.use('/', dialogueRouter);

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Start server
async function startServer() {
  const dataLoaded = await loadData();
  if (!dataLoaded) {
    console.error('Failed to load data, exiting');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
    console.log(`🎮 Game: http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
