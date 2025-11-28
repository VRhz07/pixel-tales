import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

# Test a Pollinations.ai URL
test_url = "https://image.pollinations.ai/prompt/WATERCOLOR%20BOOK%20COVER%20ART%2C%20CORRECT%20ANATOMY%2C%20proper%20proportions%2C%20well-drawn%20limbs%2C%20soft%20edges%2C%20artistic%20brushstrokes%2C%20pastel%20colors%2C%20traditional%20watercolor%20medium%2C%20hand-painted%20children's%20book%20cover%2C%20beautiful%20atmospheric%20art%2C%20professional%20quality%2C%20Featuring%3A%20Nia%20is%20a%20young%20Filipino%20girl%20with%20warm%20brown%20skin%2C%20long%20black%20hair%20in%20a%20ponytail%2C%20bright%20curious%20eyes%2C%20wearing%20a%20simple%20colorful%20dress.%20Color%20palette%3A%20Warm%20earth%20tones%2C%20vibrant%20greens%2C%20soft%20blues%2C%20golden%20yellows.%20BOOK%20COVER%20COMPOSITION%2C%20main%20character%20prominently%20featured%20in%20heroic%20or%20inviting%20pose%2C%20engaging%20viewer%2C%20dynamic%20layout%2C%20environmental%20elements%20suggesting%20story%20setting%2C%20attractive%20and%20professional%20book%20cover%20design%2C%20balanced%20composition%20with%20space%20for%20title%20text%20at%20top%20or%20bottom.%20Story%20theme%3A%20Isang%20batang%20babae%20na%20nakahanap%20ng%20mahiwagang%20dugong%20na%20may%20kakayahang%20magbigay%20ng%20mga%20hiling.%20Title%3A%20%22Si%20Nia%20at%20ang%20Mahiwagang%20Dugong%22.%20CRITICAL%20QUALITY%3A%20correct%20anatomy%2C%20proper%20proportions%2C%20accurate%20limb%20count%2C%20well-drawn%20hands%20and%20feet%2C%20symmetrical%20body%2C%20professional%20character%20design.%20Professional%20children's%20book%20cover%20illustration%2C%20eye-catching%20design%2C%20inviting%20and%20appealing%20to%20children%2C%20masterpiece%20quality%2C%20best%20quality%2C%20high%20resolution%20cover%20art%2C%20marketable%20book%20cover%2C%20space%20for%20title%20text%20overlay%2C%20detailed%20background%20suggesting%20story%20world%2C%20character%20in%20engaging%20pose%2C%20safe%20for%20children%2C%20no%20text%20or%20words%20in%20image.%20NEGATIVE%20PROMPTS%20TO%20AVOID%3A%20extra%20limbs%2C%20extra%20arms%2C%20extra%20legs%2C%20extra%20fingers%2C%20deformed%20hands%2C%20bad%20anatomy%2C%20missing%20limbs%2C%20poorly%20drawn%20hands%2C%20mutated%20hands%2C%20fused%20fingers%2C%20distorted%20body%2C%20photorealistic%2C%20realistic%20photo%2C%20photograph%2C%20plain%20background%2C%20boring%20composition%2C%20generic%20stock%20image%2C%20low%20quality%2C%20worst%20quality%2C%20blurry%2C%20deformed%2C%20disfigured%2C%20mutation%2C%20gross%20proportions%2C%20malformed%2C%20ugly%2C%20bad%20quality?width=512&height=683&seed=24800"

print(f"URL length: {len(test_url)}")
print(f"URL preview: {test_url[:100]}...")

validator = URLValidator()
try:
    validator(test_url)
    print("✅ URL is valid according to Django URLValidator")
except ValidationError as e:
    print(f"❌ URL validation failed: {e}")
    print(f"Error messages: {e.messages}")
