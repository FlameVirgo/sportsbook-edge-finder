import logging
import os
from datetime import datetime, timezone

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.db_models import User
from backend.models import CheckoutSessionResponse

load_dotenv()

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

billing_router = APIRouter(prefix="/api/billing", tags=["billing"])


@billing_router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not stripe.api_key or not STRIPE_PRICE_ID:
        raise HTTPException(status_code=503, detail="Billing is not configured yet")

    if user.stripe_customer_id is None:
        customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=user.stripe_customer_id,
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/?checkout=success",
        cancel_url=f"{FRONTEND_URL}/?checkout=cancel",
    )
    return CheckoutSessionResponse(url=session.url)


@billing_router.post("/create-portal-session", response_model=CheckoutSessionResponse)
def create_portal_session(user: User = Depends(get_current_user)):
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found for this user yet")

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=FRONTEND_URL,
    )
    return CheckoutSessionResponse(url=session.url)


@billing_router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user = db.query(User).filter(User.stripe_customer_id == data["customer"]).first()
        if user is not None:
            user.stripe_subscription_id = data["subscription"]
            subscription = stripe.Subscription.retrieve(data["subscription"])
            user.subscription_status = subscription.status
            user.current_period_end = datetime.fromtimestamp(
                subscription.current_period_end, tz=timezone.utc
            )
            db.commit()

    elif event_type == "customer.subscription.updated":
        user = db.query(User).filter(User.stripe_customer_id == data["customer"]).first()
        if user is not None:
            user.subscription_status = data["status"]
            user.current_period_end = datetime.fromtimestamp(
                data["current_period_end"], tz=timezone.utc
            )
            db.commit()

    elif event_type == "customer.subscription.deleted":
        user = db.query(User).filter(User.stripe_customer_id == data["customer"]).first()
        if user is not None:
            user.subscription_status = "canceled"
            db.commit()

    else:
        logger.info("Unhandled Stripe webhook event type: %s", event_type)

    return {"received": True}
