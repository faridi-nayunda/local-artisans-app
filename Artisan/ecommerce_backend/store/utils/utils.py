import random
from django.core.mail import send_mail
from django.conf import settings

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(user_email, otp):
    subject = "Verify your email - Local Artisans Platform"
    message = f"Your OTP code is {otp}. It will expire in 10 minutes."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_email])
