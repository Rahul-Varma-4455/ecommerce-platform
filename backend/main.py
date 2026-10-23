import jwt
import os

from fastapi import FastAPI, HTTPException, status, Depends,Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select,func

from backend.auth import create_access_token, decode_access_token
from backend.database import SessionLocal
from backend.models import User, Product,Category, Inventory,Cart,CartItem,Order,OrderItem,Payment
from backend.schemas import UserCreate, UserLogin, ProductCreate,InventoryCreate,InventoryUpdate,CartItemCreate,OrderStatusUpdate,UserRoleUpdate,ProductApprovalUpdate,ProductUpdate,ProductCreate,CartItemUpdate,UserStatusUpdate,PaymentCreate,PaymentVerify,PaymentCancel
from backend.security import hash_password, verify_password
from backend.payment_service import razorpay_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# --------------------------------------------------
# GET CURRENT LOGGED-IN USER
# --------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:
        payload = decode_access_token(token)

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    with SessionLocal() as session:

     user = session.scalar(
        select(User).where(User.id == int(user_id))
    )

    if not user:
       raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User not found"
       )

    if not user.is_active:
       raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User account is inactive"
       )

    return user   

# --------------------------------------------------
# ROLE-BASED ACCESS CONTROL
# --------------------------------------------------

def require_role(required_role: str):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )

        return current_user

    return role_checker


# --------------------------------------------------
# HOME / HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "E-Commerce API is running!"
    }


# --------------------------------------------------
# GET ALL USERS
# --------------------------------------------------

@app.get("/users")
def get_users():

    with SessionLocal() as session:

        users = session.scalars(
            select(User)
        ).all()

        return [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
            for user in users
        ]


# --------------------------------------------------
# REGISTER / CREATE USER
# --------------------------------------------------

@app.post("/users")
def create_user(user_data: UserCreate):

    with SessionLocal() as session:

        # Check if email already exists
        existing_user = session.scalar(
            select(User).where(
                User.email == user_data.email
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        # Hash password
        hashed_password = hash_password(
            user_data.password
        )

        # Create new user
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role="customer",
        )

        # Add user to database
        session.add(new_user)

        # Save changes
        session.commit()

        # Get generated ID
        session.refresh(new_user)

        return {
            "message": "User created successfully",
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
        }


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.post("/login")
def login(user_data: UserLogin):

    with SessionLocal() as session:

        # Find user by email
        user = session.scalar(
            select(User).where(
                User.email == user_data.email
            )
        )

        # User does not exist
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Verify password
        if not verify_password(
            user_data.password,
            user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Create JWT token
        access_token = create_access_token(
            user.id,
            user.role
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }


# --------------------------------------------------
# PROTECTED PROFILE ENDPOINT
# --------------------------------------------------

@app.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }


# --------------------------------------------------
# CUSTOMER-ONLY ENDPOINT
# --------------------------------------------------

@app.get("/customer/dashboard")
def customer_dashboard(
    current_user: User = Depends(
        require_role("customer")
    )
):

    return {
        "message": "Welcome to the customer dashboard!",
        "user": current_user.name,
        "role": current_user.role,
    }

@app.post("/payments/create")
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(require_role("customer"))
):
    with SessionLocal() as session:

        order = session.scalar(
            select(Order).where(
                Order.id == payment_data.order_id,
                Order.user_id == current_user.id
            )
        )

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        existing_payment = session.scalar(
            select(Payment).where(
                Payment.order_id == order.id
            )
        )

        if existing_payment:
            if existing_payment.status == "success":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Order has already been paid"
                )

            return {
                "message": "Payment already exists",
                "payment": {
                    "id": existing_payment.id,
                    "order_id": order.id,
                    "gateway_order_id": existing_payment.gateway_order_id,
                    "amount": float(existing_payment.amount),
                    "status": existing_payment.status,
                    "payment_gateway": existing_payment.payment_gateway
                },
                "razorpay": {
                    "key_id": os.getenv("RAZORPAY_KEY_ID"),
                    "order_id": existing_payment.gateway_order_id,
                    "amount": int(float(existing_payment.amount) * 100),
                    "currency": "INR"
                }
            }

        amount_in_paise = int(
            float(order.total_amount) * 100
        )

        razorpay_order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"shopsphere_order_{order.id}",
        })

        payment = Payment(
            order_id=order.id,
            payment_gateway="razorpay",
            gateway_order_id=razorpay_order["id"],
            amount=order.total_amount,
            status="created"
        )

        session.add(payment)
        session.commit()
        session.refresh(payment)

        return {
            "message": "Payment created successfully",
            "payment": {
                "id": payment.id,
                "order_id": order.id,
                "gateway_order_id": payment.gateway_order_id,
                "amount": float(payment.amount),
                "status": payment.status,
                "payment_gateway": payment.payment_gateway
            },
            "razorpay": {
                "key_id": os.getenv("RAZORPAY_KEY_ID"),
                "order_id": razorpay_order["id"],
                "amount": amount_in_paise,
                "currency": "INR"
            }
        }

@app.post("/payments/verify")
def verify_payment(
    payment_data: PaymentVerify,
    current_user: User = Depends(require_role("customer"))
):
    with SessionLocal() as session:

        # Find the customer's order
        order = session.scalar(
            select(Order).where(
                Order.id == payment_data.order_id,
                Order.user_id == current_user.id
            )
        )

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # Find the payment record
        payment = session.scalar(
            select(Payment).where(
                Payment.order_id == order.id
            )
        )

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )

        # Prevent paying an already successful order again
        if payment.status == "success":
            return {
                "message": "Payment already verified",
                "payment": {
                    "id": payment.id,
                    "order_id": order.id,
                    "status": payment.status,
                    "gateway_payment_id": payment.gateway_payment_id
                }
            }

        # Verify that the Razorpay order ID matches our database
        if payment.gateway_order_id != payment_data.razorpay_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay order ID does not match"
            )

        try:
            razorpay_client.utility.verify_payment_signature({
                "razorpay_order_id": payment_data.razorpay_order_id,
                "razorpay_payment_id": payment_data.razorpay_payment_id,
                "razorpay_signature": payment_data.razorpay_signature,
            })

        except Exception:
            payment.status = "failed"

            session.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed"
            )

        # Payment is genuine
        payment.gateway_payment_id = (
            payment_data.razorpay_payment_id
        )

        payment.status = "success"

        # Mark the ShopSphere order as confirmed
        order.status = "confirmed"

        session.commit()

        session.refresh(payment)
        session.refresh(order)

        return {
            "message": "Payment verified successfully",
            "payment": {
                "id": payment.id,
                "order_id": order.id,
                "gateway_order_id": payment.gateway_order_id,
                "gateway_payment_id": payment.gateway_payment_id,
                "amount": float(payment.amount),
                "status": payment.status,
                "payment_gateway": payment.payment_gateway
            },
            "order": {
                "id": order.id,
                "status": order.status,
                "total_amount": float(order.total_amount)
            }
        }

@app.post("/payments/cancel")
def cancel_payment(
    payment_data: PaymentCancel,
    current_user: User = Depends(require_role("customer"))
):
    with SessionLocal() as session:

        order = session.scalar(
            select(Order).where(
                Order.id == payment_data.order_id,
                Order.user_id == current_user.id
            )
        )

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        payment = session.scalar(
            select(Payment).where(
                Payment.order_id == order.id
            )
        )

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )

        if payment.status == "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Successful payment cannot be cancelled"
            )

        payment.status = "cancelled"

        order.status = "payment_pending"

        session.commit()
        session.refresh(payment)

        return {
            "message": "Payment marked as cancelled",
            "payment": {
                "id": payment.id,
                "order_id": payment.order_id,
                "status": payment.status
            },
            "order": {
               "id": order.id,
                "status": order.status
            }

        }
    
# --------------------------------------------------
# SELLER-ONLY ENDPOINT
# --------------------------------------------------

@app.get("/seller/dashboard")
def seller_dashboard(
    current_user: User = Depends(
        require_role("seller")
    )
):

    return {
        "message": "Welcome to the seller dashboard!",
        "user": current_user.name,
        "role": current_user.role,
    }

# --------------------------------------------------
# CREATE PRODUCT - SELLER ONLY
# --------------------------------------------------

@app.post("/products")
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(require_role("seller"))
):
    with SessionLocal() as session:
        category = session.get(Category, product_data.category_id)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        new_product = Product(
            name=product_data.name,
            description=product_data.description,
            price=product_data.price,
            category_id=product_data.category_id,
            seller_id=current_user.id,
            approval_status="pending",
            is_active=True
        )

        session.add(new_product)
        session.flush()

        new_inventory = Inventory(
            product_id=new_product.id,
            quantity=0,
            reorder_level=5
        )

        session.add(new_inventory)

        session.commit()
        session.refresh(new_product)

        return {
            "message": "Product created successfully",
            "product": {
                "id": new_product.id,
                "name": new_product.name,
                "description": new_product.description,
                "price": float(new_product.price),
                "category_id": new_product.category_id,
                "seller_id": new_product.seller_id,
                "approval_status": new_product.approval_status,
                "is_active": new_product.is_active,
                "inventory": {
                    "quantity": new_inventory.quantity,
                    "reorder_level": new_inventory.reorder_level
                }
            }
        }

# --------------------------------------------------
# GET PRODUCTS WITH SEARCH & FILTERING
# --------------------------------------------------

@app.get("/products")
def get_products(
    search: str | None = None,
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
   skip: int = Query(
        default=0,
        ge=0
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100
    ),
):

    with SessionLocal() as session:

        query = select(Product).where(
            Product.approval_status == "approved",
            Product.is_active == True
    )

        # Search by product name
        if search:
            query = query.where(
                Product.name.ilike(f"%{search}%")
            )

        # Filter by category
        if category_id:
            query = query.where(
                Product.category_id == category_id
            )

        # Minimum price
        if min_price is not None:
            query = query.where(
                Product.price >= min_price
            )

        # Maximum price
        if max_price is not None:
            query = query.where(
                Product.price <= max_price
            )

        products = session.scalars(
         query
         .offset(skip)
         .limit(limit)
        ).all()

        return [
            {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "category_id": product.category_id,
                "seller_id": product.seller_id,
                "approval_status": product.approval_status,
                "created_at": product.created_at,
                "updated_at": product.updated_at,
                "is_active": product.is_active,
            }
            for product in products
        ]

# --------------------------------------------------
# GET ALL CATEGORIES
# --------------------------------------------------

@app.get("/categories")
def get_categories():

    with SessionLocal() as session:

        categories = session.scalars(
            select(Category)
        ).all()

        return [
            {
                "id": category.id,
                "name": category.name,
                "description": category.description,
            }
            for category in categories
        ]


# --------------------------------------------------
# CREATE INVENTORY - SELLER ONLY
# --------------------------------------------------

@app.post("/inventory")
def create_inventory(
    inventory_data: InventoryCreate,
    current_user: User = Depends(
        require_role("seller")
    )
):

    with SessionLocal() as session:

        # Find the product
        product = session.get(
            Product,
            inventory_data.product_id
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        # Make sure the product belongs to this seller
        if product.seller_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage your own products",
            )

        # Check whether inventory already exists
        existing_inventory = session.scalar(
            select(Inventory).where(
                Inventory.product_id
                == inventory_data.product_id
            )
        )

        if existing_inventory:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Inventory already exists for this product",
            )

        # Create inventory
        new_inventory = Inventory(
            product_id=inventory_data.product_id,
            quantity=inventory_data.quantity,
            reorder_level=inventory_data.reorder_level,
        )

        session.add(new_inventory)
        session.commit()
        session.refresh(new_inventory)

        return {
            "message": "Inventory created successfully",
            "inventory": {
                "id": new_inventory.id,
                "product_id": new_inventory.product_id,
                "quantity": new_inventory.quantity,
                "reorder_level": new_inventory.reorder_level,
            },
        }

# --------------------------------------------------
# GET SELLER INVENTORY
# --------------------------------------------------

@app.get("/seller/inventory")
def get_seller_inventory(
    current_user: User = Depends(
        require_role("seller")
    )
):

    with SessionLocal() as session:

        products = session.scalars(
            select(Product).where(
                Product.seller_id == current_user.id
            )
        ).all()

        result = []

        for product in products:

            inventory = session.scalar(
                select(Inventory).where(
                    Inventory.product_id == product.id
                )
            )

            result.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "price": float(product.price),
                    "quantity": (
                        inventory.quantity
                        if inventory
                        else 0
                    ),
                    "reorder_level": (
                        inventory.reorder_level
                        if inventory
                        else 0
                    ),
                }
            )

        return result


# --------------------------------------------------
# UPDATE INVENTORY - SELLER ONLY
# --------------------------------------------------

@app.put("/inventory/{product_id}")
def update_inventory(
    product_id: int,
    inventory_data: InventoryUpdate,
    current_user: User = Depends(
        require_role("seller")
    )
):

    with SessionLocal() as session:

        # Find product
        product = session.get(
            Product,
            product_id
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        # Make sure this product belongs to the seller
        if product.seller_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage your own products",
            )

        # Find inventory
        inventory = session.scalar(
            select(Inventory).where(
                Inventory.product_id == product_id
            )
        )

        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found",
            )

        # Update inventory
        inventory.quantity = inventory_data.quantity
        inventory.reorder_level = inventory_data.reorder_level

        session.commit()
        session.refresh(inventory)

        return {
            "message": "Inventory updated successfully",
            "inventory": {
                "id": inventory.id,
                "product_id": inventory.product_id,
                "quantity": inventory.quantity,
                "reorder_level": inventory.reorder_level,
            },
        }


# --------------------------------------------------
# GET LOW-STOCK PRODUCTS - SELLER ONLY
# --------------------------------------------------

@app.get("/seller/inventory/low-stock")
def get_low_stock_inventory(
    current_user: User = Depends(
        require_role("seller")
    )
):

    with SessionLocal() as session:

        products = session.scalars(
            select(Product).where(
                Product.seller_id == current_user.id
            )
        ).all()

        low_stock_products = []

        for product in products:

            inventory = session.scalar(
                select(Inventory).where(
                    Inventory.product_id == product.id
                )
            )

            if inventory and inventory.quantity <= inventory.reorder_level:

                low_stock_products.append(
                    {
                        "product_id": product.id,
                        "product_name": product.name,
                        "quantity": inventory.quantity,
                        "reorder_level": inventory.reorder_level,
                        "status": "LOW STOCK",
                    }
                )

        return low_stock_products

# --------------------------------------------------
# GET SELLER PRODUCTS
# --------------------------------------------------
@app.get("/seller/products")
def get_seller_products(
    current_user: User = Depends(require_role("seller"))
):
    with SessionLocal() as session:

        products = session.scalars(
            select(Product)
            .where(Product.seller_id == current_user.id)
            .order_by(Product.id)
        ).all()

        return [
            {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "category_id": product.category_id,
                "approval_status": product.approval_status,
                "created_at": product.created_at,
                "updated_at": product.updated_at
            }
            for product in products
        ]

# --------------------------------------------------
# UPDATE SELLER PRODUCTS
# --------------------------------------------------
@app.put("/seller/products/{product_id}")
def update_seller_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(require_role("seller"))
):
    with SessionLocal() as session:

        product = session.get(Product, product_id)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Security check:
        # seller can update only their own product
        if product.seller_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own products"
            )

        # Check that category exists
        category = session.get(Category, product_data.category_id)

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

        product.name = product_data.name
        product.description = product_data.description
        product.price = product_data.price
        product.category_id = product_data.category_id
        # Any seller edit requires admin re-approval
        product.approval_status = "pending"

        session.commit()
        session.refresh(product)

        return {
            "message": "Product updated successfully",
            "product": {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "category_id": product.category_id,
                "seller_id": product.seller_id,
                "approval_status": product.approval_status,
                "created_at": product.created_at,
                "updated_at": product.updated_at
            }
        }
    
# --------------------------------------------------
# DELETE SELLER PRODUCTS
# --------------------------------------------------
@app.delete("/seller/products/{product_id}")
def delete_seller_product(
    product_id: int,
    current_user: User = Depends(require_role("seller"))
):
    with SessionLocal() as session:

        product = session.get(Product, product_id)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Seller can delete only their own product
        if product.seller_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own products"
            )

        # Already inactive
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is already inactive"
            )

        # Soft delete
        product.is_active = False

        session.commit()
        session.refresh(product)

        return {
            "message": "Product deactivated successfully",
            "product": {
                "id": product.id,
                "name": product.name,
                "is_active": product.is_active
            }
        }

# --------------------------------------------------
# ADD PRODUCT TO CART - CUSTOMER ONLY
# --------------------------------------------------

@app.post("/cart/items")
def add_to_cart(
    cart_item_data: CartItemCreate,
    current_user: User = Depends(
        require_role("customer")
    )
):

    with SessionLocal() as session:

        # ------------------------------------------
        # 1. Find the product
        # ------------------------------------------

        product = session.get(
            Product,
            cart_item_data.product_id
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        # ------------------------------------------
        # 2. Find inventory
        # ------------------------------------------

        inventory = session.scalar(
            select(Inventory).where(
                Inventory.product_id
                == cart_item_data.product_id
            )
        )

        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found for this product",
            )

        # ------------------------------------------
        # 3. Check available stock
        # ------------------------------------------

        if (
            cart_item_data.quantity
            > inventory.quantity
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough stock available",
            )

        # ------------------------------------------
        # 4. Find customer's cart
        # ------------------------------------------

        cart = session.scalar(
            select(Cart).where(
                Cart.user_id == current_user.id
            )
        )

        # ------------------------------------------
        # 5. Create cart if it doesn't exist
        # ------------------------------------------

        if not cart:

            cart = Cart(
                user_id=current_user.id
            )

            session.add(cart)
            session.flush()

        # ------------------------------------------
        # 6. Check whether product is already
        #    in the cart
        # ------------------------------------------

        existing_item = session.scalar(
            select(CartItem).where(
                CartItem.cart_id == cart.id,
                CartItem.product_id
                == cart_item_data.product_id,
            )
        )

        # ------------------------------------------
        # 7. Add or increase quantity
        # ------------------------------------------

        if existing_item:

            new_quantity = (
                existing_item.quantity
                + cart_item_data.quantity
            )

            if new_quantity > inventory.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not enough stock available",
                )

            existing_item.quantity = new_quantity

            cart_item = existing_item

        else:

            cart_item = CartItem(
                cart_id=cart.id,
                product_id=cart_item_data.product_id,
                quantity=cart_item_data.quantity,
            )

            session.add(cart_item)

        # ------------------------------------------
        # 8. Save
        # ------------------------------------------

        session.commit()
        session.refresh(cart_item)

        return {
            "message": "Product added to cart",
            "cart_item": {
                "id": cart_item.id,
                "cart_id": cart_item.cart_id,
                "product_id": cart_item.product_id,
                "quantity": cart_item.quantity,
            },
        }

# --------------------------------------------------
# GET CUSTOMER CART
# --------------------------------------------------

@app.get("/cart")
def get_cart(
    current_user: User = Depends(
        require_role("customer")
    )
):

    with SessionLocal() as session:

        # Find customer's cart
        cart = session.scalar(
            select(Cart).where(
                Cart.user_id == current_user.id
            )
        )

        # Cart doesn't exist
        if not cart:
            return {
                "cart_id": None,
                "items": [],
                "total": 0
            }

        # Find cart items
        cart_items = session.scalars(
            select(CartItem).where(
                CartItem.cart_id == cart.id
            )
        ).all()

        items = []
        total = 0

        for item in cart_items:

            product = session.get(
                Product,
                item.product_id
            )

            if not product:
                continue

            subtotal = float(product.price) * item.quantity

            items.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "price": float(product.price),
                    "quantity": item.quantity,
                    "subtotal": subtotal,
                }
            )

            total += subtotal

        return {
            "cart_id": cart.id,
            "items": items,
            "total": total,
        }

@app.delete("/cart/items/{product_id}")
def remove_cart_item(
    product_id: int,
    current_user: User = Depends(require_role("customer"))
):
    with SessionLocal() as session:
        cart = session.scalar(
            select(Cart).where(Cart.user_id == current_user.id)
        )

        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found"
            )

        cart_item = session.scalar(
            select(CartItem).where(
                CartItem.cart_id == cart.id,
                CartItem.product_id == product_id
            )
        )

        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in cart"
            )

        session.delete(cart_item)
        session.commit()

        return {
            "message": "Product removed from cart successfully"
        }

@app.put("/cart/items/{product_id}")
def update_cart_item(
    product_id: int,
    cart_data: CartItemUpdate,
    current_user: User = Depends(require_role("customer"))
):
    with SessionLocal() as session:
        cart = session.scalar(
            select(Cart).where(Cart.user_id == current_user.id)
        )

        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found"
            )

        cart_item = session.scalar(
            select(CartItem).where(
                CartItem.cart_id == cart.id,
                CartItem.product_id == product_id
            )
        )

        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in cart"
            )

        inventory = session.scalar(
            select(Inventory).where(
                Inventory.product_id == product_id
            )
        )

        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found for this product"
            )

        if cart_data.quantity > inventory.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough stock available"
            )

        cart_item.quantity = cart_data.quantity

        session.commit()
        session.refresh(cart_item)

        return {
            "message": "Cart quantity updated successfully",
            "product_id": cart_item.product_id,
            "quantity": cart_item.quantity
        }
# --------------------------------------------------
# PLACE ORDER / CHECKOUT - CUSTOMER ONLY
# --------------------------------------------------

@app.post("/orders")
def place_order(
    current_user: User = Depends(
        require_role("customer")
    )
):

    with SessionLocal() as session:

        try:
            # ------------------------------------------
            # 1. Find customer's cart
            # ------------------------------------------

            cart = session.scalar(
                select(Cart).where(
                    Cart.user_id == current_user.id
                )
            )

            if not cart:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty",
                )

            # ------------------------------------------
            # 2. Get cart items
            # ------------------------------------------

            cart_items = session.scalars(
                select(CartItem).where(
                    CartItem.cart_id == cart.id
                )
            ).all()

            if not cart_items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty",
                )

            # ------------------------------------------
            # 3. Check all products and inventory
            #    BEFORE changing anything
            # ------------------------------------------

            order_items_data = []
            total_amount = 0

            for cart_item in cart_items:

                product = session.get(
                    Product,
                    cart_item.product_id
                )

                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=(
                            f"Product {cart_item.product_id} "
                            "not found"
                        ),
                    )

                # Lock inventory row during transaction
                inventory = session.scalar(
                    select(Inventory)
                    .where(
                        Inventory.product_id
                        == product.id
                    )
                    .with_for_update()
                )

                if not inventory:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=(
                            f"Inventory not found for "
                            f"product {product.id}"
                        ),
                    )

                # Check stock
                if cart_item.quantity > inventory.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Not enough stock for "
                            f"{product.name}"
                        ),
                    )

                # Calculate subtotal
                subtotal = (
                    product.price
                    * cart_item.quantity
                )

                total_amount += subtotal

                order_items_data.append(
                    {
                        "product": product,
                        "inventory": inventory,
                        "quantity": cart_item.quantity,
                        "price": product.price,
                        "subtotal": subtotal,
                    }
                )

            # ------------------------------------------
            # 4. Create the order
            # ------------------------------------------

            new_order = Order(
                user_id=current_user.id,
                total_amount=total_amount,
                status="payment_pending",
            )

            session.add(new_order)

            # Generate order ID
            session.flush()

            # ------------------------------------------
            # 5. Create order items
            #    and reduce inventory
            # ------------------------------------------

            for item_data in order_items_data:

                order_item = OrderItem(
                    order_id=new_order.id,
                    product_id=item_data["product"].id,
                    quantity=item_data["quantity"],
                    price_at_purchase=item_data["price"],
                    subtotal=item_data["subtotal"],
                )

                session.add(order_item)

                # Reduce inventory
                item_data["inventory"].quantity -= (
                    item_data["quantity"]
                )

            # ------------------------------------------
            # 6. Clear customer's cart
            # ------------------------------------------

            for cart_item in cart_items:
                session.delete(cart_item)

            # ------------------------------------------
            # 7. Commit everything
            # ------------------------------------------

            session.commit()

            return {
                "message": "Order placed successfully",
                "order": {
                    "id": new_order.id,
                    "total_amount": float(
                        new_order.total_amount
                    ),
                    "status": new_order.status,
                },
            }

        except HTTPException:
            session.rollback()
            raise

        except Exception:
            session.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to place order",
            )

# --------------------------------------------------
# CUSTOMER ORDER HISTORY
# --------------------------------------------------

@app.get("/orders")
def get_my_orders(
    current_user: User = Depends(
        require_role("customer")
    )
):
    with SessionLocal() as session:

        orders = session.scalars(
            select(Order)
            .where(Order.user_id == current_user.id)
            .order_by(Order.id.desc())
        ).all()

        result = []

        for order in orders:

            order_items = session.scalars(
                select(OrderItem)
                .where(
                    OrderItem.order_id == order.id
                )
            ).all()

            payment = session.scalar(
                select(Payment)
                .where(
                    Payment.order_id == order.id
                )
            )

            items = []

            for item in order_items:

                product = session.get(
                    Product,
                    item.product_id
                )

                items.append({
                    "product_id": item.product_id,
                    "product_name": (
                        product.name
                        if product
                        else "Unknown Product"
                    ),
                    "quantity": item.quantity,
                    "price_at_purchase": float(
                        item.price_at_purchase
                    ),
                    "subtotal": float(
                        item.subtotal
                    ),
                })

            result.append({
                "order_id": order.id,
                "total_amount": float(
                    order.total_amount
                ),
                "status": order.status,
                "payment_status": (
                    payment.status
                    if payment
                    else None
                ),
                "items": items,
            })

        return {
            "orders": result
        }

@app.post("/orders/{order_id}/cancel")
def cancel_my_order(
    order_id: int,
    current_user: User = Depends(
        require_role("customer")
    )
):
    with SessionLocal() as session:

        try:
            order = session.scalar(
                select(Order)
                .where(
                    Order.id == order_id,
                    Order.user_id == current_user.id
                )
                .with_for_update()
            )

            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )

            if order.status != "payment_pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Only payment-pending orders "
                        "can be cancelled"
                    )
                )

            payment = session.scalar(
                select(Payment).where(
                    Payment.order_id == order.id
                )
            )

            if payment and payment.status == "success":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A successful payment cannot be cancelled"
                )

            # Release the inventory reserved by this order.
            order_items = session.scalars(
                select(OrderItem).where(
                    OrderItem.order_id == order.id
                )
            ).all()

            for item in order_items:

                inventory = session.scalar(
                    select(Inventory)
                    .where(
                        Inventory.product_id
                        == item.product_id
                    )
                    .with_for_update()
                )

                if not inventory:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=(
                            f"Inventory not found for "
                            f"product {item.product_id}"
                        )
                    )

                inventory.quantity += item.quantity

            order.status = "cancelled"

            if payment:
                payment.status = "cancelled"

            session.commit()

            return {
                "message": "Order cancelled successfully",
                "order": {
                    "id": order.id,
                    "status": order.status
                }
            }

        except HTTPException:
            session.rollback()
            raise

        except Exception:
            session.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel order"
            )


@app.post("/seller/orders/{order_id}/cancel")
def seller_cancel_order(
    order_id: int,
    current_user: User = Depends(
        require_role("seller")
    )
):
    with SessionLocal() as session:

        try:
            order = session.scalar(
                select(Order)
                .where(Order.id == order_id)
                .with_for_update()
            )

            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )

            if order.status != "payment_pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Only payment-pending orders "
                        "can be cancelled by a seller"
                    )
                )

            order_items = session.scalars(
                select(OrderItem).where(
                    OrderItem.order_id == order.id
                )
            ).all()

            seller_owns_order = False

            for item in order_items:

                product = session.get(
                    Product,
                    item.product_id
                )

                if (
                    product
                    and product.seller_id
                    == current_user.id
                ):
                    seller_owns_order = True
                    break

            if not seller_owns_order:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "You do not have permission "
                        "to cancel this order"
                    )
                )

            payment = session.scalar(
                select(Payment).where(
                    Payment.order_id == order.id
                )
            )

            if payment and payment.status == "success":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A successful payment cannot be cancelled"
                )

            # Release reserved inventory.
            for item in order_items:

                inventory = session.scalar(
                    select(Inventory)
                    .where(
                        Inventory.product_id
                        == item.product_id
                    )
                    .with_for_update()
                )

                if not inventory:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=(
                            f"Inventory not found for "
                            f"product {item.product_id}"
                        )
                    )

                inventory.quantity += item.quantity

            order.status = "cancelled"

            if payment:
                payment.status = "cancelled"

            session.commit()

            return {
                "message": "Order cancelled successfully",
                "order": {
                    "id": order.id,
                    "status": order.status
                }
            }

        except HTTPException:
            session.rollback()
            raise

        except Exception:
            session.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel order"
            )

        
# --------------------------------------------------
# SELLER ORDER MANAGEMENT
# --------------------------------------------------

@app.get("/seller/orders")
def get_seller_orders(
    current_user: User = Depends(
        require_role("seller")
    )
):
    with SessionLocal() as session:

        products = session.scalars(
            select(Product)
            .where(
                Product.seller_id == current_user.id
            )
        ).all()

        product_ids = [
            product.id
            for product in products
        ]

        if not product_ids:
            return {
                "orders": []
            }

        order_items = session.scalars(
            select(OrderItem)
            .where(
                OrderItem.product_id.in_(product_ids)
            )
        ).all()

        result = []

        for item in order_items:

            order = session.get(
                Order,
                item.order_id
            )

            product = session.get(
                Product,
                item.product_id
            )

            customer = session.get(
                User,
                order.user_id
            )

            result.append({
                "order_id": order.id,
                "customer": {
                    "id": customer.id,
                    "name": customer.name,
                    "email": customer.email,
                },
                "product": {
                    "id": product.id,
                    "name": product.name,
                },
                "quantity": item.quantity,
                "price_at_purchase": float(
                    item.price_at_purchase
                ),
                "subtotal": float(
                    item.subtotal
                ),
                "order_status": order.status,
            })

        return {
            "orders": result
        }

# --------------------------------------------------
# UPDATE SELLER ORDER STATUS
# --------------------------------------------------

@app.put("/seller/orders/{order_id}")
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(
        require_role("seller")
    )
):
    allowed_statuses = {
        "placed",
        "confirmed",
        "shipped",
        "delivered"
    }

    new_status = status_data.status.lower()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status"
        )

    with SessionLocal() as session:

        order = session.get(
            Order,
            order_id
        )

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        order_items = session.scalars(
            select(OrderItem)
            .where(
                OrderItem.order_id == order.id
            )
        ).all()

        seller_owns_order = False

        for item in order_items:

            product = session.get(
                Product,
                item.product_id
            )

            if (
                product
                and product.seller_id == current_user.id
            ):
                seller_owns_order = True
                break

        if not seller_owns_order:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this order"
            )

        status_flow = {
            "payment_pending": [],
            "placed": ["confirmed"],
            "confirmed": ["shipped"],
            "shipped": ["delivered"],
            "delivered": []
        }
        if new_status == "confirmed":
           payment = session.scalar(
               select(Payment).where(
                   Payment.order_id == order.id
                )
            )

           if not payment or payment.status != "success":
              raise HTTPException(
                  status_code=status.HTTP_400_BAD_REQUEST,
                  detail="Payment must be successful before confirming the order"
              )

           
        if new_status not in status_flow[order.status]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot change order status "
                    f"from '{order.status}' to '{new_status}'"
                )
            )

        order.status = new_status

        session.commit()
        session.refresh(order)

        return {
            "message": "Order status updated successfully",
            "order": {
                "id": order.id,
                "status": order.status
            }
        }

# --------------------------------------------------
# ADMIN DASHBOARD
# --------------------------------------------------

@app.get("/admin/dashboard")
def get_admin_dashboard(
    current_user: User = Depends(require_role("admin"))
):
    with SessionLocal() as session:

        # -----------------------------
        # USER STATISTICS
        # -----------------------------

        total_users = session.scalar(
            select(func.count()).select_from(User)
        )

        total_customers = session.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == "customer")
        )

        total_sellers = session.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == "seller")
        )

        total_active_users = session.scalar(
            select(func.count())
            .select_from(User)
            .where(User.is_active == True)
        )

        total_inactive_users = session.scalar(
            select(func.count())
            .select_from(User)
            .where(User.is_active == False)
        )

        # -----------------------------
        # PRODUCT STATISTICS
        # -----------------------------

        total_products = session.scalar(
            select(func.count()).select_from(Product)
        )

        approved_products = session.scalar(
            select(func.count())
            .select_from(Product)
            .where(Product.approval_status == "approved")
        )

        pending_products = session.scalar(
            select(func.count())
            .select_from(Product)
            .where(Product.approval_status == "pending")
        )

        rejected_products = session.scalar(
            select(func.count())
            .select_from(Product)
            .where(Product.approval_status == "rejected")
        )

        # -----------------------------
        # ORDER STATISTICS
        # -----------------------------

        total_orders = session.scalar(
            select(func.count()).select_from(Order)
        )

        order_status_rows = session.execute(
            select(
                Order.status,
                func.count().label("count")
            )
            .group_by(Order.status)
        ).all()

        orders_by_status = {
            "placed": 0,
            "confirmed": 0,
            "shipped": 0,
            "delivered": 0
        }

        for status_name, count in order_status_rows:
            if status_name in orders_by_status:
                orders_by_status[status_name] = count

        # -----------------------------
        # REVENUE
        # -----------------------------

        total_revenue = session.scalar(
            select(func.sum(Order.total_amount))
        )

        if total_revenue is None:
            total_revenue = 0

        return {
            "users": {
                "total": total_users,
                "customers": total_customers,
                "sellers": total_sellers,
                "active": total_active_users,
                "inactive": total_inactive_users
            },

            "products": {
                "total": total_products,
                "approved": approved_products,
                "pending": pending_products,
                "rejected": rejected_products
            },

            "orders": {
                "total": total_orders,
                "by_status": orders_by_status
            },

            "revenue": {
                "total": float(total_revenue)
            }
        }

@app.get("/admin/analytics/revenue")
def get_revenue_analytics(
    current_user: User = Depends(require_role("admin"))
):
    from datetime import date, timedelta

    today = date.today()
    start_date = today - timedelta(days=6)

    with SessionLocal() as session:

        daily_rows = session.execute(
            select(
                func.date(Order.created_at).label("date"),
                func.count(Order.id).label("orders"),
                func.sum(Order.total_amount).label("revenue")
            )
            .where(
                func.date(Order.created_at) >= start_date,
                func.date(Order.created_at) <= today
            )
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at))
        ).all()

        daily_data = {
            row_date: {
                "orders": orders,
                "revenue": float(revenue or 0)
            }
            for row_date, orders, revenue in daily_rows
        }

        result = []

        for i in range(7):
            current_date = start_date + timedelta(days=i)

            data = daily_data.get(
                current_date,
                {
                    "orders": 0,
                    "revenue": 0
                }
            )

            result.append({
                "date": str(current_date),
                "orders": data["orders"],
                "revenue": data["revenue"]
            })

        return {
            "daily": result
        }
# --------------------------------------------------
# ADMIN USER MANAGEMENT
# --------------------------------------------------
@app.get("/admin/users")
def get_all_users(
    current_user: User = Depends(require_role("admin"))
):
    with SessionLocal() as session:
        users = session.scalars(
            select(User).order_by(User.id)
        ).all()

        return {
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "is_active": user.is_active
                }
                for user in users
            ]
        }




# --------------------------------------------------
# ADMIN ROLE MANAGEMENT
# --------------------------------------------------

@app.put("/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_role("admin"))
):
    allowed_roles = {"customer", "seller", "admin"}

    if role_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    with SessionLocal() as session:
        user = session.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role of an inactive user"
            )

        # If an admin is being demoted, make sure
        # at least one other active admin remains.
        if user.role == "admin" and role_data.role != "admin":

            active_admin_count = session.scalar(
                select(func.count())
                .select_from(User)
                .where(
                    User.role == "admin",
                    User.is_active == True
                )
            )

            if active_admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last active administrator"
                )

        user.role = role_data.role

        session.commit()
        session.refresh(user)

        return {
            "message": "User role updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active
            }
        }

@app.get("/admin/products")
def get_all_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_role("admin"))
):
    with SessionLocal() as session:

        # Count total products
        total = session.scalar(
            select(func.count()).select_from(Product)
        )

        # Get only the requested page
        rows = session.execute(
            select(
                Product,
                Category.name.label("category_name"),
                User.id.label("seller_id"),
                User.name.label("seller_name"),
                User.email.label("seller_email")
            )
            .join(Category, Product.category_id == Category.id)
            .join(User, Product.seller_id == User.id)
            .order_by(Product.id)
            .offset(skip)
            .limit(limit)
        ).all()

        products = []

        for product, category_name, seller_id, seller_name, seller_email in rows:
            products.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "approval_status": product.approval_status,
                "category": category_name,
                "created_at": product.created_at,
                "updated_at": product.updated_at,
                "seller": {
                    "id": seller_id,
                    "name": seller_name,
                    "email": seller_email
                },
                

            })

        has_next = skip + limit < total

        return {
            "products": products,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "has_next": has_next
            }
        }


@app.put("/admin/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    current_user: User = Depends(require_role("admin"))
):
    with SessionLocal() as session:
        user = session.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Prevent an admin from deactivating themselves
        # if they are the last active administrator.
        if (
            user.id == current_user.id
            and not status_data.is_active
        ):
            active_admin_count = session.scalar(
                select(func.count())
                .select_from(User)
                .where(
                    User.role == "admin",
                    User.is_active == True
                )
            )

            if active_admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate the last active administrator"
                )

        # Prevent deactivating another admin if
        # they are the last active administrator.
        if (
            user.role == "admin"
            and user.is_active
            and not status_data.is_active
        ):
            active_admin_count = session.scalar(
                select(func.count())
                .select_from(User)
                .where(
                    User.role == "admin",
                    User.is_active == True
                )
            )

            if active_admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate the last active administrator"
                )

        user.is_active = status_data.is_active

        session.commit()
        session.refresh(user)

        return {
            "message": "User status updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active
            }
        }   


# --------------------------------------------------
# ADMIN PRODUCT APPROVAL
# --------------------------------------------------

@app.put("/admin/products/{product_id}/approval")
def update_product_approval(
    product_id: int,
    approval_data: ProductApprovalUpdate,
    current_user: User = Depends(
        require_role("admin")
    )
):
    allowed_statuses = {
        "approved",
        "rejected"
    }

    new_status = approval_data.status.lower()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid approval status. Use approved or rejected"
        )

    with SessionLocal() as session:

        product = session.get(
            Product,
            product_id
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        if product.approval_status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Product is already "
                    f"{product.approval_status}"
                )
            )

        product.approval_status = new_status

        session.commit()
        session.refresh(product)

        return {
            "message": "Product approval status updated",
            "product": {
                "id": product.id,
                "name": product.name,
                "approval_status": product.approval_status
            }
        }

