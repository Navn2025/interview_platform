"""Authentication routes — register and login."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.requests import Request
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError

from app.core.config import get_settings

from app.db.session import get_db
from app.schemas.auth import TokenResponse, UserLogin
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

settings = get_settings()
oauth = OAuth()
if settings.google_client_id and settings.google_client_secret:
    oauth.register(
        name='google',
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile',
            'timeout': 60.0,
            'trust_env': False
        }
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        user = auth_service.register_user(db, email=payload.email, password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    try:
        token_data = auth_service.login_user(db, email=payload.email, password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return token_data


@router.get("/google")
async def login_google(request: Request):
    """Initiate Google OAuth login."""
    if not getattr(oauth, 'google', None):
        raise HTTPException(status_code=500, detail="Google OAuth is not configured.")
    redirect_uri = str(request.url_for('auth_google_callback'))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback and log the user in."""
    if not getattr(oauth, 'google', None):
         raise HTTPException(status_code=500, detail="Google OAuth is not configured.")
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        raise HTTPException(status_code=400, detail=f"OAuth validation failed: {error.error}")
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Google: {str(error)}")

    user_info = token.get('userinfo')
    if not user_info or not user_info.get('email'):
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google.")

    try:
        token_data = auth_service.login_or_register_google_user(db, email=user_info['email'])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    import urllib.parse
    encoded_email = urllib.parse.quote(token_data['email'])
    redirect_url = f"{settings.frontend_url}/oauth/callback?token={token_data['access_token']}&email={encoded_email}"
    return RedirectResponse(url=redirect_url, status_code=302)
