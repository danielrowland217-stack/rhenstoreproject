"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';
import { motion } from "framer-motion";
import { Store, Text, Image as ImageIcon, ArrowLeft, Save } from "lucide-react";
import { BottomNav } from "@/app/dashboard/BottomNav";
import { getUser } from "../../../../lib/supabaseClient";
import { getStoreSettings } from "../../../../lib/supabaseDb";

export default function StoreSettingsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
  });

  useEffect(() => {
    // Load existing data from Supabase
    const loadStoreSettings = async () => {
      const { data: user } = await getUser();
      if (user?.user) {
        const { data: settings } = await getStoreSettings(user.user.id);
        if (settings) {
          setFormData({
            storeName: settings.store_name || '',
            description: settings.description || '',
          });
          if (settings.logo_url) {
            setLogoPreview(settings.logo_url);
          }
        }
      }
    };
    loadStoreSettings();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      localStorage.setItem('store-name', formData.storeName);
      localStorage.setItem('store-description', formData.description);
      if (logoPreview) localStorage.setItem('store-logo', logoPreview);

      router.push('/store/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 pb-24 sm:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Store Settings</h1>
            <p className="text-gray-500">Update your store information.</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 space-y-6"
        >
          {/* Store Name */}
          <div className="relative">
            <Store className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input id="storeName" type="text" placeholder="Store Name" value={formData.storeName} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>

          {/* Description */}
          <div className="relative">
            <Text className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <textarea id="description" placeholder="Store Description" value={formData.description} onChange={handleChange} rows={4} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>

          {/* Image Upload */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition-colors"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="h-24 mx-auto object-contain" />
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Click to update store logo</p>
                <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </>
            )}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
          </motion.div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:bg-red-700 gap-2"
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
      <BottomNav />
    </div>
  );
}
