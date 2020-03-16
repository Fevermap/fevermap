# -*- coding: utf-8 -*-

from sqlalchemy import create_engine
from sqlalchemy.orm import create_session
from sqlalchemy.orm import scoped_session

engine = None
db_session = scoped_session(lambda: create_session(bind=engine,
                                                   autocommit=False,
                                                   autoflush=True))


def init_engine(uri, **kwargs):
    global engine
    if uri is None:
        raise ValueError("Missing database URI!")
    engine = create_engine(uri, pool_pre_ping=True, **kwargs)
    return engine
