from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database.session import Base


class Substation(Base):
    __tablename__ = "substations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String)
    latitude = Column(Numeric)
    longitude = Column(Numeric)

    feeders = relationship("Feeder", back_populates="substation")


class Feeder(Base):
    __tablename__ = "feeders"

    id = Column(Integer, primary_key=True, index=True)
    substation_id = Column(Integer, ForeignKey("substations.id"))
    name = Column(String, nullable=False)
    voltage_kv = Column(Numeric, default=11)

    substation = relationship("Substation", back_populates="feeders")
    transformers = relationship("Transformer", back_populates="feeder")


class Transformer(Base):
    __tablename__ = "transformers"

    id = Column(Integer, primary_key=True, index=True)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    name = Column(String, nullable=False)
    capacity_kva = Column(Numeric)
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    installed_at = Column(Date)

    feeder = relationship("Feeder", back_populates="transformers")
    meters = relationship("SmartMeter", back_populates="transformer")


class SmartMeter(Base):
    __tablename__ = "smart_meters"

    id = Column(Integer, primary_key=True, index=True)
    transformer_id = Column(Integer, ForeignKey("transformers.id"))
    consumer_name = Column(String)
    consumer_type = Column(String)
    address = Column(String)
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    installed_at = Column(Date)
    status = Column(String, default="active")

    transformer = relationship("Transformer", back_populates="meters")
