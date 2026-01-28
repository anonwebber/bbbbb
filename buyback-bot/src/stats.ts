import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATS_FILE = path.join(__dirname, '../data/stats.json');

interface Stats {
  totalSolUsed: number;
  totalBurned: number;
  burnCount: number;
  lastBurnTime: number | null;
  lastBurnAmount: number;
  lastBurnTx: string | null;
  history: BurnEvent[];
}

interface BurnEvent {
  timestamp: number;
  solUsed: number;
  tokensBurned: number;
  txSignature: string;
}

interface Activity {
  type: 'claim' | 'swap' | 'burn' | 'error' | 'info';
  message: string;
  timestamp: number;
  tx?: string;
}

let stats: Stats = {
  totalSolUsed: 0,
  totalBurned: 0,
  burnCount: 0,
  lastBurnTime: null,
  lastBurnAmount: 0,
  lastBurnTx: null,
  history: []
};

let activities: Activity[] = [];
let currentStatus = 'idle';
let solBalance = 0;
let tokenBalance = 0;

let wss: WebSocketServer | null = null;

// Load stats from file
function loadStats() {
  try {
    const dir = path.dirname(STATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      stats = JSON.parse(data);
      console.log('📊 Loaded stats:', stats.totalBurned.toLocaleString(), 'tokens burned total');
    }
  } catch (e) {
    console.log('📊 Starting fresh stats');
  }
}

// Save stats to file
function saveStats() {
  try {
    const dir = path.dirname(STATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

export function initWebSocket(server: http.Server) {
  loadStats();

  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    // Send current state on connect
    ws.send(JSON.stringify({
      type: 'init',
      stats,
      activities: activities.slice(-50),
      status: currentStatus,
      solBalance,
      tokenBalance
    }));
  });

  console.log('✅ WebSocket ready');
}

function broadcast(data: object) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

export function addActivity(type: Activity['type'], message: string, tx?: string) {
  const activity: Activity = {
    type,
    message,
    timestamp: Date.now(),
    tx
  };

  activities.push(activity);
  if (activities.length > 100) activities.shift();

  console.log(`[${type.toUpperCase()}] ${message}`);
  broadcast({ type: 'activity', activity });
}

export function updateStatus(status: string) {
  currentStatus = status;
  broadcast({ type: 'status', status });
}

export function updateBalances(sol: number, tokens: number) {
  solBalance = sol;
  tokenBalance = tokens;
  broadcast({ type: 'balances', solBalance: sol, tokenBalance: tokens });
}

export function recordBurn(solUsed: number, tokensBurned: number, txSignature: string) {
  stats.totalSolUsed += solUsed;
  stats.totalBurned += tokensBurned;
  stats.burnCount++;
  stats.lastBurnTime = Date.now();
  stats.lastBurnAmount = tokensBurned;
  stats.lastBurnTx = txSignature;

  stats.history.push({
    timestamp: Date.now(),
    solUsed,
    tokensBurned,
    txSignature
  });

  // Keep only last 100 burn events
  if (stats.history.length > 100) {
    stats.history = stats.history.slice(-100);
  }

  saveStats();
  broadcast({ type: 'stats', stats });
}

export function getStats() {
  return stats;
}
