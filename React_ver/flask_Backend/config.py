import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://postgres:1234@localhost:5432/Aqua-PRL'
    SQLALCHEMY_TRACK_MODIFICATIONS = False