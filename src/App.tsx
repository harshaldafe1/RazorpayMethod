/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingCart, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

// Load Razorpay Script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    const res = await loadRazorpayScript();
    if (!res) {
      setStatus('error');
      setMessage('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Order on Server
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500 }) // 500 INR
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: orderData.key_id, // Dynamically use the key from the backend
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Acme Corp",
        description: "Test Transaction",
        image: "https://picsum.photos/seed/razorpay/100/100",
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Verify Payment on Server
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyResponse.json();
          if (verifyData.success) {
            setStatus('success');
            setMessage(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          } else {
            setStatus('error');
            setMessage('Payment verification failed.');
          }
        },
        prefill: {
          name: "John Doe",
          email: "john.doe@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2563eb" // Tailwind blue-600
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setStatus('error');
        setMessage(`Payment failed: ${response.error.description}`);
      });
      paymentObject.open();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Premium Plan</h1>
            <p className="text-blue-100 mt-1">Unlock all features</p>
          </div>
          <ShoppingCart className="w-8 h-8 opacity-80" />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-3xl font-bold text-gray-900">₹500</span>
          </div>

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              </motion.div>
              <div>
                <h3 className="font-semibold">Payment Successful</h3>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              </motion.div>
              <div>
                <h3 className="font-semibold">Payment Failed</h3>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </motion.div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay with Razorpay
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Secured by Razorpay. You will need to configure your API keys in the app settings.
          </p>
        </div>
      </div>
    </div>
  );
}
