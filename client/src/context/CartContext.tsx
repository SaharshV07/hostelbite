import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  addItem: (item: MenuItem, quantity?: number, customizationNotes?: string) => boolean;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hostelbite_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [vendorId, setVendorId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY + '_vendor');
      return saved || null;
    } catch {
      return null;
    }
  });

  const [vendorName, setVendorName] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY + '_vendor_name');
      return saved || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    if (vendorId) localStorage.setItem(CART_STORAGE_KEY + '_vendor', vendorId);
    else localStorage.removeItem(CART_STORAGE_KEY + '_vendor');

    if (vendorName) localStorage.setItem(CART_STORAGE_KEY + '_vendor_name', vendorName);
    else localStorage.removeItem(CART_STORAGE_KEY + '_vendor_name');
  }, [items, vendorId, vendorName]);

  const addItem = (item: MenuItem, quantity = 1, customizationNotes = ''): boolean => {
    if (!item.availability) {
      alert(`"${item.name}" is currently out of stock.`);
      return false;
    }

    // Single-vendor cart rule check (FR-ORD-01)
    if (vendorId && vendorId !== item.vendor_id && items.length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart already contains items from "${vendorName}". You can only order from one vendor at a time. Do you want to clear your cart and start a new order with this vendor?`
      );
      if (!confirmSwitch) {
        return false;
      }
      setItems([{ item, quantity, customizationNotes }]);
      setVendorId(item.vendor_id);
      setVendorName(item.vendor_name || 'Selected Vendor');
      return true;
    }

    setVendorId(item.vendor_id);
    setVendorName(item.vendor_name || 'Selected Vendor');

    setItems(prev => {
      const existingIndex = prev.findIndex(ci => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (customizationNotes) {
          updated[existingIndex].customizationNotes = customizationNotes;
        }
        return updated;
      }
      return [...prev, { item, quantity, customizationNotes }];
    });

    return true;
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(ci => (ci.item.id === itemId ? { ...ci, quantity } : ci))
    );
  };

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const filtered = prev.filter(ci => ci.item.id !== itemId);
      if (filtered.length === 0) {
        setVendorId(null);
        setVendorName(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setItems([]);
    setVendorId(null);
    setVendorName(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_STORAGE_KEY + '_vendor');
    localStorage.removeItem(CART_STORAGE_KEY + '_vendor_name');
  };

  const subtotal = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const deliveryFee = items.length > 0 ? 15.0 : 0;
  const platformFee = items.length > 0 ? 5.0 : 0;
  const totalAmount = items.length > 0 ? Number((subtotal + deliveryFee + platformFee).toFixed(2)) : 0;
  const itemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        vendorId,
        vendorName,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee,
        platformFee,
        totalAmount,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
