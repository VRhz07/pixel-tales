"""
Reset the database and recreate with current users
"""
import os
import shutil

# Backup database
db_file = 'db.sqlite3'
if os.path.exists(db_file):
    backup_file = 'db.sqlite3.backup'
    shutil.copy2(db_file, backup_file)
    print(f"✅ Database backed up to {backup_file}")
    
    # Delete old database
    os.remove(db_file)
    print(f"🗑️  Deleted old database")

print("\n📝 Now run these commands:")
print("  1. python manage.py migrate")
print("  2. python manage.py createsuperuser (if needed)")
print("\n💡 Your users (johndoe and aria) will need to be recreated")
print("   Or restore from backup if needed: copy db.sqlite3.backup db.sqlite3")
