import { Room, Client } from 'colyseus';
import { WorldState, Player, Entity, Drop, CharacterClass, Position } from '../shared/types';
import { MovementSystem } from '../systems/movement.js';
import { ZoneService } from '../services/zone-service.js';
import { RoomTransferService } from '../services/room-transfer-service.js';
import { CommandParser, ParsedCommand } from '../systems/command-parser.js';
import { CombatSystem } from '../systems/combat.js';
import { EntitySystem } from '../systems/entity.js';
import { AISystem } from '../systems/ai.js';
import { LootSystem } from '../systems/loot.js';
import { InventorySystem } from '../systems/inventory.js';
import { VendorSystem } from '../systems/vendor.js';
import { QuestSystem } from '../systems/quest.js';
import { PetSystem } from '../systems/pet.js';

export abstract class BaseRoom extends Room<WorldState> {
  protected movementSystem: MovementSystem;
  protected tickRate: number;
  protected zoneService: ZoneService;
  protected transferService: RoomTransferService;
  protected commandParser: CommandParser;
  protected combatSystem: CombatSystem;
  protected entitySystem: EntitySystem;
  protected aiSystem: AISystem;
  protected lootSystem: LootSystem;
  protected inventorySystem: InventorySystem;
  protected vendorSystem: VendorSystem;
  protected questSystem: QuestSystem;
  protected petSystem: PetSystem;

  constructor() {
    super();
    this.tickRate = parseInt(process.env.TICK_RATE || '60');
    this.movementSystem = new MovementSystem({
      bound: parseInt(process.env.WORLD_BOUNDS || '20'),
      maxSpeed: 4,
    });
    this.zoneService = new ZoneService();
    this.transferService = new RoomTransferService(this.zoneService);
    this.commandParser = new CommandParser();
    this.combatSystem = new CombatSystem();
    this.entitySystem = new EntitySystem();
    this.aiSystem = new AISystem();
    this.lootSystem = new LootSystem();
    this.inventorySystem = new InventorySystem();
    this.vendorSystem = new VendorSystem();
    this.questSystem = new QuestSystem();
    this.petSystem = new PetSystem();
    this.initializeZones();
  }

  onCreate(options: any) {
    this.setState(new WorldState());
    
    // Set up tick loop
    this.setSimulationInterval(() => this.update(), 1000 / this.tickRate);
    
    // Handle client messages
    this.onMessage('cmd', (client, data) => this.handleCommand(client, data));
    this.onMessage('input', (client, input) => this.handleInput(client, input));
    this.onMessage('swap_zone', (client, data) => this.handleZoneSwap(client, data));
  }

  onJoin(client: Client, options: any) {
    try {
      console.log(`Client ${client.sessionId} joined room ${this.roomId} with options:`, options);
      
      // Create player
      const player = this.createPlayer(client.sessionId, options);
      this.state.players[client.sessionId] = player;
      
      // Send initial state
      client.send('state', this.state);
      console.log(`Player ${player.name} created and state sent`);
    } catch (error) {
      console.error(`Error in onJoin for client ${client.sessionId}:`, error);
      client.send('error', { message: 'Failed to join room' });
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left room ${this.roomId}`);
    
    // Remove player
    delete this.state.players[client.sessionId];
  }

  onDispose() {
    console.log(`Room ${this.roomId} disposed`);
  }

  protected abstract createPlayer(sessionId: string, options: any): Player;

  protected initializeZones(): void {
    // This will be implemented by specific room types
  }

  protected update(): void {
    const deltaTime = 1 / this.tickRate;
    
    // Update movement for all players
    Object.values(this.state.players).forEach((player) => {
      this.movementSystem.step(deltaTime, player);
    });

    // Update AI for all entities
    const entities = this.entitySystem.getAllEntities();
    this.aiSystem.update(entities, new Map(Object.entries(this.state.players)), deltaTime);
    
    // Update timestamp
    this.state.timestamp = Date.now();
  }

  protected handleCommand(client: Client, data: { text: string }): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const parsed = this.commandParser.parse(data.text);
    
    switch (parsed.type) {
      case 'move':
        this.handleMoveCommand(client, parsed);
        break;
      case 'attack':
        this.handleAttackCommand(client, parsed);
        break;
      case 'cast':
        this.handleCastCommand(client, parsed);
        break;
      case 'loot':
        this.handleLootCommand(client);
        break;
      case 'look':
        this.handleLookCommand(client);
        break;
      case 'say':
        this.handleSayCommand(client, parsed);
        break;
      case 'inventory':
      case 'inv':
        this.handleInventoryCommand(client);
        break;
      case 'vendor':
        this.handleVendorCommand(client, parsed);
        break;
      case 'buy':
        this.handleBuyCommand(client, parsed);
        break;
      case 'sell':
        this.handleSellCommand(client, parsed);
        break;
      case 'quest':
        this.handleQuestCommand(client, parsed);
        break;
      case 'pet':
        this.handlePetCommand(client, parsed);
        break;
      case 'help':
        this.handleHelpCommand(client);
        break;
      case 'error':
        this.sendFeedEntry(client, {
          at: Date.now(),
          text: parsed.message || 'Unknown error',
          type: 'error'
        });
        break;
    }
  }

  protected handleMoveCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player || !parsed.direction) return;

    // Simple tile-based movement
    const tileSize = 1;
    switch (parsed.direction) {
      case 'north':
        player.pos.z -= tileSize;
        break;
      case 'south':
        player.pos.z += tileSize;
        break;
      case 'east':
        player.pos.x += tileSize;
        break;
      case 'west':
        player.pos.x -= tileSize;
        break;
    }

    // Check bounds
    const bounds = parseInt(process.env.WORLD_BOUNDS || '20');
    if (Math.abs(player.pos.x) > bounds || Math.abs(player.pos.z) > bounds) {
      // Revert movement
      switch (parsed.direction) {
        case 'north':
          player.pos.z += tileSize;
          break;
        case 'south':
          player.pos.z -= tileSize;
          break;
        case 'east':
          player.pos.x -= tileSize;
          break;
        case 'west':
          player.pos.x += tileSize;
          break;
      }
      
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'You cannot go that way.',
        type: 'error'
      });
      return;
    }

    // Update quest progress for movement commands
    this.questSystem.updateQuestProgress(player.id, 'command', `go ${parsed.direction}`, 1);

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: `You move ${parsed.direction}.`,
      type: 'info'
    });
  }

  protected handleAttackCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player || !parsed.target) return;

    // Find target entity
    const target = this.findEntityByName(parsed.target);
    if (!target) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `No target named "${parsed.target}" found.`,
        type: 'error'
      });
      return;
    }

    // Use basic attack ability (Slash for Warrior)
    const basicAttack = this.getBasicAttackForClass(player.class);
    if (!basicAttack) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'No basic attack available for your class.',
        type: 'error'
      });
      return;
    }

    const result = this.combatSystem.tryCast(player, basicAttack, target);
    
    if (result.success) {
      // Apply damage to target
      if (target.hp > 0) {
        target.hp = Math.max(0, target.hp - (result.damage || 0));
        
        this.sendFeedEntry(client, {
          at: Date.now(),
          text: `You attack ${target.name} for ${result.damage} damage.`,
          type: 'combat'
        });

        // Check if target died
        if (target.hp <= 0) {
          this.sendFeedEntry(client, {
            at: Date.now(),
            text: `${target.name} has been defeated!`,
            type: 'combat'
          });

          // Generate loot when entity dies
          const lootDrops = this.lootSystem.generateLoot(target, player);
          if (lootDrops.length > 0) {
            this.sendFeedEntry(client, {
              at: Date.now(),
              text: `${target.name} dropped ${lootDrops.length} item(s)!`,
              type: 'loot'
            });
            
            // Add loot to player's inventory
            lootDrops.forEach(drop => {
              if (drop.itemId === 'gold') {
                this.inventorySystem.addGold(player, drop.quantity);
                this.sendFeedEntry(client, {
                  at: Date.now(),
                  text: `You received ${drop.quantity} gold!`,
                  type: 'loot'
                });
              } else {
                const item = {
                  id: drop.itemId,
                  name: drop.itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  type: 'misc',
                  rarity: drop.rarity,
                  level: drop.level,
                  quantity: drop.quantity,
                  value: drop.level * 10
                };
                
                const addResult = this.inventorySystem.addItem(player, item);
                if (addResult.success) {
                  this.sendFeedEntry(client, {
                    at: Date.now(),
                    text: `You received: ${item.name}`,
                    type: 'loot'
                  });
                } else {
                  this.sendFeedEntry(client, {
                    at: Date.now(),
                    text: `Your inventory is full! ${item.name} was lost.`,
                    type: 'error'
                  });
                }
              }
            });
          }
        }
      }
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot attack: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handleCastCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player || !parsed.ability) return;

    // Find ability
    const ability = this.getAbilityById(parsed.ability);
    if (!ability) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Unknown ability: ${parsed.ability}`,
        type: 'error'
      });
      return;
    }

    // Check if player can use this ability
    if (ability.class !== player.class) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You cannot use ${ability.id} - wrong class.`,
        type: 'error'
      });
      return;
    }

    // Find target if specified
    let target: any = null;
    if (parsed.target) {
      target = this.findEntityByName(parsed.target);
      if (!target) {
        this.sendFeedEntry(client, {
          at: Date.now(),
          text: `No target named "${parsed.target}" found.`,
          type: 'error'
        });
        return;
      }
    }

    const result = this.combatSystem.tryCast(player, ability, target);
    
    if (result.success) {
      const targetText = target ? ` on ${target.name}` : '';
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You cast ${ability.id}${targetText}.`,
        type: 'combat'
      });

      // Apply damage if target exists and ability does damage
      if (target && result.damage && result.damage > 0) {
        target.hp = Math.max(0, target.hp - result.damage);
        
        this.sendFeedEntry(client, {
          at: Date.now(),
          text: `${ability.id} hits ${target.name} for ${result.damage} damage.`,
          type: 'combat'
        });

        // Check if target died
        if (target.hp <= 0) {
          this.sendFeedEntry(client, {
            at: Date.now(),
            text: `${target.name} has been defeated!`,
            type: 'combat'
          });
        }
      }
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot cast ${ability.id}: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handleLootCommand(client: Client): void {
    this.sendFeedEntry(client, {
      at: Date.now(),
      text: 'Nothing to loot here.',
      type: 'info'
    });
  }

  protected handleLookCommand(client: Client): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    let lookText = `You are in ${this.roomId}. Position: (${Math.round(player.pos.x)}, ${Math.round(player.pos.z)})\n`;
    
    // Find nearby entities
    const nearbyEntities = this.entitySystem.getEntitiesInRange(player.pos, 5);
    if (nearbyEntities.length > 0) {
      lookText += '\nNearby:\n';
      nearbyEntities.forEach(entity => {
        const distance = Math.round(this.calculateDistance(player.pos, entity.pos));
        lookText += `- ${entity.name} (Level ${entity.level}) - ${distance}m away\n`;
      });
    } else {
      lookText += '\nNothing of interest nearby.';
    }

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: lookText.trim(),
      type: 'info'
    });
  }

  protected handleSayCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    // Update quest progress for say command
    this.questSystem.updateQuestProgress(player.id, 'command', 'say', 1);

    // Broadcast to all players in the room
    this.broadcast('feed', [{
      at: Date.now(),
      text: `${player.name} says: ${parsed.message}`,
      type: 'info'
    }]);
  }

  protected sendFeedEntry(client: Client, entry: any): void {
    client.send('feed', [entry]);
  }

  protected handleInput(client: Client, input: any): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    // Update player velocity based on input
    const speed = 2.0;
    player.vel.vx = 0;
    player.vel.vz = 0;

    if (input.up) player.vel.vz = -speed;
    if (input.down) player.vel.vz = speed;
    if (input.left) player.vel.vx = -speed;
    if (input.right) player.vel.vx = speed;

    // Update animation
    if (player.vel.vx !== 0 || player.vel.vz !== 0) {
      player.anim = 'walk';
    } else {
      player.anim = 'idle';
    }
  }

  protected handleZoneSwap(client: Client, data: { toZoneId: string }): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    // Validate transfer request
    const validation = this.transferService.validateTransferRequest(
      this.roomId,
      data.toZoneId,
      player,
      2.0, // max door distance
      [] // completed quests (would come from player data in real implementation)
    );

    if (!validation.valid) {
      client.send('zone_swap_error', { reason: validation.reason });
      return;
    }

    // Get spawn position for target zone
    const spawnPos = this.transferService.getSpawnPositionForZone(data.toZoneId);
    if (!spawnPos) {
      client.send('zone_swap_error', { reason: 'No spawn point available' });
      return;
    }

    // Create transfer payload
    const payload = this.transferService.createTransferPayload(player, spawnPos);

    // Send transfer instruction to client
    client.send('zone_transfer', {
      targetZone: data.toZoneId,
      payload,
    });

    // Remove player from current room
    delete this.state.players[client.sessionId];
  }

  protected findEntityByName(name: string): Entity | null {
    const entities = this.entitySystem.findEntitiesByName(name);
    return entities.length > 0 ? entities[0] : null;
  }

  protected getBasicAttackForClass(characterClass: CharacterClass): any {
    // Return the basic attack ability for each class
    switch (characterClass) {
      case CharacterClass.Warrior:
        return this.getAbilityById('Slash');
      case CharacterClass.Ranger:
        return this.getAbilityById('Quickshot');
      case CharacterClass.Mage:
        return this.getAbilityById('Magic Bolt');
      default:
        return null;
    }
  }

  protected getAbilityById(abilityId: string): any {
    // Import and use the ability lookup function
    const { getAbilityById } = require('../data/abilities');
    return getAbilityById(abilityId);
  }

  protected calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  protected handleInventoryCommand(client: Client): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const inventory = this.inventorySystem.getInventory(player);
    
    if (inventory.size === 0) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Your inventory is empty.',
        type: 'info'
      });
      return;
    }

    let inventoryText = `Inventory (${inventory.size}/20 slots):\n`;
    inventoryText += `Gold: ${player.gold}\n\n`;

    for (const [slot, item] of inventory) {
      inventoryText += `${slot}: ${item.name} (${item.quantity}) - ${item.rarity} Level ${item.level}\n`;
    }

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: inventoryText.trim(),
      type: 'info'
    });
  }

  protected handleVendorCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const vendorInventory = this.vendorSystem.getVendorInventory(player);
    
    let vendorText = 'Vendor Inventory:\n';
    vendorText += `Your Gold: ${player.gold}\n\n`;

    vendorInventory.forEach((item, index) => {
      vendorText += `${index}: ${item.name} - ${item.value} gold (Level ${item.level})\n`;
    });

    vendorText += '\nUse "buy <item_name>" to purchase items.';
    vendorText += '\nUse "sell <slot>" to sell items from your inventory.';

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: vendorText.trim(),
      type: 'info'
    });
  }

  protected handleBuyCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.args || parsed.args.length === 0) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: buy <item_name> [quantity]',
        type: 'error'
      });
      return;
    }

    const itemName = parsed.args[0].toLowerCase();
    const quantity = parsed.args[1] ? parseInt(parsed.args[1]) : 1;

    const vendorInventory = this.vendorSystem.getVendorInventory(player);
    const item = vendorInventory.find(i => i.name.toLowerCase().includes(itemName));

    if (!item) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Item "${itemName}" not found in vendor inventory.`,
        type: 'error'
      });
      return;
    }

    const result = this.vendorSystem.buyItem(player, item, quantity);
    
    if (result.success) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You bought ${quantity}x ${item.name} for ${result.cost} gold.`,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot buy ${item.name}: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handleSellCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.args || parsed.args.length === 0) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: sell <slot> [quantity]',
        type: 'error'
      });
      return;
    }

    const slot = parseInt(parsed.args[0]);
    const quantity = parsed.args[1] ? parseInt(parsed.args[1]) : 1;

    if (isNaN(slot)) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Invalid slot number.',
        type: 'error'
      });
      return;
    }

    const result = this.vendorSystem.sellItem(player, slot, quantity);
    
    if (result.success) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You sold item for ${result.price} gold.`,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot sell item: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handleQuestCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    switch (parsed.questAction) {
      case 'list':
        this.handleQuestListCommand(client);
        break;
      case 'start':
        this.handleQuestStartCommand(client, parsed);
        break;
      case 'status':
        this.handleQuestStatusCommand(client);
        break;
      case 'abandon':
        this.handleQuestAbandonCommand(client, parsed);
        break;
    }
  }

  protected handleQuestListCommand(client: Client): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const availableQuests = this.questSystem.getAvailableQuests(player.id);
    const playerQuests = this.questSystem.getPlayerQuests(player.id);

    let message = 'Available Quests:\n';
    if (availableQuests.length === 0) {
      message += '  None available\n';
    } else {
      availableQuests.forEach(quest => {
        message += `  ${quest.id}: ${quest.title} (Level ${quest.level})\n`;
      });
    }

    message += '\nYour Quests:\n';
    if (playerQuests.length === 0) {
      message += '  None active\n';
    } else {
      playerQuests.forEach(progress => {
        const quest = this.questSystem.getQuest(progress.questId);
        if (quest) {
          const status = progress.completed ? 'Completed' : 'Active';
          message += `  ${quest.title}: ${status}\n`;
        }
      });
    }

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: message,
      type: 'info'
    });
  }

  protected handleQuestStartCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.questId) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: quest start <quest_id>',
        type: 'error'
      });
      return;
    }

    const result = this.questSystem.startQuest(player.id, parsed.questId);
    
    if (result.success) {
      const quest = this.questSystem.getQuest(parsed.questId);
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Quest started: ${quest?.title}`,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot start quest: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handleQuestStatusCommand(client: Client): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const playerQuests = this.questSystem.getPlayerQuests(player.id);
    
    if (playerQuests.length === 0) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'You have no active quests.',
        type: 'info'
      });
      return;
    }

    let message = 'Quest Status:\n';
    playerQuests.forEach(progress => {
      const quest = this.questSystem.getQuest(progress.questId);
      if (quest && !progress.completed) {
        const currentStep = quest.steps[progress.currentStep];
        if (currentStep) {
          message += `\n${quest.title}:\n`;
          message += `  ${currentStep.title}\n`;
          currentStep.objectives.forEach(objective => {
            const currentProgress = progress.objectives.get(objective.id) || 0;
            message += `  - ${objective.description}: ${currentProgress}/${objective.count}\n`;
          });
        }
      }
    });

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: message,
      type: 'info'
    });
  }

  protected handleQuestAbandonCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: 'Quest abandonment not implemented yet.',
      type: 'error'
    });
  }

  protected handlePetCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    switch (parsed.petAction) {
      case 'list':
        this.handlePetListCommand(client);
        break;
      case 'adopt':
        this.handlePetAdoptCommand(client, parsed);
        break;
      case 'summon':
        this.handlePetSummonCommand(client, parsed);
        break;
      case 'dismiss':
        this.handlePetDismissCommand(client, parsed);
        break;
      case 'use':
        this.handlePetUseCommand(client, parsed);
        break;
      case 'status':
        this.handlePetStatusCommand(client);
        break;
    }
  }

  protected handlePetListCommand(client: Client): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const pets = this.petSystem.getPlayerPets(player.id);
    const availableTypes = this.petSystem.getAvailablePetTypes();

    let message = 'Available Pet Types:\n';
    availableTypes.forEach(type => {
      const template = this.petSystem.getPetTemplate(type);
      if (template) {
        message += `  ${type}: ${template.rarity} (HP: ${template.baseStats.hp}, Attack: ${template.baseStats.attack})\n`;
      }
    });

    message += '\nYour Pets:\n';
    if (pets.length === 0) {
      message += '  None owned\n';
    } else {
      pets.forEach(pet => {
        const status = pet.summoned ? 'Summoned' : 'Stored';
        message += `  ${pet.name} (${pet.type}): Level ${pet.level} - ${status}\n`;
      });
    }

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: message,
      type: 'info'
    });
  }

  protected handlePetAdoptCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.petType || !parsed.petName) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: pet adopt <type> <name>',
        type: 'error'
      });
      return;
    }

    const result = this.petSystem.adoptPet(player.id, parsed.petType as any, parsed.petName);
    
    if (result.success && result.pet) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You adopted ${result.pet.name} the ${result.pet.type}!`,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot adopt pet: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handlePetSummonCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.petId) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: pet summon <pet_id>',
        type: 'error'
      });
      return;
    }

    const result = this.petSystem.summonPet(player.id, parsed.petId, player.pos);
    
    if (result.success) {
      const pet = this.petSystem.getPet(parsed.petId);
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You summoned ${pet?.name}!`,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot summon pet: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handlePetDismissCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.petId) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: pet dismiss <pet_id>',
        type: 'error'
      });
      return;
    }

    const result = this.petSystem.dismissPet(player.id, parsed.petId);
    
    if (result.success) {
      const pet = this.petSystem.getPet(parsed.petId);
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `You dismissed ${pet?.name}.`,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot dismiss pet: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handlePetUseCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    if (!parsed.petId || !parsed.ability) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'Usage: pet use <pet_id> <ability>',
        type: 'error'
      });
      return;
    }

    const result = this.petSystem.usePetAbility(parsed.petId, parsed.ability);
    
    if (result.success) {
      const pet = this.petSystem.getPet(parsed.petId);
      let message = `${pet?.name} used ${parsed.ability}!`;
      if (result.damage) {
        message += ` Dealt ${result.damage} damage.`;
      }
      if (result.healing) {
        message += ` Healed ${result.healing} HP.`;
      }
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: message,
        type: 'success'
      });
    } else {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: `Cannot use ability: ${result.reason}`,
        type: 'error'
      });
    }
  }

  protected handlePetStatusCommand(client: Client): void {
    const player = this.state.players[client.sessionId];
    if (!player) return;

    const pets = this.petSystem.getPlayerPets(player.id);
    
    if (pets.length === 0) {
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'You have no pets.',
        type: 'info'
      });
      return;
    }

    let message = 'Pet Status:\n';
    pets.forEach(pet => {
      const status = pet.summoned ? 'Summoned' : 'Stored';
      message += `\n${pet.name} (${pet.type}):\n`;
      message += `  Level: ${pet.level} (${pet.xp} XP)\n`;
      message += `  HP: ${pet.hp}/${pet.maxHp}\n`;
      message += `  MP: ${pet.mp}/${pet.maxMp}\n`;
      message += `  Attack: ${pet.attack}, Defense: ${pet.defense}\n`;
      message += `  Status: ${status}\n`;
    });

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: message,
      type: 'info'
    });
  }

  protected handleHelpCommand(client: Client): void {
    const helpText = `
Available Commands:

MOVEMENT:
  go north/south/east/west - Move in a direction
  look - Look around the area

COMBAT:
  attack <target> - Attack a target
  cast <ability> [target] - Cast an ability

COMMUNICATION:
  say <message> - Say something to other players

INVENTORY:
  inventory/inv - View your inventory
  loot - Loot nearby items

VENDOR:
  vendor - Open vendor menu
  buy <slot> [quantity] - Buy items
  sell <slot> [quantity] - Sell items

QUESTS:
  quest - List available and active quests
  quest start <quest_id> - Start a quest
  quest status - Check quest progress
  quest abandon <quest_id> - Abandon a quest

PETS:
  pet - List available pet types and owned pets
  pet adopt <type> <name> - Adopt a new pet
  pet summon <pet_id> - Summon a pet
  pet dismiss <pet_id> - Dismiss a summoned pet
  pet use <pet_id> <ability> - Use a pet ability
  pet status - Check pet stats

OTHER:
  help - Show this help message

Type any command to get started!
`;

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: helpText,
      type: 'info'
    });
  }
}
