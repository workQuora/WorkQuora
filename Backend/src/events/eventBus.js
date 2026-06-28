const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limits to prevent warnings in heavy test runs
    this.setMaxListeners(50);
  }
}

// Single instance to share across modular backend
const eventBus = new EventBus();

module.exports = eventBus;
