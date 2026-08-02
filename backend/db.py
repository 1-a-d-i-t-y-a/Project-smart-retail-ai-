"""MongoDB connection and shared collections."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = _client[os.environ["DB_NAME"]]

# Collections
customers = db.customers
visits = db.visits
feedback = db.feedback
chat_messages = db.chat_messages
products = db.products
faqs = db.faqs
