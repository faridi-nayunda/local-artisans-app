from collections import defaultdict
from django.forms import ValidationError
from django.utils import timezone
from django.shortcuts import get_object_or_404, render
from django.shortcuts import render
# from jsonschema import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import generics, permissions

from store.utils.utils import generate_otp, send_otp_email
from .models import OrderItem, Payments, Product, ProductImage, SellerAccount, Shipments
from .serializers import PaymentSerializer, ProductSerializer, ShipmentSerializer
from store.models import CartItem, Product, Order
from store.serializers import CartItemSerializer, OrderSerializer
from rest_framework import viewsets, permissions
from store.models import User
from django.conf import settings
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions
from .serializers import SellerProfileSerializer, SellerAccountSerializer
from .models import SellerProfile





class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password")

            user = authenticate(username=user.username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password")

            data = super().validate({"username": user.username, "password": password})
            data["username"] = user.username
            return data
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'")

    # Override fields so the frontend can send 'email' instead of 'username'
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.EmailField()
        self.fields.pop('username')

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token['phone_number'] = user.phone_number
        token['role'] = user.role
        token['is_staff'] = user.is_staff

        return token

    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# API VIEWS
@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/token',
        '/api/token/refresh',
    ] 

    return Response(routes)

# REGISTER VIEW with password strength validation
import re
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .serializers import RegisterSerializer

from django.utils import timezone


@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        # Save user using serializer logic
        user = serializer.save()
        user.is_active = False  # Deactivate until OTP is verified
        user.otp_code = generate_otp()
        user.otp_created_at = timezone.now()
        user.save()

        send_otp_email(user.email, user.otp_code)

        return Response({
            'message': 'User registered. OTP sent to email.',
            'user': {
                'username': user.username,  # Still available
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# VERIFY OTP
@api_view(['POST'])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    try:
        user = User.objects.get(email=email)

        if user.is_active:
            return Response({'message': 'Account is already verified.'}, status=400)

        if user.is_otp_expired():
            return Response({'error': 'OTP expired. Please request a new one.'}, status=400)

        if user.otp_code != otp:
            return Response({'error': 'Invalid OTP.'}, status=400)

        # Activate the user
        user.is_active = True
        user.otp_code = None
        user.otp_created_at = None
        user.save()

        # ✅ Use your custom token serializer
        serializer = MyTokenObtainPairSerializer()
        tokens = serializer.get_token(user)

        return Response({
            'message': 'Account verified successfully.',
            'access_token': str(tokens.access_token),
            'refresh_token': str(tokens),
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    

#RESEND OTP
from datetime import timedelta
@api_view(['POST'])
def resend_otp(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        if user.is_active:
            return Response({'message': 'Account is already verified.'}, status=400)
        
        if user.otp_created_at and timezone.now() < user.otp_created_at + timedelta(seconds=60):
            return Response({'error': 'Please wait before requesting a new OTP.'}, status=429)

        from .utils import generate_otp, send_otp_email
        user.otp_code = generate_otp()
        user.otp_created_at = timezone.now()
        user.save()

        send_otp_email(user.email, user.otp_code)
        return Response({'message': 'A new OTP has been sent to your email.'}, status=200)

    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)




# SELLER ACCOUNT
class SellerAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'seller_account'):
            return Response(
                {'error': 'Seller account already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SellerAccountSerializer(data=request.data)
        if serializer.is_valid():
            seller_account = serializer.save(user=request.user)

            # Update user's role to 'seller'
            user = request.user
            user.role = 'seller'
            user.save()

            return Response(
                {
                    'message': 'Seller account created successfully',
                    'seller_account_id': seller_account.id,  # Add this
                    'next_step': 'complete_profile'
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# SELLER PROFILE
class SellerProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_seller_account(self, user):
        """Helper to get seller account or None"""
        return getattr(user, 'seller_account', None)

    def get_profile(self, seller_account):
        """Helper to get profile or None"""
        return getattr(seller_account, 'profile', None)

    def validate_seller_account(self):
        """Centralized validation for seller account"""
        seller_account = self.get_seller_account(self.request.user)
        if not seller_account:
            raise ValidationError(
                {'error': 'Seller account does not exist'},
                code=status.HTTP_400_BAD_REQUEST
            )
        return seller_account

    def get(self, request):
        try:
            seller_account = self.validate_seller_account()
            profile = self.get_profile(seller_account)
            if not profile:
                return Response(
                    {'detail': 'Profile not found.'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = SellerProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except ValidationError as e:
            return Response(e.detail, status=e.code)

    def post(self, request):
        try:
            seller_account = self.validate_seller_account()
            
            if hasattr(seller_account, 'profile'):
                return Response(
                    {'error': 'Profile already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create mutable copy and add seller_account
            data = request.data.copy()
            data['seller_account'] = seller_account.id

            serializer = SellerProfileSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(
                {
                    'detail': 'Profile created successfully.',
                    'data': serializer.data
                }, 
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(e.detail, status=e.code)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def patch(self, request):
        try:
            seller_account = self.validate_seller_account()
            profile = self.get_profile(seller_account)
            
            if not profile:
                return Response(
                    {'error': 'Profile not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = SellerProfileSerializer(
                profile, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(
                {
                    'detail': 'Profile updated successfully.',
                    'data': serializer.data
                }, 
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(e.detail, status=e.code)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
# Check seller account
class CheckSellerAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        has_account = hasattr(request.user, 'seller_account')
        return Response({
            'has_account': has_account,
            'account_id': request.user.seller_account.id if has_account else None
        })
        
# verify-password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_password(request):
    password = request.data.get('password')
    user = authenticate(username=request.user.username, password=password)
    return Response({'valid': user is not None})

# check_seller
@api_view(['GET'])
def check_seller(request):
    email = request.query_params.get('email')
    exists = SellerProfile.objects.filter(business_email=email).exists()
    return Response({'exists': exists})



# Handle Product CRUD
from django.db.models import Count
from django.db.models import Q

# For Customers
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # queryset = Product.objects.annotate(likes=Count('wishlist')).all()
        queryset = Product.objects.filter(
            is_active=True,
            is_approved=True
        ).annotate(likes=Count('wishlist'))

        # Add seller filter if you want to show products from specific sellers
        seller_id = self.request.query_params.get('seller')
        if seller_id:
            queryset = queryset.filter(seller__id=seller_id)

        category_id = self.request.query_params.get('category')
        search_query = self.request.query_params.get('q')

        filters = Q()

        if self.request.path.endswith('/search/'):
            # Only return results if a query or category filter is provided
            if not search_query and not category_id:
                return Product.objects.none()

        if category_id:
            filters &= Q(category__id=category_id)

        if search_query:
            filters &= (
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query)
            )

        return queryset.filter(filters)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]  # Allow viewing without login

# For seller
from rest_framework.parsers import MultiPartParser, FormParser

class SellerProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user.seller_account)

    def perform_create(self, serializer):
        seller_account = self.request.user.seller_account
        # Set is_active=True by default, is_approved based on your business rules
        serializer.save(
            seller=seller_account,
            is_active=True,
            is_approved=True  # Set to False if you need admin approval
        )

class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        # Only allow access to products belonging to the current seller
        return Product.objects.filter(seller=self.request.user.seller_account)
    
# For Admin
from rest_framework.permissions import IsAdminUser

class ProductApprovalView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.is_approved = True
        product.save()
        return Response({"status": "approved"})
    
    def get(self, request):
        # List unapproved products
        products = Product.objects.filter(is_approved=False)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

# #For Deleting Products Image
# class ProductImageView(APIView):
#     parser_classes = [MultiPartParser, FormParser]
#     permission_classes = [IsAuthenticated]

#     def post(self, request, product_id):
#         try:
#             product = Product.objects.get(id=product_id, seller=request.user.seller_account)
            
#             # Handle image deletions
#             delete_ids = request.data.getlist('delete_images', [])
#             if delete_ids:
#                 product.images.filter(id__in=delete_ids).delete()
            
#             # Handle new image uploads
#             images = request.FILES.getlist('images', [])
#             for image in images:
#                 ProductImage.objects.create(product=product, image=image)
            
#             return Response({"detail": "Images updated successfully"}, status=status.HTTP_200_OK)
            
#         except Product.DoesNotExist:
#             return Response(
#                 {"error": "Product not found or you don't have permission"},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             return Response(
#                 {"error": str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#AUTO COMPLETE SEARCH
class ProductSearchSuggestionsView(APIView):
    def get(self, request, *args, **kwargs):
        search_query = request.query_params.get('q', '')
        
        if search_query:
            # Filter products based on search query (name, description, and category name)
            products = Product.objects.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__name__icontains=search_query)  # Matches category name as well
            ).values('id', 'name')  # Return only id and name for suggestions

            # Limit to the first 10 results
            products = products[:10]
            
            # Return products in the response
            return Response(products, status=status.HTTP_200_OK)

        return Response([], status=status.HTTP_400_BAD_REQUEST)


# Product Categories
from .serializers import CategorySerializer
from .models import Category

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# Add item to cart
@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))

    if not product_id:
        return Response({"error": "Product ID is required"}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    # Read session_key from request data if available
    session_key = request.data.get('session_key') or request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key

    if request.user.is_authenticated:
        cart_item, created = CartItem.objects.get_or_create(user=request.user, product=product)
    else:
        cart_item, created = CartItem.objects.get_or_create(session_key=session_key, product=product)

    if not created:
        cart_item.quantity += quantity
    cart_item.save()

    print(f"Cart item added: {cart_item}")  # For debug
    return Response({"message": "Added to cart"}, status=201)

# Update Item cart
@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_cart_item(request, item_id):
    try:
        # Get quantity from request data
        new_quantity = int(request.data.get('quantity', 1))
        
        if new_quantity < 1:
            return Response({"error": "Quantity must be at least 1"}, status=status.HTTP_400_BAD_REQUEST)

        # Handle both authenticated and guest users
        session_key = request.data.get('session_key', request.session.session_key)
        
        if request.user.is_authenticated:
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
        else:
            if not session_key:
                return Response({"error": "Session key required for guest users"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            cart_item = CartItem.objects.get(id=item_id, session_key=session_key)

        # Update quantity
        cart_item.quantity = new_quantity
        cart_item.save()

        # Return updated cart item
        serializer = CartItemSerializer(cart_item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    except CartItem.DoesNotExist:
        return Response({"error": "Cart item not found"}, 
                       status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({"error": "Invalid quantity value"}, 
                       status=status.HTTP_400_BAD_REQUEST)

# Get cart items
@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart(request):
    session_key = request.query_params.get('session_key') or request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key

    if request.user.is_authenticated:
        cart_items = CartItem.objects.filter(user=request.user)
    else:
        cart_items = CartItem.objects.filter(session_key=session_key)

    serializer = CartItemSerializer(cart_items, many=True, context={'request': request})
    return Response(serializer.data)

# Remove item from cart
@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_from_cart(request, item_id):
    session_key = request.data.get('session_key') or request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key

    try:
        if request.user.is_authenticated:
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
        else:
            cart_item = CartItem.objects.get(id=item_id, session_key=session_key)
        
        cart_item.delete()
        return Response({"message": "Item removed"}, status=200)
    except CartItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=404)

# Shipment view
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shipment(request):
    data = request.data.copy()
    data['shipping_cost'] = calculate_shipping_cost(data)  # helper function

    serializer = ShipmentSerializer(data=data)
    if serializer.is_valid():
        shipment = serializer.save()
        return Response({'shipment_id': shipment.id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def calculate_shipping_cost(data):
    country = data.get('shipping_country', 'Tanzania')
    base_price = 9.99
    if country == 'Kenya': base_price = 12.99
    elif country == 'Uganda': base_price = 14.99
    elif country == 'Rwanda': base_price = 15.99
    elif country == 'Burundi': base_price = 16.99
    return base_price

#Payments view
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    data = request.data.copy()

    # Extract card type based on number prefix (if method is 'card')
    if data.get('payment_method') == 'card':
        card_num = data.get('card_number', '')
        data['card_last4'] = card_num[-4:]
        data['card_type'] = 'visa' if card_num.startswith('4') else 'mastercard' if card_num.startswith('5') else 'unknown'

    serializer = PaymentSerializer(data=data)
    if serializer.is_valid():
        payment = serializer.save()
        return Response({'payment_id': payment.id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Creating Orders
from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_order(request):
    cart_items = CartItem.objects.filter(user=request.user)
    if not cart_items.exists():
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    shipment_id = request.data.get('shipment_id')
    payment_id = request.data.get('payment_id')

    if not shipment_id or not payment_id:
        return Response({'error': 'Shipment and Payment are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        shipment = Shipments.objects.get(id=shipment_id)
        payment = Payments.objects.get(id=payment_id)
    except:
        return Response({'error': 'Invalid shipment or payment ID'}, status=status.HTTP_400_BAD_REQUEST)

    orders = []
    seller_items = defaultdict(list)
    for item in cart_items:
        seller_items[item.product.seller].append(item)

    for seller, items in seller_items.items():
        total_price = sum(item.total_price() for item in items)
        order = Order.objects.create(
            user=request.user,
            seller_account=seller,
            total_price=total_price,
            shipment=shipment,
            payment=payment
        )
        for item in items:
            OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity, price=item.product.price)
        # Send email notification to the seller
        OrderViewSet()._send_order_email(order)
        orders.append(order)

    cart_items.delete()
    return Response({
        "message": f"{len(orders)} orders placed successfully",
        "order_ids": [o.id for o in orders]
    }, status=status.HTTP_201_CREATED)



# orders/views.py
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.db import transaction
from .models import Order, OrderItem, CartItem
from .serializers import OrderSerializer

class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        print(f"DEBUG: Filtering orders for user {user.id} ({user.username})")
        
        if user.is_staff:
            return super().get_queryset()
            
        if hasattr(user, 'seller_account'):
            from django.db.models import Q
            return Order.objects.filter(
                Q(seller_account=user.seller_account) |
                Q(items__product__seller=user.seller_account)
            ).distinct()
            
        return Order.objects.filter(user=user)
 
    # SEND ORDER EMAILS TO SELLER
    def _send_order_email(self, order):
        """Send email notification to seller about new order"""
        try:
            if not order.seller_account.user.email:
                print(f"ERROR: No email for seller {order.seller_account.user.username}")
                return False

            subject = f'New Order #{order.id} Received'
            context = {
                'order': order,
                'seller': order.seller_account.user,
                'site_url': settings.FRONTEND_URL,
                # 'order_id': order.id  # Explicitly pass order ID
            }
            
            # Plain text version
            message = render_to_string('emails/new_order.txt', context)
            # HTML version
            html_message = render_to_string('emails/new_order.html', context)
            
            # Print email for debugging (remove in production)
            print(f"Sending order email to {order.seller_account.user.email}")
            print(f"Email content:\n{message}")

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.seller_account.user.email],
                html_message=html_message,
                fail_silently=False  # Changed to False to catch errors
            )
            return True
            
        except Exception as e:
            print(f"Failed to send order email: {str(e)}")
            return False
        

   
    # UPDATE STATUSES VIEW
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status (for sellers, admin, or buyer for cancellation)"""
        print(f"Received update status request: {request.data}")  # Debugging
        order = self.get_object()
        new_status = request.data.get('status')
        user = request.user

        print(f"Current user: {user}, Order user: {order.user}")  # Debugging

        valid_statuses = ['completed', 'cancelled', 'pending', 'processing', 'shipped']

        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Valid options: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buyer cancels their own order
        if new_status == "cancelled" and user == order.user:
            if order.status in ["pending", "processing"]:
                order.status = "cancelled"
                order.save()
                self._send_status_email(order, new_status)
                return Response(OrderSerializer(order).data)
            else:
                return Response(
                    {"detail": "You can only cancel orders that are not yet shipped."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Admin or seller updates status
        is_admin = user.is_staff
        is_seller = order.seller_account and user == order.seller_account.user

        if not (is_admin or is_seller):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        order.status = new_status
        order.save()

        # Notify buyer if seller updated the status
        if is_seller:
            self._send_status_email(order, new_status)

        return Response(OrderSerializer(order).data)

    
    # SEND STATUSES EMAIL
    def _send_status_email(self, order, new_status):
        """Notify buyer about status change using HTML template"""
        status_display = dict(Order.STATUS_CHOICES).get(new_status, new_status)
        seller_name = (
            order.seller_account.user.username
            if order.seller_account and order.seller_account.user
            else "The Seller"
        )

        context = {
            "order": order,
            "status_display": status_display,
            "seller_name": seller_name,
            "current_year": timezone.now().year
        }

        plain_text = f"Hello {order.user.username},\n\nYour order #{order.id} status has been updated to: {status_display}.\n\nSeller: {seller_name}"
        html_message = render_to_string('emails/status_update.html', context)

        send_mail(
            subject=f'Your Order #{order.id} Status Update',
            message=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_message,
            fail_silently=True
        )


# MESSAGE VIEW
from django.db.models import Q, Max, F, Case, When, IntegerField
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from .models import Message
from .serializers import MessageSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-timestamp')
    
    
    def perform_create(self, serializer):
        # This will automatically set the sender to the current user
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def inbox(self, request):
        user = request.user
        
        # Get the latest message from each unique conversation pair
        latest_messages = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).annotate(
            other_user=Case(
                When(sender=user, then=F('receiver')),
                When(receiver=user, then=F('sender')),
                output_field=IntegerField()
            )
        ).values('other_user').annotate(
            latest_id=Max('id')
        ).order_by('-latest_id')
        
        # Get the actual message objects
        message_ids = [msg['latest_id'] for msg in latest_messages]
        messages = Message.objects.filter(id__in=message_ids).order_by('-timestamp')
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def thread(self, request, pk=None):
        original_message = self.get_object()
        user = request.user
        other_user = original_message.sender if original_message.sender != user else original_message.receiver
        
        messages = Message.objects.filter(
            (Q(sender=user) & Q(receiver=other_user)) |
            (Q(sender=other_user) & Q(receiver=user))
        ).order_by('timestamp')
        
        serializer = self.get_serializer(messages, many=True)
        return Response({
            'participant_names': [user.username, other_user.username],
            'messages': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        parent_message = self.get_object()
        
        # Set the receiver based on the parent message
        receiver = parent_message.sender if parent_message.sender != request.user else parent_message.receiver
        
        # Create a copy of request.data to avoid mutating the original
        data = request.data.copy()
        data['receiver'] = receiver.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # The create() method will handle setting the sender
        serializer.save()
        
        return Response(serializer.data)



# wishlist view
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Wishlist, Product
from .serializers import WishlistSerializer, ProductSerializer
from rest_framework import serializers

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.AllowAny]  # More secure

    def get_queryset(self):
        queryset = Wishlist.objects.filter(user=self.request.user)
        if not queryset.exists():
            return queryset  # Ensure the user’s wishlist is returned, even if it’s empty
        return queryset


    def perform_create(self, serializer):
        product = serializer.validated_data.get('product')
        if Wishlist.objects.filter(user=self.request.user, product=product).exists():
            raise serializers.ValidationError("This product is already in your wishlist.")
        serializer.save(user=self.request.user)


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        product = instance.product  # Save the product before deletion
        self.perform_destroy(instance)

        # After deleting from wishlist, return updated product likes count
        updated_likes = Wishlist.objects.filter(product=product).count()
        product_data = ProductSerializer(product).data
        product_data['likes'] = updated_likes

        return Response(product_data, status=status.HTTP_200_OK)



# PASSWORD RESET VIEW
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            # Create JWT reset token (valid for 1 hour)
            refresh = RefreshToken.for_user(user)
            reset_token = str(refresh.access_token)

            # Construct reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            # In production: Send email with reset link
            send_mail(
                'Password Reset Request',
                f'Use this token to reset your password: {reset_link}',
                'faridisuleimani076@gmail.com',
                [user.email],
                fail_silently=False,
            )
        
            return Response(
                {'message': 'Password reset link sent to your email'},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User with this email does not exist'},
                status=status.HTTP_400_BAD_REQUEST
            )

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['password']
        
        try:
            # Verify token before any changes
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)

            # Validate password strength
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                return Response(
                    {'error': e.messages},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Change password
            user.set_password(new_password)
            user.save()
            
            # Explicitly blacklist the used token
            try:
                RefreshToken.for_user(user).blacklist()
            except TokenError:
                pass
            
            return Response(
                {'message': 'Password reset successfully'},
                status=status.HTTP_200_OK
            )
            
        except (TokenError, User.DoesNotExist) as e:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
 
