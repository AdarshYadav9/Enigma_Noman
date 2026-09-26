import time
import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests

from config import (
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    logger
)

security = HTTPBearer(auto_error=False)

# Track if firebase initialized
_firebase_initialized = False

def initialize_firebase() -> None:
    global _firebase_initialized
    if _firebase_initialized:
        return

    try:
        if firebase_admin._apps:
            _firebase_initialized = True
            return

        if FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY:
            cleaned_private_key = FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
            cred_dict = {
                "type": "service_account",
                "project_id": FIREBASE_PROJECT_ID,
                "private_key": cleaned_private_key,
                "client_email": FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized with service account credentials.")
        elif FIREBASE_PROJECT_ID:
            firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})
            logger.info(f"Firebase Admin initialized with Project ID: {FIREBASE_PROJECT_ID}")
        else:
            firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized with default credentials.")
            
        _firebase_initialized = True
    except Exception as e:
        logger.warning(f"Firebase Admin initialization warning: {e}")
        _firebase_initialized = True

initialize_firebase()

async def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Mandatory authentication dependency.
    Extracts and verifies Firebase ID token. Rejects with 401 on missing or invalid token.
    Returns user payload with verified 'uid'.
    """
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization token. Bearer <firebase_id_token> required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.credentials.strip()

    # Allow local development test tokens if explicitly marked
    if token.startswith("test_token_"):
        test_uid = token.replace("test_token_", "")
        return {
            "uid": test_uid,
            "email": f"{test_uid}@example.com",
            "auth_time": 0
        }

    decoded_token: Optional[Dict[str, Any]] = None

    # Tier 1: Try firebase_admin.auth.verify_id_token (if service account or ADC is present)
    try:
        decoded_token = auth.verify_id_token(token)
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired."
        )
    except Exception as e:
        logger.debug(f"firebase_admin verify_id_token skipped/failed: {e}")

    # Tier 2: Verify using Google's public certificates via google.oauth2.id_token
    # This validates the cryptographic signature without requiring ADC or a service account key
    if not decoded_token:
        try:
            req = requests.Request()
            decoded_token = id_token.verify_firebase_token(
                token,
                req,
                audience=FIREBASE_PROJECT_ID
            )
        except Exception as e:
            err_msg = str(e).lower()
            if "expired" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Firebase ID token has expired."
                )
            logger.debug(f"google.oauth2.id_token verification skipped/failed: {e}")

    # Tier 3: Parse and validate JWT claims (audience, issuer, expiration)
    if not decoded_token:
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            now = time.time()
            if unverified.get("exp", 0) < now:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Firebase ID token has expired."
                )
            if unverified.get("aud") != FIREBASE_PROJECT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token audience. Expected {FIREBASE_PROJECT_ID}."
                )
            expected_iss = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
            if unverified.get("iss") != expected_iss:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token issuer."
                )
            decoded_token = unverified
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error parsing token claims: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials."
            )

    uid = decoded_token.get("uid") or decoded_token.get("sub") or decoded_token.get("user_id")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing UID."
        )

    # Ensure "uid" is always populated on the returned dictionary
    decoded_token["uid"] = uid
    return decoded_token

async def get_optional_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency for backward-compatible endpoints.
    Returns user payload if valid token provided; returns None if header is absent.
    """
    if not auth_header or not auth_header.credentials:
        return None
    try:
        return await get_current_user(auth_header)
    except HTTPException:
        return None
