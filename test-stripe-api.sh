#!/bin/bash

# Test Stripe Payment API Script
# This script helps test the Stripe payment endpoints

echo "🧪 Testing Stripe Payment API"
echo "=============================="
echo ""

# Configuration
BACKEND_URL="http://localhost:5000"
API_URL="${BACKEND_URL}/api/payments"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}📡 Checking if backend is running...${NC}"
if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running. Please start it first:${NC}"
    echo "   cd backend && npm run dev"
    exit 1
fi
echo ""

# Instructions
echo -e "${YELLOW}⚠️  NOTE: Payment API requires authentication${NC}"
echo -e "${YELLOW}   You need a Firebase ID token to test these endpoints${NC}"
echo ""
echo "To get a Firebase ID token:"
echo "1. Open browser and go to http://localhost:5001"
echo "2. Login to your account"
echo "3. Open Browser Console (F12)"
echo "4. Run this JavaScript:"
echo ""
echo -e "${BLUE}   const user = firebase.auth().currentUser;"
echo "   const token = await user.getIdToken();"
echo "   console.log(token);${NC}"
echo ""
echo -e "${YELLOW}Then copy the token and use it in the commands below${NC}"
echo ""
read -p "Do you have a Firebase ID token? (y/n): " has_token

if [ "$has_token" != "y" ]; then
    echo ""
    echo "Please get a Firebase ID token first, then run this script again."
    exit 0
fi

echo ""
read -p "Enter your Firebase ID token: " FIREBASE_TOKEN

if [ -z "$FIREBASE_TOKEN" ]; then
    echo -e "${RED}❌ Token is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🧪 Testing Payment API Endpoints${NC}"
echo "========================================"
echo ""

# Test 1: Create Payment Intent for PromptPay
echo -e "${BLUE}Test 1: Create PromptPay Payment Intent${NC}"
echo "------------------------------------------"
PROMPTPAY_RESPONSE=$(curl -s -X POST "${API_URL}/create-intent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
  -d '{
    "amount": 100,
    "currency": "thb",
    "paymentMethod": "promptpay"
  }')

echo "Response:"
echo "$PROMPTPAY_RESPONSE" | jq '.' 2>/dev/null || echo "$PROMPTPAY_RESPONSE"
echo ""

# Extract payment ID if successful
PAYMENT_ID=$(echo "$PROMPTPAY_RESPONSE" | jq -r '.paymentId' 2>/dev/null)
PAYMENT_INTENT_ID=$(echo "$PROMPTPAY_RESPONSE" | jq -r '.payment.stripePaymentIntentId' 2>/dev/null)

if [ ! -z "$PAYMENT_ID" ] && [ "$PAYMENT_ID" != "null" ]; then
    echo -e "${GREEN}✅ PromptPay Payment Intent created successfully${NC}"
    echo "   Payment ID: $PAYMENT_ID"
    if [ ! -z "$PAYMENT_INTENT_ID" ] && [ "$PAYMENT_INTENT_ID" != "null" ]; then
        echo "   Payment Intent ID: $PAYMENT_INTENT_ID"
    fi
else
    echo -e "${RED}❌ Failed to create PromptPay Payment Intent${NC}"
fi
echo ""

# Test 2: Create Payment Intent for Alipay/WeChat Pay
echo -e "${BLUE}Test 2: Create Alipay/WeChat Pay Payment Intent${NC}"
echo "---------------------------------------------"
ALIPAY_RESPONSE=$(curl -s -X POST "${API_URL}/create-intent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
  -d '{
    "amount": 100,
    "currency": "thb",
    "paymentMethod": "stripe_qr"
  }')

echo "Response:"
echo "$ALIPAY_RESPONSE" | jq '.' 2>/dev/null || echo "$ALIPAY_RESPONSE"
echo ""

# Check if QR code is unavailable
QR_UNAVAILABLE=$(echo "$ALIPAY_RESPONSE" | jq -r '.qrCodeUnavailable' 2>/dev/null)
if [ "$QR_UNAVAILABLE" == "true" ]; then
    echo -e "${YELLOW}⚠️  Alipay/WeChat Pay QR code is not available${NC}"
    echo "   This is expected if your Stripe account is in Thailand"
    MESSAGE=$(echo "$ALIPAY_RESPONSE" | jq -r '.message' 2>/dev/null)
    if [ ! -z "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
        echo "   Message: $MESSAGE"
    fi
else
    ALIPAY_PAYMENT_ID=$(echo "$ALIPAY_RESPONSE" | jq -r '.paymentId' 2>/dev/null)
    if [ ! -z "$ALIPAY_PAYMENT_ID" ] && [ "$ALIPAY_PAYMENT_ID" != "null" ]; then
        echo -e "${GREEN}✅ Alipay/WeChat Pay Payment Intent created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create Alipay/WeChat Pay Payment Intent${NC}"
    fi
fi
echo ""

# Test 3: Get Payment Intent Status (if we have a payment intent ID)
if [ ! -z "$PAYMENT_INTENT_ID" ] && [ "$PAYMENT_INTENT_ID" != "null" ]; then
    echo -e "${BLUE}Test 3: Get Payment Intent Status${NC}"
    echo "------------------------------------"
    STATUS_RESPONSE=$(curl -s -X GET "${API_URL}/intent/${PAYMENT_INTENT_ID}/status" \
      -H "Authorization: Bearer ${FIREBASE_TOKEN}")
    
    echo "Response:"
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    echo ""
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
    if [ ! -z "$STATUS" ] && [ "$STATUS" != "null" ]; then
        echo -e "${GREEN}✅ Payment Intent Status retrieved${NC}"
        echo "   Status: $STATUS"
    else
        echo -e "${RED}❌ Failed to get Payment Intent Status${NC}"
    fi
    echo ""
fi

echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check the QR codes in the responses"
echo "2. Test payment by scanning QR codes with appropriate apps"
echo "3. Monitor payment status using the status endpoint"





