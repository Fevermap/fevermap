# -*- coding: utf-8 -*-

from sqlalchemy import BigInteger
from sqlalchemy import Column
from sqlalchemy import SmallInteger
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship

from fevermap.db.base import Base


class Submitter(Base):
    """Individul submitting data."""

    __tablename__ = 'submitters'

    # Unique identifier created with JavaScript Date().getTime()
    # Assumed to stay the same across all submissions
    device_id = Column(BigInteger, unique=True)

    # Year of birth, e.g. 1983
    birth_year = Column(SmallInteger)

    # M=male, F=female
    gender = Column(ENUM("M", "F"))

    submissions = relationship('Submission')

    def __repr__(self):
        return '<Submitter(id={})>'.format(self.id)
