import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from google.auth import exceptions as google_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.db_models import User
from backend.models import GoogleAuthRequest, LoginRequest, SignupRequest, TokenResponse, UserResponse
from backend.rate_limit import limiter

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set. This app requires a secret key to sign login sessions — "
        "set JWT_SECRET in your .env (any long random string)."
    )
if len(JWT_SECRET) < 32:
    raise RuntimeError(
        "JWT_SECRET is too short (must be at least 32 characters) — a weak secret lets "
        "an attacker forge login sessions. Generate one with: python -c "
        "\"import secrets; print(secrets.token_urlsafe(32))\""
    )
JWT_ALGORITHM = "HS256"
JWT_EXPIRY = timedelta(days=7)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

# A real bcrypt hash with no matching password, used to make failed logins for
# a nonexistent email take the same time as a wrong-password login — without
# this, response timing would let an attacker enumerate registered emails.
_DUMMY_HASH = bcrypt.hashpw(b"", bcrypt.gensalt()).decode("utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + JWT_EXPIRY}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return int(payload["sub"])


def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        user_id = decode_access_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_active_subscription(user: User = Depends(get_current_user)) -> User:
    if user.subscription_status != "active":
        raise HTTPException(status_code=402, detail="Active subscription required")
    return user


auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


@auth_router.post("/signup", response_model=TokenResponse)
@limiter.limit("10/minute")
def signup(request: Request, body: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@auth_router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    hashed = user.hashed_password if user and user.hashed_password else _DUMMY_HASH
    password_ok = verify_password(body.password, hashed)
    if user is None or user.hashed_password is None or not password_ok:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return TokenResponse(access_token=create_access_token(user.id))


@auth_router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_login(request: Request, body: GoogleAuthRequest, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured yet")

    try:
        payload = google_id_token.verify_oauth2_token(
            body.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except (ValueError, google_exceptions.GoogleAuthError):
        # ValueError: malformed/expired/bad-signature/wrong-audience token.
        # GoogleAuthError: wrong issuer, or transport failure fetching Google's
        # signing certs. All are either an invalid credential or a transient
        # issue on our end — neither should surface as an unhandled 500.
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    if not payload.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account email is not verified")

    google_sub = payload["sub"]
    email = payload["email"]

    user = db.query(User).filter(User.google_sub == google_sub).first()
    if user is None:
        # Same email already has a password account — link Google to it
        # rather than creating a duplicate.
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_sub = google_sub
        else:
            user = User(email=email, hashed_password=None, google_sub=google_sub)
            db.add(user)
        db.commit()
        db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@auth_router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user
