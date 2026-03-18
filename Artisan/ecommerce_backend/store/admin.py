from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.conf import settings
from .models import (
    User, Order, Payments, Product, CartItem,
    ProductImage, Category, Shipments, Wishlist,
    SellerProfile, SellerAccount, OrderItem
)

# Register custom user with phone_number
class CustomUserAdmin(UserAdmin):
    model = User
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('phone_number',)}),
    )
    list_display = ['username', 'email', 'first_name', 'last_name', 'phone_number', 'is_staff']
    search_fields = ['username', 'email', 'phone_number']

admin.site.register(User, CustomUserAdmin)

# Register other models
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_price', 'status', 'created_at', 'seller_account']
    list_filter = ['status', 'created_at', 'seller_account']
    search_fields = ['user__username', 'status']

admin.site.register(Product)
admin.site.register(CartItem)
admin.site.register(ProductImage)
admin.site.register(Category)
admin.site.register(Wishlist)
admin.site.register(SellerProfile)
admin.site.register(SellerAccount)
admin.site.register(OrderItem)
admin.site.register(Payments)
admin.site.register(Shipments)


