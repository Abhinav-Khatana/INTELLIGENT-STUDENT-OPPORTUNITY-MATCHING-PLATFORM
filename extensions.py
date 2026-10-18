"""Shared Flask extension instances.

Kept in their own module so models.py and app.py can both import `db`
without creating a circular import between them.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()