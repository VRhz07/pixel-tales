import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.core.management import call_command
import io

output = io.StringIO()
call_command(
    'dumpdata',
    natural_foreign=True,
    natural_primary=True,
    exclude=['contenttypes', 'auth.Permission'],
    stdout=output
)

with open('datadump.json', 'w', encoding='utf-8') as f:
    f.write(output.getvalue())

print("✅ Dump complete: datadump.json")