import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Check the max_length of cover_image field
field = Story._meta.get_field('cover_image')
print(f'cover_image field type: {type(field).__name__}')
print(f'cover_image max_length: {field.max_length}')
print(f'cover_image blank: {field.blank}')
print(f'cover_image null: {field.null}')
print(f'cover_image default: {field.default}')
