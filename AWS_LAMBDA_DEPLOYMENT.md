# Security Management System - AWS Lambda Deployment Guide

## Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)

# Install Serverless Framework
npm install -g serverless

# Install project dependencies
npm install
```

## Quick Start - AWS Amplify (Recommended)

**Simplest option - automatic CI/CD, custom domain, free tier eligible**

### Step 1: Connect Repository
```bash
# Push your code to GitHub/GitLab/CodeCommit
git push origin main
```

### Step 2: Create Amplify App
```bash
# Via AWS Console:
1. Go to AWS Amplify Console
2. Click "New app" > "Host web app"
3. Select your repository and branch
4. Click "Connect branch"
```

### Step 3: Add Environment Variables
In Amplify Console:
```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
ODOO_URL = https://erp.elrace.com
ODOO_DB = your_db_name
ODOO_USERNAME = your_username
ODOO_PASSWORD = your_api_key
ADMIN_PASSWORD = your_admin_password
AUTONOMA_CLIENT_ID = your_client_id
AUTONOMA_SECRET_ID = your_secret_id
```

### Step 4: Deploy
```bash
# Amplify auto-deploys on push
git push origin main
```

---

## Advanced Option - Serverless Framework + AWS Lambda

### Step 1: Install Serverless Framework
```bash
npm install -g serverless
serverless plugin install -n serverless-plugin-tracing
npm install --save-dev serverless-offline
```

### Step 2: Set Environment Variables
```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
ODOO_URL=https://erp.elrace.com
ODOO_DB=your_db
ODOO_USERNAME=your_username
ODOO_PASSWORD=your_api_key
ADMIN_PASSWORD=your_admin_password
AUTONOMA_CLIENT_ID=your_client_id
AUTONOMA_SECRET_ID=your_secret_id
EOF
```

### Step 3: Deploy
```bash
# Make script executable
chmod +x deploy-lambda.sh

# Deploy to AWS Lambda
./deploy-lambda.sh

# Or manually:
npm run build
serverless deploy --verbose
```

### Step 4: Get Your Endpoint
```bash
# After deployment, get your API Gateway URL
aws apigateway get-rest-apis --query 'items[0].{name:name,id:id}' --output table

# Or check CloudFormation stack
aws cloudformation describe-stacks --stack-name security-management-system-dev --query 'Stacks[0].Outputs'
```

---

## Option 3: Docker + AWS ECR + ECS

### Step 1: Create ECR Repository
```bash
aws ecr create-repository --repository-name security-management-system --region us-east-1
```

### Step 2: Build and Push Image
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t security-management-system .

# Tag image
docker tag security-management-system:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/security-management-system:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/security-management-system:latest
```

### Step 3: Deploy to ECS
```bash
# Use AWS Console to create ECS cluster and service
# Or use AWS CLI:
aws ecs create-service \
  --cluster my-cluster \
  --service-name security-management-system \
  --task-definition security-management-system \
  --desired-count 1 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=3000
```

---

## Monitoring & Logs

### CloudWatch Logs
```bash
# View logs in real-time
aws logs tail /aws/lambda/security-management-system-api --follow

# View specific time range
aws logs filter-log-events \
  --log-group-name /aws/lambda/security-management-system-api \
  --start-time 1704067200000 \
  --end-time 1704153600000
```

### X-Ray Tracing
```bash
# View traces
aws xray get-trace-summaries --start-time 1704067200 --end-time 1704153600
```

---

## Cost Optimization

1. **Memory & Timeout Settings** (in serverless.yml)
   - 512MB-1024MB recommended
   - 30 seconds timeout

2. **Reserved Capacity**
   ```bash
   aws lambda put-provisioned-concurrency-config \
     --function-name security-management-system-api \
     --provisioned-concurrent-executions 5
   ```

3. **Use RDS Proxy** for database connections:
   ```bash
   aws rds-proxy create-db-proxy \
     --db-proxy-name security-management-system-proxy
   ```

---

## Troubleshooting

### "502 Bad Gateway" Error
```bash
# Check Lambda logs
aws logs tail /aws/lambda/security-management-system-api --follow

# Increase memory
# Edit serverless.yml: memorySize: 2048
serverless deploy
```

### "Function timeout"
```bash
# Increase timeout in serverless.yml
timeout: 60  # 60 seconds

# Redeploy
serverless deploy
```

### Environment variables not loaded
```bash
# Verify in Lambda console or via CLI
aws lambda get-function-configuration \
  --function-name security-management-system-api \
  --query 'Environment.Variables'
```

---

## Rollback Deployment

```bash
# List previous deployments
serverless info

# Rollback to previous version
aws lambda update-function-code \
  --function-name security-management-system-api \
  --s3-bucket your-bucket \
  --s3-key previous-deployment.zip
```

---

## Security Best Practices

1. ✅ Use IAM roles (never hardcode credentials)
2. ✅ Store secrets in AWS Secrets Manager
3. ✅ Enable VPC for RDS access
4. ✅ Use API Gateway API keys & throttling
5. ✅ Enable CloudTrail for audit logging
6. ✅ Set up CloudWatch alarms

---

## Support & Resources

- AWS Amplify Docs: https://docs.amplify.aws
- Serverless Framework: https://www.serverless.com
- Next.js Deployment: https://nextjs.org/docs/deployment
- AWS Lambda: https://docs.aws.amazon.com/lambda/
