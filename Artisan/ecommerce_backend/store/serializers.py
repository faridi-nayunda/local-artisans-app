from django.conf import settings
from rest_framework import serializers
from .models import OrderItem, Payments, Product, ProductImage, CartItem, Order, Category, Shipments, SellerProfile, SellerAccount
# UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'role']


# RegisterSerializer (With Password Validation)
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'password']

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self, validated_data):
        # Generate a username without spaces
        base_username = f"{validated_data['first_name'].lower()}{validated_data['last_name'].lower()}"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            password=validated_data['password']
        )
        return user

# SELLER PROFILE SERIALIZER
class SellerProfileSerializer(serializers.ModelSerializer):
    seller_account = serializers.PrimaryKeyRelatedField(
        queryset=SellerAccount.objects.all(),
        required=False
    )
    store_logo = serializers.SerializerMethodField()
    
    class Meta:
        model = SellerProfile
        fields = '__all__'
        extra_kwargs = {
            'seller_account': {'write_only': True}
        }
    
    def get_store_logo(self, obj):
        if obj.store_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.store_logo.url)
            return f"{settings.BASE_URL}{obj.store_logo.url}"
        return None
    
# SELLER ACCOUNT SERIALIZER
class SellerAccountSerializer(serializers.ModelSerializer):
    profile = SellerProfileSerializer(read_only=True) 
    class Meta:
        model = SellerAccount
        fields = ['id', 'business_email', 'is_approved', 'created_at', 'profile']
        read_only_fields = ['id', 'is_approved', 'created_at']
        extra_kwargs = {
            'business_email': {'required': True}
        }

# ProductImageSerializer
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

# Product serializer
from .models import Wishlist
class ProductSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    likes = serializers.SerializerMethodField()  
    seller = serializers.PrimaryKeyRelatedField(read_only=True) 

    # Add this field for image uploads
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'category_name',
            'description',
            'price',
            'stock',
            'created_at',
            'images',
            'likes', 
            'seller',
            'uploaded_images',
        ]

        read_only_fields = ['is_approved', 'is_active']

    def get_likes(self, obj):
        return Wishlist.objects.filter(product=obj).count()
    
    def create(self, validated_data):
        # Remove uploaded_images from validated_data if present
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Create the product first
        product = Product.objects.create(**validated_data)
        
        # Create ProductImage instances for each uploaded image
        for image in uploaded_images:
            ProductImage.objects.create(product=product, image=image)
            
        return product

    def update(self, instance, validated_data):
        # Remove uploaded_images from validated_data if present
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Update the product fields
        instance = super().update(instance, validated_data)
        
        # Create ProductImage instances for each new image
        for image in uploaded_images:
            ProductImage.objects.create(product=instance, image=image)
            
        return instance
    
# Category serializer
class CategorySerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)  # Add this line

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'products']  # Add 'products' here


# CartItem serializer
class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_description = serializers.CharField(source='product.description', read_only=True)
    price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    category = serializers.CharField(source='product.category.name', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_description', 'price', 'quantity', 'image', 'total_price', 'category']

    def get_image(self, obj):
        if obj.product.images.exists():
            request = self.context.get('request')
            image_url = obj.product.images.first().image.url
            return request.build_absolute_uri(image_url) if request else image_url
        return None

    def get_total_price(self, obj):
        return obj.quantity * obj.product.price
    

#Shipping serializer
class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipments
        fields = '__all__'

#Payment Serializer
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payments
        fields = '__all__'


# OrderItem serializer
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_description = serializers.CharField(source='product.description', read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_description', 'product_name', 'quantity', 'price', 'image']

    def get_image(self, obj):
        if obj.product.images.exists():
            request = self.context.get('request')
            image_url = obj.product.images.first().image.url
            return request.build_absolute_uri(image_url) if request else image_url
        return None
    
#NESTED SELLERPROFILE SERIALIZER 
from .models import SellerAccount
class SellerAccountNestedSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile = SellerProfileSerializer(read_only=True)

    class Meta:
        model = SellerAccount
        fields = ['id', 'user', 'profile']

#ORDER SERIALIZER   
class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    shipment = ShipmentSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    seller_account = SellerAccountNestedSerializer(read_only=True)  # <--- changed
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'seller_account', 'username', 'items', 
            'total_price', 'created_at', 'status', 'tracking_number', 'shipment', 'payment'
        ]


# Wishlist serializer
from .models import Wishlist

class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'product']


# ResetPasswordRequest serializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)


# MESSAGE SERIALIZER
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 
                 'order', 'subject', 'body', 'timestamp', 'is_read']
        read_only_fields = ['sender', 'timestamp', 'is_read']

    def create(self, validated_data):
        # Set sender to current user
        validated_data['sender'] = self.context['request'].user
        
        # Ensure receiver exists in validated_data
        if 'receiver' not in validated_data:
            raise serializers.ValidationError({"receiver": "This field is required."})
            
        return super().create(validated_data)
    
    def validate_receiver(self, value):
        if value == self.context['request'].user:
            raise serializers.ValidationError("You cannot send a message to yourself.")
        return value