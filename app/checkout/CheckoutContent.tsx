"use client";

import { useState, useEffect, Suspense } from "react";

export const dynamic = 'force-dynamic';
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, MapPin, User, CheckCircle, ShoppingBag, Tag, X, Loader2, ChevronDown, Landmark } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/app/dashboard/BottomNav";
import toast, { Toaster } from "react-hot-toast";
import { getUser, supabase } from "@/lib/supabaseClient";
import { getCart, clearCart, getCoupon, getShippingInfo, updateShippingInfo } from "@/lib/supabaseDb";
import { usePaystackPayment } from "react-paystack";

interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

function CheckoutContentBase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [couponInput, setCouponInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [saveInfo, setSaveInfo] = useState(false);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [paystackReference, setPaystackReference] = useState("");

  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    // Generate a stable reference for Paystack on client mount
    setPaystackReference((new Date()).getTime().toString());

    const fetchUserAndCart = async () => {
      const { data } = await getUser();
      if (data?.user) {
        setUserId(data.user.id);
        const { data: cartData, error } = await getCart(data.user.id);
        if (error) {
          console.error('Error fetching cart:', error);
          toast.error('Error loading cart');
          router.push('/cart');
          return;
        }
        if (cartData && cartData.length > 0) {
          setCartItems(cartData);
        } else {
          toast.error('No items in cart');
          router.push('/cart');
        }

        // Load saved shipping info from Supabase
        const { data: shippingData, error: shippingError } = await getShippingInfo(data.user.id);
        if (shippingError) {
          console.error('Error fetching shipping info:', shippingError);
        } else if (shippingData) {
          setCustomerInfo(prev => ({
            ...prev,
            firstName: shippingData.first_name || '',
            lastName: shippingData.last_name || '',
            phone: shippingData.phone || '',
            address: shippingData.shipping_address || '',
            city: shippingData.shipping_city || '',
            state: shippingData.shipping_state || '',
            zipCode: shippingData.shipping_zip_code || ''
          }));
          setSaveInfo(true);
        }
      } else {
        toast.error("Please log in to checkout");
        router.push("/login");
        return;
      }
      setIsLoading(false);
    };
    fetchUserAndCart();
  }, [router]);

  // Apply coupon from URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const applyCoupon = async () => {
        const { data } = await getCoupon(code);
        if (data && data.discount_type === 'percentage') {
          setDiscount(data.discount_value / 100);
        }
      };
      applyCoupon();
    }
  }, [searchParams]);

  const handleManualCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsCheckingCoupon(true);
    const { data } = await getCoupon(couponInput);
    setIsCheckingCoupon(false);

    if (data && data.discount_type === 'percentage') {
      setDiscount(data.discount_value / 100);
      toast.success("Coupon applied successfully!");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setCouponInput("");
    toast.success("Coupon removed");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const getShipping = () => {
    const state = customerInfo.state;
    switch (state) {
      case 'Lagos': return 1500;
      case 'Ogun': return 2000;
      case 'Abuja': return 3500;
      case 'Rivers': return 4000;
      default: return 2500; // Base rate for unselected or other states
    }
  };

  const getTax = () => {
    return (getSubtotal() * (1 - discount)) * 0.075; // 7.5% tax on discounted amount
  };

  const getTotal = () => {
    return (getSubtotal() * (1 - discount)) + getShipping() + getTax();
  };

  const validateForm = () => {
    toast.dismiss(); // Clear any existing toasts
    const errors: Record<string, boolean> = {};
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    let hasEmptyFields = false;

    // Check required fields
    required.forEach(field => {
      if (!customerInfo[field as keyof typeof customerInfo].trim()) {
        errors[field] = true;
        hasEmptyFields = true;
      }
    });

    if (hasEmptyFields) {
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      setFormErrors({ ...errors, email: true });
      toast.error('Please enter a valid email address');
      return false;
    }

    // Phone validation (basic check for length and allowed chars)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
      setFormErrors({ ...errors, phone: true });
      toast.error('Please enter a valid phone number');
      return false;
    }

    if (!termsAccepted) {
      toast.error('Please accept the Terms and Conditions');
      return false;
    }

    setFormErrors({});
    return true;
  };

  // Paystack Configuration - always call hook but with dummy config initially
  const config = {
    reference: paystackReference,
    email: customerInfo.email,
    amount: Math.ceil(getTotal() * 100), // Paystack expects amount in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your key
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    processOrder(reference);
  };

  const onClose = () => {
    setIsProcessing(false);
    toast.error("Payment cancelled");
  };

  const validateStock = async () => {
    try {
      const itemIds = cartItems.map(i => i.id);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, stock, name')
        .in('id', itemIds);

      if (error) throw error;

      // Group cart quantities by product ID to handle multiple variants of the same product
      const productQuantities = cartItems.reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      for (const [productId, totalQuantity] of Object.entries(productQuantities)) {
        const product = products?.find(p => p.id === productId);

        if (!product) {
          const itemName = cartItems.find(i => i.id === productId)?.name || 'Product';
          toast.error(`${itemName} no longer exists.`);
          return false;
        }

        if (product.stock < totalQuantity) {
          toast.error(`Sorry, ${product.name} is out of stock (Only ${product.stock} left).`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Stock validation error:", error);
      toast.error("Could not validate stock. Please try again.");
      return false;
    }
  };

  const handlePaymentInitiation = async () => {
    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      toast.error('No items in cart');
      return;
    }

    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);

    // Security: Re-validate auth token before initiating payment
    const { data } = await getUser();
    if (!data?.user) {
      setIsProcessing(false);
      toast.error('Session expired. Please log in again');
      router.push('/login');
      return;
    }

    // Validate stock before payment
    const isStockValid = await validateStock();
    if (!isStockValid) {
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === 'card') {
      initializePayment({ onSuccess, onClose });
    } else {
      processOrder();
    }
  };

  const processOrder = async (paymentReference?: any) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      // Save shipping info if requested
      if (saveInfo && userId) {
        await updateShippingInfo(userId, customerInfo);
      }

      // Use RPC for secure order placement (Backend validates stock & recalculates price)
      const { data: orderId, error } = await supabase.rpc('place_order', {
        user_id: userId,
        items_json: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })),
        shipping_info: customerInfo,
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        shipping_cost: getShipping(),
        order_note: orderNote,
        coupon_code: couponInput || null
      });

      if (error) {
        console.error('Error creating order:', error);
        // Display specific error message from backend if available, otherwise generic
        toast.error(error.message || 'Failed to place order. Please try again.');
        return;
      }

      // Clear cart in Supabase
      await clearCart(userId);

      if (orderId) {
        setOrderId(orderId);
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
      } else {
        toast.error('Failed to create order. Please try again.');
      }

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">Your order has been placed successfully.</p>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Order Details</h3>
              <div className="text-left space-y-2">
                <p><span className="font-medium">Order ID:</span> {orderId}</p>
                <p><span className="font-medium">Total:</span> ₦{getTotal().toLocaleString()}</p>
                <p><span className="font-medium">Items:</span> {cartItems.reduce((total, item) => total + item.quantity, 0)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/store/dashboard')}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                View My Orders
              </button>
            </div>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500">
              {cartItems.reduce((total, item) => total + item.quantity, 0)} items
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={customerInfo.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${formErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={customerInfo.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${formErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                    placeholder="+234 xxx xxx xxxx"
                    required
                  />
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${formErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={customerInfo.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${formErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                      placeholder="Lagos"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <div className="relative">
                    <select
                      name="state"
                      value={customerInfo.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${formErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none bg-white`}
                      required
                    >
                      <option value="">Select State</option>
                      <option value="Lagos">Lagos (₦1,500)</option>
                      <option value="Ogun">Ogun (₦2,000)</option>
                      <option value="Abuja">Abuja (₦3,500)</option>
                      <option value="Rivers">Rivers (₦4,000)</option>
                      <option value="Other">Other Locations (₦2,500)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={customerInfo.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${formErrors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all`}
                      placeholder="100001"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Save Information Checkbox */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveInfo"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="saveInfo" className="text-sm text-gray-600 cursor-pointer">Save this information for next time</label>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "card" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-200"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Credit/Debit Card</p>
                      <p className="text-sm text-gray-500">Pay securely with your card</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "transfer" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-200"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <div className="flex items-center gap-3">
                    <Landmark className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-sm text-gray-500">Direct bank transfer</p>
                    </div>
                  </div>
                </label>
              </div>
            </motion.div>

            {/* Order Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Notes (Optional)</h2>
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none h-32"
                placeholder="Notes about your order, e.g. special notes for delivery."
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      {(item.size || item.color) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && " | "}
                          {item.color && `Color: ${item.color}`}
                        </p>
                      )}
                      <p className="text-red-600 font-bold">
                        ₦{(parseFloat(item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                {discount > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Coupon Applied</span>
                    </div>
                    <button onClick={removeCoupon} className="p-1 hover:bg-green-100 rounded-full transition-colors">
                      <X className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm"
                        placeholder="Enter code"
                      />
                    </div>
                    <button onClick={handleManualCoupon} disabled={isCheckingCoupon} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400">
                      {isCheckingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Order Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{getSubtotal().toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                    <span>-₦{(getSubtotal() * discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>₦{getShipping().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₦{getTax().toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-bold text-lg text-gray-900">
                    <span>Total</span>
                    <span>₦{getTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mt-6 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">I have read and agree to the website <Link href="/terms" className="text-red-600 hover:underline">terms and conditions</Link> and <Link href="/privacy" className="text-red-600 hover:underline">privacy policy</Link>.</label>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePaymentInitiation}
                disabled={isProcessing}
                className="w-full mt-6 bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {paymentMethod === 'card' ? `Pay ₦${getTotal().toLocaleString()}` : 'Place Order'}
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default CheckoutContentBase;
