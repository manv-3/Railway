import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("railway.websocket")

class ConnectionManager:
    """
    Manages real-time WebSocket connections across the 4 operational tiers:
    - Tier 1: Railway Board (/board)
    - Tier 2: Zonal Headquarters (/zone)
    - Tier 3: Divisional Control Cockpit (/division)
    - Tier 4: Field Stations (/field)
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        """
        Broadcasts a structured JSON event to all connected clients.
        """
        message = json.dumps({
            "event": event_type,
            "data": payload
        })
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()
