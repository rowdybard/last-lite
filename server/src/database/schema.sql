-- Last-Lite Database Schema
-- PostgreSQL database schema for the Last-Lite MMO

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    class VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 100),
    xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    pos_x REAL NOT NULL DEFAULT 0,
    pos_y REAL NOT NULL DEFAULT 0,
    pos_z REAL NOT NULL DEFAULT 0,
    vel_vx REAL NOT NULL DEFAULT 0,
    vel_vz REAL NOT NULL DEFAULT 0,
    dir REAL NOT NULL DEFAULT 0,
    anim VARCHAR(50) NOT NULL DEFAULT 'idle',
    hp INTEGER NOT NULL DEFAULT 100,
    max_hp INTEGER NOT NULL DEFAULT 100,
    mp INTEGER NOT NULL DEFAULT 50,
    max_mp INTEGER NOT NULL DEFAULT 50,
    gold BIGINT NOT NULL DEFAULT 0 CHECK (gold >= 0),
    buffs JSONB NOT NULL DEFAULT '[]',
    debuffs JSONB NOT NULL DEFAULT '[]',
    ability_cooldowns JSONB NOT NULL DEFAULT '{}',
    inventory JSONB NOT NULL DEFAULT '[]',
    last_gcd BIGINT NOT NULL DEFAULT 0,
    last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- World entities table
CREATE TABLE IF NOT EXISTS world_entities (
    id VARCHAR(255) PRIMARY KEY,
    zone_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    pos_x REAL NOT NULL,
    pos_y REAL NOT NULL,
    pos_z REAL NOT NULL,
    vel_vx REAL NOT NULL DEFAULT 0,
    vel_vz REAL NOT NULL DEFAULT 0,
    dir REAL NOT NULL DEFAULT 0,
    anim VARCHAR(50) NOT NULL DEFAULT 'idle',
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 100),
    hp INTEGER NOT NULL DEFAULT 100,
    max_hp INTEGER NOT NULL DEFAULT 100,
    spawn_pos_x REAL NOT NULL,
    spawn_pos_y REAL NOT NULL,
    spawn_pos_z REAL NOT NULL,
    leash_distance REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Player backups table
CREATE TABLE IF NOT EXISTS player_backups (
    backup_id VARCHAR(255) PRIMARY KEY,
    player_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- World backups table
CREATE TABLE IF NOT EXISTS world_backups (
    backup_id VARCHAR(255) PRIMARY KEY,
    zone_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_level ON players(level);
CREATE INDEX IF NOT EXISTS idx_players_last_activity ON players(last_activity);

CREATE INDEX IF NOT EXISTS idx_world_entities_zone_id ON world_entities(zone_id);
CREATE INDEX IF NOT EXISTS idx_world_entities_type ON world_entities(type);
CREATE INDEX IF NOT EXISTS idx_world_entities_name ON world_entities(name);

CREATE INDEX IF NOT EXISTS idx_player_backups_created_at ON player_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_world_backups_created_at ON world_backups(created_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_entities_updated_at BEFORE UPDATE ON world_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
