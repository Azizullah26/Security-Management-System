#!/bin/bash

# AWS Lambda Deployment Script for Security Management System

set -e

echo "🚀 Starting AWS Lambda Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework is not installed."
    echo "Install with: npm install -g serverless"
    exit 1
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
    echo "📝 Loading environment variables from .env.local..."
    export $(cat .env.local | grep -v '#' | xargs)
else
    echo "⚠️  .env.local not found. Make sure environment variables are set in AWS Systems Manager Parameter Store or Lambda environment."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Deploy with Serverless Framework
echo "🌍 Deploying to AWS Lambda..."
serverless deploy --verbose

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check CloudWatch Logs: aws logs tail /aws/lambda/security-management-system-api --follow"
echo "2. Get API endpoint: aws apigateway get-rest-apis --query 'items[?name==\`security-management-system-api\`]'"
