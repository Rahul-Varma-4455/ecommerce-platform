from pydantic import BaseModel, EmailStr, Field


# --------------------------------------------------
# USER SCHEMAS
# --------------------------------------------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --------------------------------------------------
# PRODUCT SCHEMAS
# --------------------------------------------------

class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = Field(
        default=None,
        max_length=1000
    )
    price: float = Field(gt=0)
    category_id: int = Field(gt=0)


# --------------------------------------------------
# INVENTORY SCHEMAS
# --------------------------------------------------

class InventoryCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=0)
    reorder_level: int = Field(ge=0)


class InventoryUpdate(BaseModel):
    quantity: int = Field(ge=0)
    reorder_level: int = Field(ge=0)

# --------------------------------------------------
# CART SCHEMAS
# --------------------------------------------------

class CartItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


# --------------------------------------------------
# ORDER SCHEMAS
# --------------------------------------------------

class OrderStatusUpdate(BaseModel):
    status: str = Field(
        min_length=2,
        max_length=30
    )

# --------------------------------------------------
# ADMIN USER MANAGEMENT SCHEMAS
# --------------------------------------------------

class UserRoleUpdate(BaseModel):
    role: str = Field(
        min_length=1,
        max_length=20
    )

# --------------------------------------------------
# PRODUCT APPROVAL SCHEMA
# --------------------------------------------------

class ProductApprovalUpdate(BaseModel):
    status: str = Field(
        min_length=1,
        max_length=20
    )

class ProductUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    price: float = Field(gt=0)
    category_id: int = Field(gt=0)

class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)

class UserStatusUpdate(BaseModel):
    is_active: bool    

class PaymentCreate(BaseModel):
    order_id: int = Field(gt=0)

class PaymentVerify(BaseModel):
    order_id: int = Field(gt=0)
    razorpay_order_id: str = Field(min_length=1)
    razorpay_payment_id: str = Field(min_length=1)
    razorpay_signature: str = Field(min_length=1)

class PaymentCancel(BaseModel):
    order_id: int = Field(gt=0)