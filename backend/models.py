from datetime import datetime


from sqlalchemy import ForeignKey, Integer, Numeric, String,UniqueConstraint,DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


# --------------------------------------------------
# USER MODEL
# --------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="customer",
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        server_default="true",
        nullable=False
    )

# --------------------------------------------------
# CATEGORY MODEL
# --------------------------------------------------

class Category(Base):

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )


# --------------------------------------------------
# PRODUCT MODEL
# --------------------------------------------------

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    approval_status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        server_default="approved",
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
     default=True,
     server_default="true",
     nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True
    )

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False
    )

    seller_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


# --------------------------------------------------
# INVENTORY MODEL
# --------------------------------------------------

class Inventory(Base):

    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        unique=True,
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    reorder_level: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False
    )

# --------------------------------------------------
# CART MODEL
# --------------------------------------------------

class Cart(Base):

    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )


# --------------------------------------------------
# CART ITEM MODEL
# --------------------------------------------------

class CartItem(Base):

    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id"),
        nullable=False
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "cart_id",
            "product_id",
            name="unique_cart_product"
        ),
    )

# --------------------------------------------------
# ORDER MODEL
# --------------------------------------------------

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    total_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="placed",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )


# --------------------------------------------------
# ORDER ITEM MODEL
# --------------------------------------------------

class OrderItem(Base):

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    price_at_purchase: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    subtotal: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        unique=True,
        nullable=False
    )

    payment_gateway: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    gateway_order_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    gateway_payment_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True
    )

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="created",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )