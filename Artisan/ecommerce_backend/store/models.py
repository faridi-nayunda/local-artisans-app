from django.utils import timezone
from datetime import timedelta
import random
from django.db import models
from django.conf import settings
# from store.models import Product 
from django.contrib.auth.models import AbstractUser

# Create your models here.

# USER MODEL

class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('seller', 'Seller'),
        ('admin', 'Admin'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    def is_otp_expired(self):
        if self.otp_created_at:
            return timezone.now() > self.otp_created_at + timedelta(minutes=10)
        return True  # treat as expired if not set

    def __str__(self):
        return self.username


# SELLER ACCOUNT
class SellerAccount(models.Model):
    """Core seller account information"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_account')
    business_email = models.EmailField(unique=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email

#SELLER PROFILE
class SellerProfile(models.Model):
    seller_account = models.OneToOneField(SellerAccount, on_delete=models.CASCADE, related_name='profile')
    
    # Business Info
    legal_name = models.CharField(max_length=255)
    business_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    business_address = models.TextField()
    business_email = models.EmailField(unique=True, blank=True, null=True)

    # Store Info
    store_name = models.CharField(max_length=255)
    store_logo = models.ImageField(upload_to='store_logos/', null=True, blank=True)
    store_description = models.TextField()

    # Payment Info
    bank_account = models.CharField(max_length=50)
    routing_number = models.CharField(max_length=50)

    # Verification
    government_id = models.FileField(upload_to='government_ids/')

    # Shipping Info
    ship_from_address = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.business_name

# Product category model
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
    
# Product model
class Product(models.Model):
    name = models.CharField(max_length=200)
    seller = models.ForeignKey(SellerAccount, on_delete=models.CASCADE, blank=True, null=True, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # Seller can toggle
    is_approved = models.BooleanField(default=False)  # Admin approval

    def __str__(self):
        return self.name
    
# Product Image model
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')

    def __str__(self):
        return f"{self.product.name} Image"
    

# Cart models
class CartItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"
    
    def total_price(self):
        return self.product.price * self.quantity  
    
# Order models
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    seller_account = models.ForeignKey(SellerAccount, on_delete=models.CASCADE, related_name='sales', null=True, blank=True)
    shipment = models.ForeignKey('Shipments', on_delete=models.CASCADE, blank=True, null=True)
    payment = models.ForeignKey('Payments', on_delete=models.CASCADE, blank=True, null=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    tracking_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"Order {self.id} - {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.tracking_number and self.status == 'shipped':
            self.tracking_number = self.generate_tracking_number()
        super().save(*args, **kwargs)

    def generate_tracking_number(self):
        prefix = "TZ"
        date_part = timezone.now().strftime("%y%m%d")
        random_part = str(random.randint(1000, 9999))
        return f"{prefix}{date_part}{random_part}"


# OrderItem
class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of purchase

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"

    def total_price(self):
        return self.price * self.quantity
    
#Payments Model
class Payments(models.Model):
    payment_method = models.CharField(max_length=50, blank=True)  # 'pesapal', 'card'
    payment_status = models.CharField(max_length=20, default='pending', blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    card_last4 = models.CharField(max_length=4, blank=True)
    card_type = models.CharField(max_length=20, blank=True) # visa, mastercard
   
    # order_tracking_id = models.CharField(max_length=100, blank=True, null=True)
    # merchant_reference = models.CharField(max_length=100, blank=True, null=True)


    def __str__(self):
        return self.payment_method


# Shipments Model
class Shipments(models.Model):
    shipping_full_name = models.CharField(max_length=100, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)
    shipping_address_line1 = models.CharField(max_length=100, blank=True)
    shipping_address_line2 = models.CharField(max_length=100, blank=True)
    shipping_city = models.CharField(max_length=50, blank=True)
    shipping_state = models.CharField(max_length=50, blank=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True)
    shipping_country = models.CharField(max_length=50, blank=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True) 

    def __str__(self):
        return f"{self.shipping_full_name}"
    

# wishlist model
class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

# MESSAGE MODEL
class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username} - {self.subject}"



# # ARTISANS REVIEWS
# class ArtisanReview(models.Model):
#     artisan = models.ForeignKey(ArtisanProfile, on_delete=models.CASCADE, related_name='reviews')
#     reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
#     rating = models.PositiveIntegerField()
#     comment = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Review by {self.reviewer} for {self.artisan.shop_name}"


