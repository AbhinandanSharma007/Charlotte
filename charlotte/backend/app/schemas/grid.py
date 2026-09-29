from datetime import date
from pydantic import BaseModel


class SmartMeterOut(BaseModel):
    id: int
    consumer_name: str | None = None
    consumer_type: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    installed_at: date | None = None
    status: str

    class Config:
        from_attributes = True


class TransformerOut(BaseModel):
    id: int
    name: str
    capacity_kva: float | None = None
    latitude: float | None = None
    longitude: float | None = None

    class Config:
        from_attributes = True
