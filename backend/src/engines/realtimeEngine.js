// backend/src/engines/realtimeEngine.js
const EventEmitter = require('events');

class RealtimeEngine extends EventEmitter {
    constructor() {
        super();
        this.clients = new Set();
    }

    /**
     * Registers a new SSE client connection
     */
    addClient(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        res.write(`event: CONNECTED\ndata: ${JSON.stringify({ message: "Real-time sync active", timestamp: new Date().toISOString() })}\n\n`);

        this.clients.add(res);

        req.on('close', () => {
            this.clients.delete(res);
        });
    }

    /**
     * Broadcasts an event to all connected portals (Citizen & Administrator)
     */
    broadcast(eventName, payload) {
        const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
        for (const client of this.clients) {
            try {
                client.write(message);
            } catch (err) {
                this.clients.delete(client);
            }
        }
        this.emit(eventName, payload);
    }
}

const realtimeInstance = new RealtimeEngine();
module.exports = realtimeInstance;
