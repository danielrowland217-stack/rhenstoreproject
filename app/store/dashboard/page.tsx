"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Share2, Search, X, Trash2, Star, ShoppingBag, Package, Home, ArrowUp, ChevronLeft, ChevronRight, Camera, CreditCard, Heart, CheckCircle, User as UserIcon, Edit2, Save, Wallet, BarChart3, Megaphone, TrendingUp, Target, FileText, Palette, Check, Crown, Sparkles } from "lucide-react";
import { BottomNav } from "../../dashboard/BottomNav";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { ProductFormModal } from "./ProductFormModal";
import { usePaystackPayment } from "react-paystack";

import { Plus_Jakarta_Sans } from "next/font/google";
const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

interface Product {
  id: string;
  name: string;
  price: string;
  salePrice?: string;
  description: string;
  images: string[];
  stock: number;
  createdAt?: string;
  reviews?: Review[];
  category?: string;
  colors?: string[];
  sizes?: string[];
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface CartItem extends Product {
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  status: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  isPremium: boolean;
  isPopular: boolean;
}

const templates: Template[] = [
  {
    id: "classic-red",
    name: "Classic Red",
    description: "Timeless red theme perfect for fashion stores",
    preview: "/templates/classic-red.png",
    colors: {
      primary: "#DC2626",
      secondary: "#FFFFFF",
      accent: "#FEE2E2",
      background: "#FEF2F2"
    },
    isPremium: false,
    isPopular: true
  },
  {
    id: "elegant-black",
    name: "Elegant Black",
    description: "Sophisticated black and white design",
    preview: "/templates/elegant-black.png",
    colors: {
      primary: "#000000",
      secondary: "#FFFFFF",
      accent: "#F3F4F6",
      background: "#111827"
    },
    isPremium: false,
    isPopular: false
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Refreshing blue tones for a modern look",
    preview: "/templates/ocean-blue.png",
    colors: {
      primary: "#2563EB",
      secondary: "#FFFFFF",
      accent: "#DBEAFE",
      background: "#EFF6FF"
    },
    isPremium: true,
    isPopular: false
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Warm orange hues for an energetic vibe",
    preview: "/templates/sunset-orange.png",
    colors: {
      primary: "#EA580C",
      secondary: "#FFFFFF",
      accent: "#FED7AA",
      background: "#FFF7ED"
    },
    isPremium: true,
    isPopular: false
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural green tones for eco-friendly brands",
    preview: "/templates/forest-green.png",
    colors: {
      primary: "#16A34A",
      secondary: "#FFFFFF",
      accent: "#DCFCE7",
      background: "#F0FDF4"
    },
    isPremium: false,
    isPopular: false
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Luxurious purple for premium products",
    preview: "/templates/royal-purple.png",
    colors: {
      primary: "#7C3AED",
      secondary: "#FFFFFF",
      accent: "#EDE9FE",
      background: "#F5F3FF"
    },
    isPremium: true,
    isPopular: false
  }
];

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [storeName, setStoreName] = useState("My Store");
  const [storeDescription, setStoreDescription] = useState("");
  const [isEditingStore, setIsEditingStore] = useState(false);
  const categories = ["All", "Clothing", "Shoes", "Accessories", "Bags", "Jewelry", "Beauty", "Kids", "Sports"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [saveCard, setSaveCard] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<string>("classic-red");
  const [templateColors, setTemplateColors] = useState({
    primary: "#DC2626",
    secondary: "#FFFFFF",
    accent: "#FEE2E2",
    background: "#FEF2F2"
  });
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  const isNewArrival = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
  };

  // Helper to sync store settings to Supabase
  const updateStoreSettings = async (updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ 
          user_id: user.id, 
          updated_at: new Date().toISOString(),
          ...updates 
        });
        
      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!quickViewProduct || newReviewRating === 0 || !newReviewText) {
      toast.error("Please provide a rating and a review.");
      return;
    }

    const toastId = toast.loading("Posting review...");

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          product_id: quickViewProduct.id,
          author: user?.user_metadata?.full_name || "A Happy Customer",
          rating: newReviewRating,
          text: newReviewText
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const newReview: Review = {
        id: data.id,
        author: data.author,
        rating: data.rating,
        text: data.text,
        createdAt: data.created_at
      };

      setProducts(prev => prev.map(p => p.id === quickViewProduct.id ? { ...p, reviews: [newReview, ...(p.reviews || [])] } : p));
      setQuickViewProduct(prev => prev ? { ...prev, reviews: [newReview, ...(prev.reviews || [])] } : null);
      
      setNewReviewText("");
      setNewReviewRating(0);
      toast.success("Thank you for your review!", { id: toastId });
    } catch (error: any) {
      console.error("Error posting review:", error);
      toast.error("Failed to post review", { id: toastId });
    }
  };

  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setWishlist(prev => {
      const newWishlist = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      // Update Supabase instead of localStorage
      updateStoreSettings({ wishlist: newWishlist });
      toast.success(prev.includes(productId) ? "Removed from wishlist" : "Added to wishlist");
      return newWishlist;
    });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success("Store link copied to clipboard!");
      }, (err) => {
        console.error('Could not copy text: ', err);
        toast.error("Failed to copy link.");
      });
    } else {
      toast.error("Clipboard not available.");
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (user) {
      const toastId = toast.loading("Uploading cover photo...");
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('store-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('store-assets')
          .getPublicUrl(filePath);

        setCoverPhoto(publicUrl);
        await updateStoreSettings({ cover_photo: publicUrl });
        
        toast.success("Cover photo updated!", { id: toastId });
      } catch (error: any) {
        console.error("Upload error:", error);
        if (error.message.includes("row-level security")) {
          toast.error("Permission denied. Please run the Supabase SQL setup script.", { id: toastId });
        } else {
          toast.error(`Upload failed: ${error.message}`, { id: toastId });
        }
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product, quantity: number = 1) => {
    e.stopPropagation();
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }

    try {
      if (!user) {
        toast.error("Please login to add items to cart");
        return;
      }

      // Determine effective price (sale price if available and lower)
      const effectivePrice = (product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price))
        ? product.salePrice
        : product.price;

      // Check if item exists in cart
      const { data: existingItems } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', product.name) // Using name/id to check existence
        .single();

      if (existingItems) {
        // Update quantity
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingItems.quantity + quantity })
          .eq('id', existingItems.id);
        
        if (error) throw error;
        toast.success(`${product.name} (x${quantity}) quantity updated!`);
      } else {
        // Insert new item
        const { error } = await supabase.from('cart').insert({
          user_id: user.id,
          id: product.id, // Keeping ID consistent
          name: product.name,
          price: effectivePrice,
          image: product.images?.[0] || "",
          quantity: quantity
        });

        if (error) throw error;
        toast.success(`${product.name} (x${quantity}) added to cart!`);
      }

      // Refresh local cart state
      fetchCart();
      
    } catch (error: any) {
      console.error("Failed to update cart", error);
      toast.error("Could not add product to cart.");
    }
  };

  useEffect(() => {
    if (isCheckoutModalOpen) {
      // Card details are now loaded from Supabase in the main useEffect
      if (cardDetails.number) {
        setSaveCard(true);
      } else {
        setCardDetails({ number: "", expiry: "", cvc: "", name: "" });
        setSaveCard(false);
      }
    }
  }, [isCheckoutModalOpen]);

  // Paystack Config for Buy Now
  const paystackConfig = useMemo(() => {
    const rawPrice = checkoutProduct ? (checkoutProduct.salePrice && Number(checkoutProduct.salePrice) > 0 && Number(checkoutProduct.salePrice) < Number(checkoutProduct.price) ? checkoutProduct.salePrice : checkoutProduct.price) : 0;
    const price = Number(String(rawPrice).replace(/,/g, ''));
    return {
      reference: (new Date()).getTime().toString(),
      email: user?.email || "customer@example.com",
      amount: Math.ceil(price * checkoutQuantity * 100),
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    };
  }, [checkoutProduct, checkoutQuantity, user?.email]);

  const initializePayment = usePaystackPayment(paystackConfig);

  const handleBuyNowClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingPayment) return;

    if (saveCard) {
      // Save card to Supabase
      updateStoreSettings({ saved_card: cardDetails });
    }
    if (!checkoutProduct) return;
    
    setIsProcessingPayment(true);

    // Trigger Paystack
    initializePayment({ 
      onSuccess: processOrder, 
      onClose: () => {
        setIsProcessingPayment(false);
        toast.error("Payment cancelled");
      }
    });
  };

  const processOrder = async (paymentStatusOrRef?: any) => {
    if (!checkoutProduct) return;
    
    if (!user) {
      toast.error("Please log in to place an order");
      return;
    }

    const toastId = toast.loading("Processing order...");
    
    const status = typeof paymentStatusOrRef === 'string' ? paymentStatusOrRef : 'paid';
    
    try {
        const rawPrice = checkoutProduct.salePrice && Number(checkoutProduct.salePrice) > 0 && Number(checkoutProduct.salePrice) < Number(checkoutProduct.price) ? checkoutProduct.salePrice : checkoutProduct.price;
        // Remove commas and ensure it is a valid number
        const price = Number(String(rawPrice).replace(/,/g, ''));

        if (isNaN(price)) {
          throw new Error("Invalid product price detected. Please check the product details.");
        }
        
        // Create a clean item object to store (removes any potential circular refs or large unnecessary data)
        const orderItem = {
          id: checkoutProduct.id,
          name: checkoutProduct.name,
          price: price,
          quantity: checkoutQuantity,
          image: checkoutProduct.images?.[0] || ""
        };

        const orderPayload = {
          total: price * checkoutQuantity,
          status: status,
          items: [orderItem], 
          user_id: user.id,
          customer_info: {
            name: cardDetails.name || user.user_metadata?.full_name || "Customer",
            email: user.email
          },
          discount: 0
        };
        console.log("Attempting to place order with payload:", orderPayload);

        // 1. Insert Order into Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single();

        if (orderError) {
          console.error("Order Insert Error:", orderError);
          throw new Error(`Database Error: ${orderError.message}`);
        }

        // 2. Map to local Order type for UI
        const newOrder: Order = {
          id: orderData.id,
          items: orderData.items,
          total: orderData.total,
          createdAt: orderData.created_at,
          status: 'paid'
        };

        // 3. Update Stock in Supabase
        if (checkoutProduct.stock > 0) {
             // Use the secure RPC function to decrement stock
             const { error: stockError } = await supabase
               .rpc('decrement_stock', { product_id: checkoutProduct.id, quantity_to_subtract: checkoutQuantity });
             
             if (stockError) {
                // Log error but don't fail the order since it's already placed
                console.error("Stock Update Error:", stockError);
             }
        }

        // 4. Send Email
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'order_confirmation', email: user?.email, orderId: newOrder.id, amount: price * checkoutQuantity })
          });
        } catch (emailError) {
          console.error("Failed to send email", emailError);
        }

        // UI Updates
        setLastOrder(newOrder);
        setCheckoutProduct(null);
        setIsCheckoutModalOpen(false);
        setIsOrderSuccessOpen(true);
        toast.dismiss(toastId);
        
    } catch (error: any) {
        console.error("Order processing error:", error);
        toast.error(`Failed to place order: ${error.message || error.error_description || "Unknown error"}`, { id: toastId });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          salePrice:sale_price,
          description,
          images,
          stock,
          createdAt:created_at,
          category,
          colors,
          sizes,
          reviews (
            id,
            author,
            rating,
            text,
            createdAt:created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Ensure images is always an array to prevent errors
        const sanitizedData = data.map((item: any) => ({
          ...item,
          images: item.images || []
        }));
        setProducts(sanitizedData as Product[]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user.id);
    
    if (data) {
      setCartItems(data as CartItem[]);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setOrderCount(data.length);
        
        // Fetch actual balance (Revenue - Withdrawals) if user is logged in
        if (user) {
          const { data: balance } = await supabase.rpc('get_seller_balance', { target_user_id: user.id });
          setTotalRevenue(balance || 0);
        }
        
        const mappedOrders = data.map((order: any) => ({
          id: order.id,
          items: order.items || [],
          total: order.total,
          createdAt: order.created_at,
          status: order.status
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleShareReceipt = async () => {
    if (!lastOrder) return;
    const item = lastOrder.items[0];
    const quantityText = item.quantity > 1 ? ` (x${item.quantity})` : '';
    const text = `🧾 Rhen Store Receipt\n\nOrder ID: #${lastOrder.id.slice(-6)}\nItem: ${item.name}${quantityText}\nPrice: ₦${lastOrder.total.toLocaleString()}\nDate: ${new Date(lastOrder.createdAt).toLocaleDateString()}\n\nThank you for your purchase!`;

    if (typeof window !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'Rhen Store Receipt',
          text: text,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard!");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const filteredProducts = products.filter(product => 
    (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCategory === "All" || product.category === selectedCategory)
  );

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', deleteId);

        if (error) throw error;

        const updatedProducts = products.filter(p => p.id !== deleteId);
        setProducts(updatedProducts);
        setDeleteId(null);
        toast.success("Product deleted successfully");
      } catch (error: any) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);

      // Load store settings from Supabase
      try {
        const { data: settings, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (settings) {
          setStoreName(settings.store_name || "My Store");
          setStoreDescription(settings.store_description || "");
          setCoverPhoto(settings.cover_photo || "");
          setWishlist(settings.wishlist || []);
          if (settings.saved_card) {
            setCardDetails(settings.saved_card);
          }
          if (settings.current_template) {
            setCurrentTemplate(settings.current_template);
          }
          if (settings.template_colors) {
            setTemplateColors(settings.template_colors);
          }
        }
      } catch (err) {
        console.log("No store settings found or error loading them");
      }
    };

    checkAuth();

    // Load products
    fetchProducts();
    fetchCart();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowBackToTop(window.scrollY > 300);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    if (user) fetchCart();

    // Realtime Subscription for Orders and Products
    const channel = supabase
      .channel('store-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // New order received
          toast.success(`New Order Received! 💰`, {
            icon: '🔔',
            duration: 4000
          });
          setUnreadNotifications(prev => prev + 1);
          fetchOrders(); // Refresh stats
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          // Stock updated by another user
          setProducts(currentProducts => 
            currentProducts.map(p => 
              p.id === payload.new.id ? { ...p, ...payload.new, images: payload.new.images || [] } : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (quickViewProduct) {
      setCurrentImageIndex(0);
      setQuickViewQuantity(1);
    }
  }, [quickViewProduct]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 relative ${font.className}`}>
      <style>{`
        :root {
          --primary: ${templateColors.primary};
          --primary-50: ${templateColors.primary}33;
          --primary-20: ${templateColors.primary}14;
          --primary-30: ${templateColors.primary}4D;
          --primary-60: ${templateColors.primary}99;
        }
      `}</style>
      <Toaster position="top-center" reverseOrder={false} />
      {!isPreviewMode && <div className="absolute top-0 left-0 w-full h-80 rounded-b-[3rem]" style={{ backgroundColor: templateColors.primary }} />}
      <div className="relative z-10 p-4 sm:p-8 pb-24 sm:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-sm">
            <button
              onClick={() => setIsPreviewMode(false)}
              className={`relative px-6 py-2 rounded-lg text-sm font-bold transition-colors w-24 ${!isPreviewMode ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {!isPreviewMode && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Seller</span>
            </button>
            <button
              onClick={() => setIsPreviewMode(true)}
              className={`relative px-6 py-2 rounded-lg text-sm font-bold transition-colors w-24 ${isPreviewMode ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {isPreviewMode && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">Buyer</span>
            </button>
          </div>
        </div>

        {/* Growth Features Navigation */}
        {!isPreviewMode && (
          <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-2 min-w-max">
              {[
                { href: '/store/dashboard', label: 'Products', icon: Package, active: true },
                { href: '/store/dashboard/templates', label: 'Templates', icon: Palette },
                { href: '/store/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
                { href: '/store/dashboard/marketing', label: 'Marketing', icon: Megaphone },
                { href: '/store/dashboard/insights', label: 'Insights', icon: TrendingUp },
                { href: '/store/dashboard/goals', label: 'Goals', icon: Target },
                { href: '/store/dashboard/reports', label: 'Reports', icon: FileText }
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      item.active
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-20)]"
                        : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </motion.button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`flex justify-between items-center gap-2 sm:gap-4 ${isPreviewMode ? 'mb-6 sm:mb-10' : 'mb-6'}`}>
          <div className="shrink-0">
            {!isPreviewMode && products.length > 0 && (
              <motion.button
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-full bg-white shadow-sm border border-gray-100"
              >
                <Plus className="w-6 h-6 text-[var(--primary)]" />
              </motion.button>
            )}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-[var(--primary-20)] focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-3 shrink-0">
            {isPreviewMode && (
              <>
                <Link href="/cart">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-full bg-white shadow-sm border border-gray-100 relative hidden sm:block"
                  >
                    <ShoppingBag className="w-6 h-6 text-gray-600" />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[var(--primary)] text-white text-[9px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                        {cartCount}
                      </span>
                    )}
                  </motion.button>
                </Link>
              </>
            )}
            {!isPreviewMode && (
              <>
                <motion.button
                  onClick={handleShare}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-white shadow-sm border border-gray-100"
                >
                  <Share2 className="w-6 h-6 text-gray-600" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                  selectedCategory === cat
                    ? (isPreviewMode ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20" : "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-20)]")
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>


        {/* Search and Actions */}
        <div className="mb-8">
          {/* Store Banner */}
          <div className={`relative rounded-3xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 ${coverPhoto ? 'h-48' : 'bg-white/80 backdrop-blur-md p-4 sm:p-6'}`}>
            {coverPhoto && (
              <>
                <Image 
                  src={coverPhoto} 
                  alt="Store Cover" 
                  fill
                  className="absolute inset-0 w-full h-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </>
            )}
            
            <div className={`relative z-10 flex flex-col justify-end h-full ${coverPhoto ? 'p-4 sm:p-6' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex-1 min-w-0 w-full">
                  {isEditingStore ? (
                    <div className="space-y-2 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <input 
                        type="text" 
                        value={storeName} 
                        onChange={(e) => setStoreName(e.target.value)}
                        className="text-2xl font-bold text-gray-900 w-full bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] shadow-lg"
                        placeholder="Store Name"
                        autoFocus
                      />
                      <input 
                        type="text" 
                        value={storeDescription} 
                        onChange={(e) => setStoreDescription(e.target.value)}
                        className="text-sm text-gray-900 w-full bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] shadow-lg"
                        placeholder="Store description"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => {
                            updateStoreSettings({ store_name: storeName, store_description: storeDescription });
                            setIsEditingStore(false);
                            toast.success("Store details updated");
                          }}
                          className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button 
                          onClick={() => setIsEditingStore(false)}
                          className="px-4 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 group">
                        <h2 className={`text-2xl font-bold truncate ${coverPhoto ? 'text-white' : 'text-gray-900'}`}>{storeName}</h2>
                        {!isPreviewMode && (
                          <button 
                            onClick={() => setIsEditingStore(true)} 
                            className={`p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${coverPhoto ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className={`${coverPhoto ? 'text-gray-200' : 'text-gray-500'} text-sm truncate`}>{storeDescription || (isPreviewMode ? "Welcome to our store" : "Manage your store settings and products")}</p>
                    </div>
                  )}
                </div>
                
                {!isPreviewMode && (
                  <label className={`p-2.5 rounded-full cursor-pointer transition-colors shrink-0 self-end sm:self-auto ${coverPhoto ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleCoverPhotoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 ${isPreviewMode ? 'gap-3 sm:gap-10 mt-6 sm:mt-12' : 'gap-3 sm:gap-8'}`}>
          {/* Add Product Button Card */}
          {!isPreviewMode && !isLoading && products.length === 0 && (
          <motion.div
            onClick={() => setIsModalOpen(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white aspect-square rounded-3xl shadow-sm border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 hover:border-[var(--primary)] hover:bg-[var(--primary-20)] transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--primary-30)] flex items-center justify-center group-hover:bg-[var(--primary-50)] transition-colors">
              <Plus className="w-10 h-10 text-[var(--primary)]" />
            </div>
            <span className="text-xl font-semibold text-gray-600 group-hover:text-[var(--primary)] transition-colors">Add Your First Product</span>
            <p className="text-xs text-gray-400 mt-1">You can add up to 10,000 products.</p>
          </motion.div>
          )}

          {/* Skeleton Loading */}
          {isLoading && [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-sm flex flex-col gap-4 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-2xl w-full"></div>
              <div className="flex flex-col gap-2 px-1">
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-6 bg-gray-100 rounded w-2/3"></div>
              </div>
              <div className="flex justify-between items-center mt-auto px-1">
                <div className="h-6 bg-gray-100 rounded w-1/4"></div>
                <div className="h-10 w-10 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          ))}

          {!isLoading && products.length > 0 && filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No products found matching "{searchQuery}"
            </div>
          )}

          {/* Product Cards */}
          {!isLoading && filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-3 sm:p-5 shadow-sm flex flex-col gap-3 sm:gap-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div onClick={() => isPreviewMode ? setQuickViewProduct(product) : handleEditClick(product)} className="cursor-pointer">
                {!isPreviewMode && (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(product.id); }}
                    whileHover={{ scale: 1.2, rotate: -15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-400 hover:text-[var(--primary)] transition-colors z-20 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}

                {isPreviewMode && (
                  <motion.button
                    onClick={(e) => toggleWishlist(e, product.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full shadow-sm z-20 transition-colors ${wishlist.includes(product.id) ? 'bg-[var(--primary-20)] text-[var(--primary)]' : 'bg-white/90 text-gray-400 hover:text-[var(--primary)]'}`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                  </motion.button>
                )}
                
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden w-full relative">
                  {product.images && product.images.length > 0 ? (
                    <Image 
                      src={product.images[0]} 
                      alt={product.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={`object-cover group-hover:scale-110 transition-transform duration-500 ${product.stock === 0 ? 'grayscale' : ''}`} 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                      <span className="font-bold text-gray-700 bg-gray-200/80 px-4 py-2 rounded-full">SOLD OUT</span>
                    </div>
                  )}
                  {isNewArrival(product.createdAt) && (
                    <div className={`absolute ${!isPreviewMode ? 'bottom-2 left-2' : 'top-2 left-2'} bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm`}>
                      NEW
                    </div>
                  )}
                  {product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price) && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      {Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100)}% OFF
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 px-1 pt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const averageRating = product.reviews && product.reviews.length > 0 ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length : 0;
                      return <Star key={star} className={`w-3 h-3 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                    })}
                    <span className="text-xs text-gray-400 ml-1 font-medium">({product.reviews?.length || 0})</span>
                  </div>
                  <h3 className="font-bold text-gray-800 truncate text-sm sm:text-base leading-tight">{product.name}</h3>
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto gap-2">
                <div className="flex flex-col min-w-0">
                  <p className="text-green-600 font-bold text-base sm:text-lg">
                    ₦{Number(product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price) ? product.salePrice : product.price).toLocaleString()}
                  </p>
                  {product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price) && (
                    <p className="text-gray-400 text-xs line-through font-medium">₦{Number(product.price).toLocaleString()}</p>
                  )}
                </div>
                {isPreviewMode && (product.stock > 0 || product.stock === undefined) && (
                  <motion.button
                    onClick={(e) => handleAddToCart(e, product)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 rounded-xl bg-[var(--primary-20)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors shrink-0"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add Product Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchProducts}
        productToEdit={editingProduct}
        user={user}
        categories={categories}
      />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setQuickViewProduct(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl sm:rounded-[2rem] w-full max-w-5xl relative overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row h-[85vh] md:h-[80vh]"
          >
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-900 hover:bg-white transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div 
              className="relative h-[40vh] md:h-full md:w-1/2 bg-gray-100 shrink-0 group overflow-hidden cursor-crosshair"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    scale: isZoomed ? 2 : 1
                  }}
                  style={{ transformOrigin: `${mousePos.x}% ${mousePos.y}%` }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={quickViewProduct.images[currentImageIndex]}
                    alt={quickViewProduct.name}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              
              {quickViewProduct.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? quickViewProduct.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-900 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === quickViewProduct.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-900 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {quickViewProduct.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex ? "bg-[var(--primary)] w-3" : "bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={(e) => toggleWishlist(e, quickViewProduct.id)}
                className={`absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full transition-colors shadow-sm ${wishlist.includes(quickViewProduct.id) ? 'text-[var(--primary)]' : 'text-gray-900 hover:text-[var(--primary)]'}`}
              >
                <Heart className={`w-5 h-5 ${wishlist.includes(quickViewProduct.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto md:w-1/2 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                <h2 className="text-2xl font-bold text-gray-900 pr-4">{quickViewProduct.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const averageRating = quickViewProduct.reviews && quickViewProduct.reviews.length > 0 ? quickViewProduct.reviews.reduce((acc, r) => acc + r.rating, 0) / quickViewProduct.reviews.length : 0;
                    return <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                  })}
                  <span className="text-sm text-gray-400 ml-1 font-medium">
                    ({quickViewProduct.reviews?.length || 0} reviews)
                  </span>
                </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ₦{Number(quickViewProduct.salePrice && Number(quickViewProduct.salePrice) > 0 && Number(quickViewProduct.salePrice) < Number(quickViewProduct.price) ? quickViewProduct.salePrice : quickViewProduct.price).toLocaleString()}
                  </p>
                  {quickViewProduct.salePrice && Number(quickViewProduct.salePrice) > 0 && Number(quickViewProduct.salePrice) < Number(quickViewProduct.price) && (
                    <p className="text-gray-400 text-sm line-through font-medium">₦{Number(quickViewProduct.price).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                {(quickViewProduct.stock > 0 || quickViewProduct.stock === undefined) ? (
                  <p className="text-sm text-green-600 font-medium">In Stock ({quickViewProduct.stock} available)</p>
                ) : (
                  <p className="text-sm text-[var(--primary)] font-medium">Out of Stock</p>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">
                {quickViewProduct.description || "No description available for this product."}
              </p>

              {/* Reviews Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Reviews</h3>
                
                {/* Add Review Form */}
                <form onSubmit={handlePostReview} className="bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-2">Write a review</h4>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-sm text-gray-600 mr-2">Your Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="focus:outline-none hover:scale-110 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= newReviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    rows={3}
                    placeholder="Share your thoughts about this product..."
                    className="w-full p-3 bg-white rounded-xl border-gray-200 border focus:ring-2 focus:ring-[var(--primary-20)] outline-none transition-all resize-none text-sm font-medium placeholder:text-gray-400"
                  />
                  <button type="submit" className="w-full mt-3 bg-gray-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                    Submit Review
                  </button>
                </form>

                {/* Existing Reviews List */}
                <div className="space-y-6">
                  {quickViewProduct.reviews && quickViewProduct.reviews.length > 0 ? (
                    quickViewProduct.reviews.map(review => (
                      <div key={review.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-bold text-gray-800">{review.author}</h5>
                            <span className="text-xs text-gray-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}
                          </div>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No reviews yet. Be the first to write one!</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-8 border-t border-gray-200">
              {(quickViewProduct.stock > 0 || quickViewProduct.stock === undefined) ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">Quantity</span>
                    <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-1.5">
                      <button 
                        onClick={() => setQuickViewQuantity(q => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-[var(--primary)] font-bold transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-gray-900 w-4 text-center">{quickViewQuantity}</span>
                      <button 
                        onClick={() => setQuickViewQuantity(q => Math.min(quickViewProduct.stock || 100, q + 1))}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-[var(--primary)] font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <motion.button
                    onClick={(e) => {
                      handleAddToCart(e, quickViewProduct, quickViewQuantity);
                      setQuickViewProduct(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[var(--primary-20)] hover:brightness-90 hover:shadow-[var(--primary-30)] transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Add to Cart
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      setCheckoutProduct(quickViewProduct);
                      setCheckoutQuantity(quickViewQuantity);
                      setQuickViewProduct(null);
                      setIsCheckoutModalOpen(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white text-[var(--primary)] border-2 border-[var(--primary-30)] py-4 rounded-2xl font-bold hover:bg-[var(--primary-20)] transition-all flex items-center justify-center gap-2"
                  >
                    Buy Now
                  </motion.button>
                </div>
              ) : (
                <div className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-center cursor-not-allowed">
                  Sold Out
                </div>
              )}
              </div>

              {products.filter(p => p.id !== quickViewProduct.id).length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">You Might Also Like</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {products
                      .filter(p => p.id !== quickViewProduct.id)
                      .slice(0, 3)
                      .map(relatedProduct => (
                        <div
                          key={relatedProduct.id}
                          onClick={() => setQuickViewProduct(relatedProduct)}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 relative">
                            <Image 
                              src={relatedProduct.images[0]} 
                              alt={relatedProduct.name} 
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300" 
                            />
                            {relatedProduct.stock === 0 && <div className="absolute inset-0 bg-white/60" />}
                          </div>
                          <h4 className="text-sm font-semibold text-gray-700 truncate group-hover:text-[var(--primary)]">{relatedProduct.name}</h4>
                          <p className="text-sm font-bold text-green-600">
                            ₦{Number(relatedProduct.salePrice && Number(relatedProduct.salePrice) > 0 && Number(relatedProduct.salePrice) < Number(relatedProduct.price) ? relatedProduct.salePrice : relatedProduct.price).toLocaleString()}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsCheckoutModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-[95%] sm:w-full max-w-md relative shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Checkout</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="w-16 h-16 rounded-xl bg-white shrink-0 overflow-hidden relative">
                 {checkoutProduct.images && checkoutProduct.images.length > 0 ? (
                   <Image src={checkoutProduct.images[0]} alt={checkoutProduct.name} fill className="object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gray-200 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-gray-400"/></div>
                 )}
               </div>
               <div>
                 <h4 className="font-bold text-gray-900 line-clamp-1">{checkoutProduct.name}</h4>
                 <div className="flex items-center gap-2">
                   <p className="text-green-600 font-bold">
                     ₦{Number(checkoutProduct.salePrice && Number(checkoutProduct.salePrice) > 0 && Number(checkoutProduct.salePrice) < Number(checkoutProduct.price) ? checkoutProduct.salePrice : checkoutProduct.price).toLocaleString()}
                   </p>
                   {checkoutQuantity > 1 && (
                     <span className="text-gray-500 text-sm font-medium">x {checkoutQuantity}</span>
                   )}
                 </div>
               </div>
            </div>

            <div className="flex items-center justify-between mb-6 px-1">
              <span className="text-sm font-bold text-gray-700">Quantity</span>
              <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-1.5">
                <button 
                  onClick={() => setCheckoutQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-[var(--primary)] font-bold transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-900 w-4 text-center">{checkoutQuantity}</span>
                <button 
                  onClick={() => setCheckoutQuantity(q => Math.min(checkoutProduct.stock || 100, q + 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-[var(--primary)] font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBuyNowClick} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Card Information</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    required 
                    type="text" 
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    placeholder="Card Number" 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[var(--primary-20)] outline-none font-medium" 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <input 
                  required 
                  type="text" 
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  placeholder="MM/YY" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[var(--primary-20)] outline-none font-medium" 
                />
                <input 
                  required 
                  type="text" 
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                  placeholder="CVC" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[var(--primary-20)] outline-none font-medium" 
                />
              </div>
              <input 
                required 
                type="text" 
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                placeholder="Cardholder Name" 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[var(--primary-20)] outline-none font-medium" 
              />

              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
                <label htmlFor="saveCard" className="text-sm text-gray-600 cursor-pointer font-medium">Save card for future purchases</label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isProcessingPayment}
                className={`w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[var(--primary-20)] hover:brightness-90 transition-all mt-4 flex items-center justify-center gap-2 ${isProcessingPayment ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  `Pay ₦${(Number(checkoutProduct.salePrice && Number(checkoutProduct.salePrice) > 0 && Number(checkoutProduct.salePrice) < Number(checkoutProduct.price) ? checkoutProduct.salePrice : checkoutProduct.price) * checkoutQuantity).toLocaleString()}`
                )}
              </motion.button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={async () => {
                  setIsProcessingPayment(true);
                  await processOrder('pending');
                }}
                disabled={isProcessingPayment}
                className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Pay on Delivery
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Order Success Modal */}
      {isOrderSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsOrderSuccessOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl text-center relative z-10"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h3>
            <p className="text-gray-500 mb-8">Your order has been successfully placed.</p>
            
            {lastOrder && lastOrder.items.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left border border-gray-100">
                <p className="font-bold text-gray-900 line-clamp-1">{lastOrder.items[0].name}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500 font-medium">Quantity: {lastOrder.items[0].quantity}</span>
                  <span className="font-bold text-green-600">₦{lastOrder.total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={handleShareReceipt}
                className="w-full py-3.5 px-4 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share Receipt
              </button>
              <button 
                onClick={() => setIsOrderSuccessOpen(false)} 
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--primary)] text-white font-bold hover:brightness-90 transition-all shadow-lg shadow-[var(--primary-30)]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--primary-20)] flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
                <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this product? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <motion.button
                  onClick={() => setDeleteId(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={confirmDelete}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3 rounded-lg font-semibold text-white bg-[var(--primary)] hover:brightness-90 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Templates Modal */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
                <p className="text-gray-500 mt-1">Select a theme that matches your brand</p>
              </div>
              <button
                onClick={() => setIsTemplatesModalOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-[var(--primary)] shadow-lg shadow-[var(--primary-20)]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {template.isPremium && (
                    <div className="absolute top-3 right-3 z-10 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                  {template.isPopular && (
                    <div className="absolute top-3 left-3 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </div>
                  )}

                  <div
                    className="h-32 relative"
                    style={{ backgroundColor: template.colors.background }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div
                          className="w-8 h-8 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: template.colors.primary }}
                        ></div>
                        <div
                          className="w-12 h-2 rounded-full mx-auto"
                          style={{ backgroundColor: template.colors.secondary }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                    <div className="flex gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: template.colors.primary }}
                        title="Primary"
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: template.colors.secondary }}
                        title="Secondary"
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: template.colors.accent }}
                        title="Accent"
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: template.colors.background }}
                        title="Background"
                      ></div>
                    </div>
                  </div>

                  {selectedTemplate === template.id && (
                    <div className="absolute inset-0 bg-[var(--primary)]/10 flex items-center justify-center">
                      <Check className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-4 justify-end">
              <motion.button
                onClick={() => setIsTemplatesModalOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={async () => {
                  if (!selectedTemplate) return;

                  setIsApplyingTemplate(true);
                  try {
                    const template = templates.find(t => t.id === selectedTemplate);
                    if (template) {
                      await updateStoreSettings({
                        current_template: selectedTemplate,
                        template_colors: template.colors
                      });
                      setCurrentTemplate(selectedTemplate);
                      setTemplateColors(template.colors);
                      toast.success(`Applied ${template.name} template!`);
                      setIsTemplatesModalOpen(false);
                      setSelectedTemplate(null);
                    }
                  } catch (error) {
                    toast.error("Failed to apply template");
                  } finally {
                    setIsApplyingTemplate(false);
                  }
                }}
                disabled={!selectedTemplate || isApplyingTemplate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-xl font-semibold text-white transition-colors flex items-center gap-2 ${
                  selectedTemplate && !isApplyingTemplate
                    ? 'bg-[var(--primary)] hover:brightness-90'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isApplyingTemplate ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4" />
                    Apply Template
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 p-3 bg-[var(--primary)] text-white rounded-full shadow-lg z-40 hover:brightness-90 transition-colors"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {!isPreviewMode ? (
        <BottomNav />
      ) : (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 py-3 px-4 pb-6 z-50">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <Link href="/cart">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[var(--primary)] transition-colors"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--primary)] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">Cart</span>
              </motion.div>
            </Link>
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 text-[var(--primary)]"
            >
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-medium">Shop</span>
            </motion.button>
            <Link href="/orders">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[var(--primary)] transition-colors"
              >
                <Package className="w-6 h-6" />
                <span className="text-[10px] font-medium">Orders</span>
              </motion.div>
            </Link>
          </div>
        </div>
      )}

      </div>
    </div>

  );

}

const StoreDashboardPage = nextDynamic(() => Promise.resolve(DashboardContent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

const StoreDashboardPageComponent = nextDynamic(() => Promise.resolve(StoreDashboardPage), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

export default StoreDashboardPageComponent;
