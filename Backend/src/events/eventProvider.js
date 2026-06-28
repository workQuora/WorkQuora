const eventBus = require('./eventBus');
const config = require('../config/configService');

class AbstractEventProvider {
  publish(eventName, payload, io) {
    throw new Error('publish method must be implemented by subclass');
  }
}

// ── LOCAL EVENT PROVIDER (FALLBACK) ──
class LocalEventProvider extends AbstractEventProvider {
  publish(eventName, payload, io) {
    console.log(`🔌 [LocalEventProvider] Publishing event: "${eventName}"`);
    // Local eventBus emits event immediately in process
    eventBus.emit(eventName, payload, io);
  }
}

// ── REDIS BULLMQ EVENT PROVIDER (DISTRIBUTED QUEUE) ──
class BullMQEventProvider extends AbstractEventProvider {
  constructor() {
    super();
    this.queue = null;
    try {
      const { Queue } = require('bullmq');
      // Set up Redis-backed job queue with exponential backoff strategy (Vol 19)
      this.queue = new Queue('workquora-events', {
        connection: {
          url: config.redisUrl || 'redis://127.0.5.1:6379'
        },
        defaultJobOptions: {
          attempts: 5, // Retry up to 5 times on failures
          backoff: {
            type: 'exponential',
            delay: 1000 // Exponential backoff starting at 1s
          },
          removeOnComplete: true, // Auto clean successful jobs
          removeOnFail: false // Keep failed jobs in DLQ for analysis
        }
      });
      console.log('✅ BullMQ Distributed Queue Provider Initialized successfully.');
    } catch (err) {
      console.warn('⚠️ BullMQ package not installed or Redis not configured. EventProvider falling back to local memory bus.');
    }
  }

  async publish(eventName, payload, io) {
    if (this.queue) {
      console.log(`🔌 [BullMQEventProvider] Enqueueing job event: "${eventName}" to Redis`);
      try {
        await this.queue.add(eventName, { payload }, { jobId: `${eventName}:${payload}` });
      } catch (err) {
        console.error('❌ BullMQ Enqueue failed, falling back to local bus:', err.message);
        eventBus.emit(eventName, payload, io);
      }
    } else {
      // Local fallback
      eventBus.emit(eventName, payload, io);
    }
  }
}

// Initialize provider based on config file settings (Vol 19)
let activeProvider;

if (config.queueProvider === 'redis' && config.redisUrl) {
  activeProvider = new BullMQEventProvider();
} else {
  activeProvider = new LocalEventProvider();
}

module.exports = activeProvider;
