"""
Read-Only Database Session Factory
Railway AI Block Planning Platform

Guarantees 100% Zero-Mutation at the database engine level by enforcing:
SET default_transaction_read_only = 'on';

Any attempted INSERT, UPDATE, DELETE, ALTER, or DROP will immediately raise
a PostgreSQL engine exception: 'cannot execute ... in a read-only transaction'.

Author: Railway AI Team
Version: 2.0.0
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://railway:railway123@localhost:5433/railway_ai"
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Read-only engine with dedicated connection pool
ro_engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Enforce read-only mode on every connection checked out without leaving an open transaction
@event.listens_for(ro_engine, "connect")
def set_read_only_session(dbapi_connection, connection_record):
    old_autocommit = getattr(dbapi_connection, "autocommit", False)
    dbapi_connection.autocommit = True
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SET default_transaction_read_only = 'on';")
    finally:
        cursor.close()
        dbapi_connection.autocommit = old_autocommit

ReadOnlySessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=ro_engine
)


def get_read_only_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a strictly READ-ONLY database session.
    Mutations are physically impossible at the PostgreSQL engine level.
    """
    db = ReadOnlySessionLocal()
    try:
        yield db
    finally:
        db.close()
