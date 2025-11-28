# Database Fix Instructions

## Problem
The `storybook_message` table doesn't exist in the database, even though the migration shows as applied. This is causing the 500 error when trying to send messages.

## Solution: Reset and Recreate Database

### Step 1: Stop the Django Server
**IMPORTANT**: Stop the Django development server if it's running
- Press `Ctrl+C` in the terminal where the server is running
- Or close the terminal

### Step 2: Backup Current Database
```bash
cd backend
copy db.sqlite3 db.sqlite3.backup
```

### Step 3: Delete Old Database
```bash
del db.sqlite3
```

### Step 4: Run Migrations
```bash
python manage.py migrate
```

This will create a fresh database with all tables including `storybook_message`.

### Step 5: Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### Step 6: Recreate Test Users

Run this Python script:
```bash
python create_test_users.py
```

Or manually create users through the Django admin or registration.

## Alternative: Manual Table Creation

If you want to keep existing data, you can try to manually create just the Message table:

1. Stop Django server
2. Open SQLite database:
   ```bash
   sqlite3 db.sqlite3
   ```

3. Run this SQL:
   ```sql
   CREATE TABLE "storybook_message" (
       "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
       "content" text NOT NULL,
       "is_read" bool NOT NULL,
       "created_at" datetime NOT NULL,
       "receiver_id" bigint NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
       "sender_id" bigint NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
   );
   
   CREATE INDEX "storybook_message_receiver_id_cfdb3e_idx" ON "storybook_message" ("receiver_id", "is_read");
   CREATE INDEX "storybook_message_sender_id_idx" ON "storybook_message" ("sender_id", "receiver_id");
   ```

4. Exit SQLite: `.exit`

## After Fix

Once the database is fixed:
1. Start the Django server: `python manage.py runserver`
2. Log in as johndoe or aria
3. Make sure they're friends (use the Social page to send/accept friend request)
4. Try sending a message - it should work now!

## Current Users to Recreate

- **johndoe** (john@gmail.com)
- **aria** (aria@gmail.com)

Make sure to make them friends after creation!
