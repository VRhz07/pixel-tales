#!/bin/bash

# Color codes for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Syncing to Render - Step by Step Guide"
echo "=========================================="
echo ""

# Step 1: Export profanity words
echo -e "${BLUE}Step 1: Exporting profanity words from local database...${NC}"
python export_profanity_words.py

if [ ! -f "profanity_words_export.json" ]; then
    echo "❌ Error: Export failed!"
    exit 1
fi

echo -e "${GREEN}✅ Export successful!${NC}"
echo ""

# Step 2: Git operations
echo -e "${BLUE}Step 2: Adding files to git...${NC}"
cd ..
git add .
git add backend/profanity_words_export.json

echo ""
echo -e "${BLUE}Step 3: Committing changes...${NC}"
git commit -m "Sync: XP system, collaborations, profanity words, and bug fixes"

echo ""
echo -e "${BLUE}Step 4: Pushing to GitHub (this will trigger Render deploy)...${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Error: Git push failed!"
    exit 1
fi

echo -e "${GREEN}✅ Code pushed successfully!${NC}"
echo ""

# Instructions for Render
echo "=========================================="
echo -e "${YELLOW}📋 NEXT STEPS - Run in Render Shell:${NC}"
echo "=========================================="
echo ""
echo "1. Wait for Render to finish deploying (check Render dashboard)"
echo ""
echo "2. Open Render Shell (Shell tab in Render dashboard)"
echo ""
echo "3. Run these commands:"
echo ""
echo -e "${GREEN}   # Run migrations${NC}"
echo "   python manage.py migrate"
echo ""
echo -e "${GREEN}   # Import profanity words${NC}"
echo "   python import_profanity_words.py"
echo ""
echo "4. (Optional) Backfill XP for existing users:"
echo ""
echo -e "${GREEN}   python manage.py shell${NC}"
echo ""
echo "   Then paste this:"
echo "   ---"
echo "   from django.contrib.auth.models import User"
echo "   from storybook.models import Story"
echo "   for user in User.objects.all():"
echo "       profile = user.profile"
echo "       stories = Story.objects.filter(author=user).count()"
echo "       published = Story.objects.filter(author=user, is_published=True).count()"
echo "       collabs = Story.objects.filter(is_collaborative=True, authors=user).count()"
echo "       xp = (stories * 100) + (published * 50) + (collabs * 50)"
echo "       if xp > 0:"
echo "           profile.add_experience(xp)"
echo "           print(f'{user.username}: +{xp} XP')"
echo "   exit()"
echo "   ---"
echo ""
echo "=========================================="
echo "✅ Local sync complete! Follow steps above in Render."
echo "=========================================="
