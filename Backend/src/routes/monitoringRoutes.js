const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const os = require('os');

// @desc    Liveness check (Vol 20)
// @route   GET /api/v1/health/liveness
// @access  Public
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'active',
    timestamp: new Date(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// @desc    Readiness check with service diagnostics (Vol 20)
// @route   GET /api/v1/health/readiness
// @access  Public
router.get('/readiness', async (req, res) => {
  let dbStatus = 'unreachable';
  let redisStatus = 'disabled';

  try {
    // Verify MongoDB Connection State
    // 1 = connected, 2 = connecting, 3 = disconnecting, 0 = disconnected
    const state = mongoose.connection.readyState;
    if (state === 1) dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  try {
    // Verify Redis connection state
    if (redisClient && redisClient.isOpen) {
      redisStatus = 'connected';
    } else if (redisClient) {
      redisStatus = 'disconnected';
    }
  } catch (err) {
    redisStatus = `error: ${err.message}`;
  }

  const isReady = dbStatus === 'connected';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date(),
    services: {
      database: dbStatus,
      cache: redisStatus,
      queue: 'active', // local queue fallback active
    },
    systemMetrics: {
      freeMemoryBytes: os.freemem(),
      totalMemoryBytes: os.totalmem(),
      cpuLoadPercentage: Math.round(os.loadavg()[0] * 100) / 100,
    }
  });
});

module.exports = router;
