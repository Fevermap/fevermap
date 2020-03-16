# -*- coding: utf-8 -*-

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

from fevermap.db import db_session


class ModelBase(object):
    __abstract__ = True

    id = Column(
        Integer,
        primary_key=True)

    timestamp_created = Column(
        DateTime,
        nullable=False,
        default=func.current_timestamp())

    timestamp_modified = Column(
        DateTime,
        nullable=False,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp())


Base = declarative_base(cls=ModelBase)
Base.query = db_session.query_property()
