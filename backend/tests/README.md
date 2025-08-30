# Tests Directory

This directory contains test files for the AI Voice Assistant backend.

## Test Files

### `test_stripe.py`
Basic Stripe integration tests including:
- Connection testing
- Customer creation
- Checkout session creation
- Customer portal creation

### `simple_test.py`
Comprehensive checkout session tests for both plans:
- Basic plan ($25/month): `price_1S154GJESiymFxt51BZ2djFQ`
- Pro plan ($50/month): `price_1S166FJESiymFxt59D8pdMeM`

### `test_api.py`
Flask API endpoint testing with mock data.

## Running Tests

From the main backend directory:

```bash
# Basic Stripe integration test
python tests/test_stripe.py

# Comprehensive plan testing
python tests/simple_test.py

# API endpoint testing
python tests/test_api.py
```

## Environment Requirements

Make sure your `.env` file contains:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Other required environment variables

## Test Results

All tests should pass if your Stripe configuration is correct and the price IDs are valid in your Stripe dashboard.
