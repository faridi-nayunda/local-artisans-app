from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckSellerAccountView, MessageViewSet, ProductApprovalView, SellerAccountView, SellerProductDetailView, SellerProductListCreateView, check_seller, create_order, create_payment, create_shipment, register_user, resend_otp, verify_otp, verify_password
from . import views
from .views import PasswordResetRequestView, PasswordResetConfirmView
from store.views import (
    add_to_cart, get_cart, remove_from_cart,
    ProductListCreateView, ProductDetailView, OrderViewSet, getRoutes
)
from .views import CategoryViewSet, WishlistViewSet
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import MyTokenObtainPairView
from .views import ProductSearchSuggestionsView
from .views import SellerProfileView
# Register viewsets API with DRF router
router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'messages', MessageViewSet, basename='messages')

urlpatterns = [
    # Include order routes from DefaultRouter
    path('', include(router.urls)),  
    
    # Other API routes
    path('', getRoutes, name="api-overview"),

    # OTP Registration & Verification
    path('register/', register_user, name='register'),
    path('seller-account/', SellerAccountView.as_view(), name='seller-account'),
    path('seller-profile/', SellerProfileView.as_view(), name='seller-profile'),
    path('verify-password/', verify_password, name='password-verification'),
    path('verify-otp/', verify_otp),
    path('resend-otp/', resend_otp),

    path('check-seller/', check_seller, name='check-seller'),
    path('check-seller-account/', CheckSellerAccountView.as_view()),

    path('orders/user-orders/', OrderViewSet.as_view({'get': 'user_orders'}), name='user-orders'),
    path('orders/<int:pk>/', OrderViewSet.as_view({'get': 'get_queryset'}), name='new-orders'),
    
   # admin
    path('admin/products/<int:pk>/approve/', ProductApprovalView.as_view()),

    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Products
    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('seller/products/', SellerProductListCreateView.as_view(), name='seller-product-list'),
    path('seller/products/<int:pk>/', SellerProductDetailView.as_view(), name='seller-product-detail'),
    # path('products/<int:pk>/upload-images/', UploadProductImages.as_view()),
    # path('products/search/', ProductListCreateView.as_view(), name='product-search'),
    path('products/search-suggestions/', ProductSearchSuggestionsView.as_view(), name='product-search-suggestions'),

    # Cart 
    path('cart/', get_cart, name="get_cart"),
    path('cart/add/', add_to_cart, name="add_to_cart"),
    path('cart/items/<int:item_id>/', views.update_cart_item, name='update-cart-item'),
    path('cart/remove/<int:item_id>/', remove_from_cart, name="remove_from_cart"),

    # Checkout
    path('shipments/', create_shipment, name="shipments"),
    path('payments/', create_payment, name="payments"),
    path('checkout/', create_order, name="checkout"),
    # path('addresses/', get_saved_addresses, name="saved-addresses"),

    
    # Password Reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
