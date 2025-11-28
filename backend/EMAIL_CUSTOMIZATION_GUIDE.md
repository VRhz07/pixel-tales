# 🎨 Email Template Customization Guide

## 📧 Email Template Location

**File:** `backend/storybook/email_service.py`

---

## ✅ What I've Already Changed

All "Imaginary Worlds" branding has been replaced with **"PixelTales"**!

### Changes Made:
- ✅ Email subject lines
- ✅ Email headers (📚 → 🎨 PixelTales)
- ✅ Welcome messages
- ✅ Footer copyright
- ✅ Both verification and password reset emails

---

## 🎨 How to Customize Further

### 1. **Change Colors**

**Lines 54-55 & 201-202** (Header gradient):
```python
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    # Change to your brand colors:
    # background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
}
```

**Lines 67-68** (Code box border):
```python
.code-box {
    border: 2px dashed #667eea;
    # Change to match your brand:
    # border: 2px dashed #FF6B6B;
}
```

**Lines 77** (Code text color):
```python
.code {
    color: #667eea;
    # Change to your brand color:
    # color: #FF6B6B;
}
```

---

### 2. **Change Text Content**

**Lines 102-104** (Welcome message):
```python
<h2>Hello {user_name}! 👋</h2>
<p>Welcome to PixelTales! We're excited to have you join our creative storytelling community.</p>
<p>To complete your registration, please enter the verification code below:</p>
```

**Lines 112** (Disclaimer):
```python
<p>If you didn't create an account with PixelTales, please ignore this email.</p>
```

**Lines 114-116** (Security warning):
```python
<div class="warning">
    <strong>⚠️ Security Tip:</strong> Never share this code with anyone. Our team will never ask for your verification code.
</div>
```

---

### 3. **Change Subject Lines**

**Line 38** (Verification email):
```python
subject = "Verify Your Email - PixelTales"
# Change to:
# subject = "🎨 Verify Your PixelTales Account"
```

**Line 186** (Password reset email):
```python
subject = "Password Reset Code - PixelTales"
# Change to:
# subject = "🔒 Reset Your PixelTales Password"
```

---

### 4. **Change Emojis**

**Line 98** (Header emoji):
```python
<h1>🎨 PixelTales</h1>
# Change to any emoji:
# <h1>📚 PixelTales</h1>  # Book
# <h1>✨ PixelTales</h1>  # Sparkles
# <h1>🌟 PixelTales</h1>  # Star
# <h1>🎭 PixelTales</h1>  # Theater
```

**Line 102** (Greeting emoji):
```python
<h2>Hello {user_name}! 👋</h2>
# Change to:
# <h2>Hello {user_name}! 🎉</h2>
# <h2>Hello {user_name}! ✨</h2>
```

---

### 5. **Change Footer**

**Lines 118-121**:
```python
<div class="footer">
    <p>© 2024 PixelTales. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
</div>
```

**Change to include links:**
```python
<div class="footer">
    <p>© 2024 PixelTales. All rights reserved.</p>
    <p>Need help? Visit <a href="https://pixeltales.com/support">Support Center</a></p>
    <p style="margin-top: 10px;">
        <a href="https://pixeltales.com">Website</a> | 
        <a href="https://pixeltales.com/terms">Terms</a> | 
        <a href="https://pixeltales.com/privacy">Privacy</a>
    </p>
</div>
```

---

### 6. **Add Your Logo**

**Add after line 97** (in the header):
```python
<div class="header">
    <img src="https://yoursite.com/logo.png" alt="PixelTales Logo" style="width: 100px; margin-bottom: 20px;">
    <h1>🎨 PixelTales</h1>
    <p>Email Verification</p>
</div>
```

---

### 7. **Change Font**

**Lines 46**:
```python
body {
    font-family: Arial, sans-serif;
    # Change to:
    # font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    # font-family: 'Comic Sans MS', cursive; (fun for kids!)
    # font-family: 'Georgia', serif; (elegant)
}
```

---

## 🎯 Common Customization Examples

### Example 1: Fun & Playful Theme
```python
.header {
    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%);
}
.code {
    color: #FF6B6B;
}
<h1>🎨 PixelTales Adventures!</h1>
```

### Example 2: Professional Theme
```python
.header {
    background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
}
.code {
    color: #3498DB;
}
<h1>PixelTales</h1>  # No emoji
```

### Example 3: Kids-Friendly Theme
```python
.header {
    background: linear-gradient(135deg, #FFA07A 0%, #98D8C8 100%);
}
body {
    font-family: 'Comic Sans MS', cursive, sans-serif;
}
<h1>✨ Welcome to PixelTales! 🌈</h1>
```

---

## 📝 Plain Text Version

Don't forget to update the plain text version too!

**Lines 127-139** (Verification email plain text):
```python
text_content = f"""
Hello {user_name}!

Welcome to PixelTales!

Your verification code is: {verification_code}

This code will expire in {settings.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes.

If you didn't create an account, please ignore this email.

© 2024 PixelTales
"""
```

**Lines 262-272** (Password reset plain text):
```python
text_content = f"""
Hello {user_name}!

Password Reset Code: {reset_code}

This code will expire in {settings.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes.

If you didn't request this, please ignore this email.

© 2024 PixelTales
"""
```

---

## 🔄 After Making Changes

### 1. Save the file
### 2. Restart Django server:
```bash
# Stop current server (Ctrl+C)
cd backend
python manage.py runserver
```

### 3. Test the new email:
```bash
# Register a new user or use resend feature
```

---

## 🎨 Advanced: Create Email Templates in SendGrid

For even more control, you can:

1. Go to SendGrid Dashboard
2. Navigate to "Email API" → "Dynamic Templates"
3. Create a visual template using drag & drop
4. Use template ID in your code instead of HTML strings

**Benefits:**
- Visual editor (no coding needed)
- Version control in SendGrid
- A/B testing support
- Analytics tracking

---

## 💡 Tips

1. **Test your changes** - Send test emails before going live
2. **Keep it simple** - Too much styling can break in email clients
3. **Mobile responsive** - Test on mobile devices
4. **Check spam score** - Use tools like mail-tester.com
5. **Brand consistency** - Match your website colors and fonts

---

## 🎉 Your Customizations Are Live!

The email templates now use **PixelTales branding** with:
- ✅ 🎨 PixelTales logo/emoji
- ✅ Updated welcome messages
- ✅ PixelTales copyright
- ✅ Professional styling
- ✅ Security warnings

**Ready to send beautiful branded emails!** 🚀

---

## 📚 Related Files

- `backend/storybook/email_service.py` - Email templates
- `backend/.env` - Email configuration
- `backend/storybookapi/settings.py` - SendGrid settings

---

**Need more help? Check the SendGrid documentation or ask!** 💬
