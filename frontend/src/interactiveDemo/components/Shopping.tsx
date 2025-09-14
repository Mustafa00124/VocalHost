import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDemoState } from '../state/demoStateProvider';

interface ShoppingProps {
  agentType: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  sizes: string[];
  colors: string[];
}

const Shopping: React.FC<ShoppingProps> = ({ agentType }) => {
  const { theme } = useTheme();
  const { state, addToCart, removeFromCart, updateCartQuantity } = useDemoState();
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: ''
  });
  
  // Get cart from state
  const cart = state.shopping[agentType] || [];

  // Sample products using the images from public folder
  const products: Product[] = [
    {
      id: '1',
      name: 'Classic T-Shirt',
      price: 29.99,
      image: '/classictshirt.jpg',
      description: 'Comfortable cotton t-shirt in classic fit',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Navy', 'Gray']
    },
    {
      id: '2',
      name: 'Vintage Hoodie',
      price: 59.99,
      image: '/vintagehoodie.jpg',
      description: 'Retro-style hoodie with vintage wash',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Gray', 'Brown']
    },
    {
      id: '3',
      name: 'Denim Jacket',
      price: 79.99,
      image: '/denimjacket.jpg',
      description: 'Classic denim jacket with modern fit',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Black', 'Light Blue']
    },
    {
      id: '4',
      name: 'Summer Dress',
      price: 49.99,
      image: '/summerdress.jpg',
      description: 'Light and breezy summer dress',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Floral', 'White', 'Pink', 'Blue']
    }
  ];

  // Add product to cart
  const handleAddToCart = (product: Product, size: string = 'M', color: string = 'Default') => {
    const cartItem = {
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      size,
      color
    };

    addToCart(agentType, cartItem);
  };

  // Update cart item quantity
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(agentType, itemId);
    } else {
      updateCartQuantity(agentType, itemId, quantity);
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(agentType, itemId);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!checkoutData.customerName || !checkoutData.customerEmail || !checkoutData.shippingAddress) {
      alert('Please fill in all checkout fields');
      return;
    }

    const orderId = `order_${Date.now()}`;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Clear cart and reset checkout
    cart.forEach(item => removeFromCart(agentType, item.id));
    setShowCheckout(false);
    setCheckoutData({ customerName: '', customerEmail: '', shippingAddress: '' });
    
    alert(`Order #${orderId} confirmed! Total: $${total.toFixed(2)}`);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Show checkout page instead of main shopping interface
  if (showCheckout) {
    return (
      <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header with Back Button */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCheckout(false)}
              className={`p-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Back
            </button>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Checkout
            </h2>
          </div>
        </div>

        {/* Checkout Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            {/* Order Summary */}
            <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Order Summary
              </h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.name} x{item.quantity}
                    </span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Total:
                  </span>
                  <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={checkoutData.customerName}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={checkoutData.customerEmail}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Shipping Address *
                </label>
                <textarea
                  value={checkoutData.shippingAddress}
                  onChange={(e) => setCheckoutData({ ...checkoutData, shippingAddress: e.target.value })}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter shipping address"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Buy Button */}
            <div className="mt-6">
              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-lg"
              >
                Buy Now - ${cartTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Products Section - Left Side (Wider) */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Products
        </h2>
        
        <div className="space-y-4">
          {products.map((product) => (
            <motion.div
              key={product.id}
              className={`p-4 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm mb-1 truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </h3>
                  
                  <p className={`text-xs mb-2 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-3 py-1 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Section - Right Side (Much Narrower) */}
      <div className={`w-48 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
        <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Cart ({cartItemCount})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center py-6">
              <div className={`text-3xl mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                🛒
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Your cart is empty
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {item.name}
                      </h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.size} • {item.color}
                      </p>
                      <div className="mt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                              theme === 'dark' 
                                ? 'bg-red-600 text-white hover:bg-red-500' 
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                              theme === 'dark' 
                                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            −
                          </button>
                          <span className={`text-xs w-3 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                              theme === 'dark' 
                                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Total: ${cartTotal.toFixed(2)}
              </span>
            </div>
            
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;
