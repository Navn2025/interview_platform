"""Authentication business logic — register, login, user lookup."""

import secrets
import string
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Fetch a user by email address."""
    return db.query(User).filter(User.email == email).first()


def register_user(db: Session, email: str, password: str) -> User:
    """Create a new user with a hashed password.

    Raises:
        ValueError: If a user with the given email already exists.
    """
    existing = get_user_by_email(db, email)
    if existing:
        raise ValueError("A user with this email already exists.")

    user = User(
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Verify credentials and return the user, or None if invalid."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def login_user(db: Session, email: str, password: str) -> dict:
    """Authenticate and return a token response dict.

    Raises:
        ValueError: If credentials are invalid.
    """
    user = authenticate_user(db, email, password)
    if not user:
        raise ValueError("Invalid email or password.")

    token = create_access_token(user_id=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }


def login_or_register_google_user(db: Session, email: str) -> dict:
    """Handle Google OAuth user lookup and creation."""
    user = get_user_by_email(db, email)
    if not user:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        random_password = ''.join(secrets.choice(alphabet) for _ in range(32))
        user = User(
            email=email,
            hashed_password=hash_password(random_password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user_id=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }
