import os

from SC4SNMP_UI_backend import mongo_client


def transactions_supported():
    return os.getenv("MONGODB_MODE", "standalone").lower() != "standalone"


def run_write(write_fn):
    """
    Runs write_fn(session) inside a Mongo transaction when the deployment
    supports it (MONGODB_MODE != standalone) - atomic, auto-rollback on error.
    On standalone, calls write_fn(None): the same writes run sequentially with
    no rollback (functional but not atomic). write_fn must forward the session
    to every write via session=session for the transactional path to be atomic.
    """
    if transactions_supported():
        with mongo_client.start_session() as session:
            with session.start_transaction():
                return write_fn(session)
    return write_fn(None)
