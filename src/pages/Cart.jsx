import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const Cart = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const total = getTotal();
  const totalWithTax = total * 1.1;
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderSummary, setOrderSummary] = useState([]);
  const [orderAddress, setOrderAddress] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [profileData, setProfileData] = useState({ fullName: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressActionError, setAddressActionError] = useState('');
  const [setDefaultOnSave, setSetDefaultOnSave] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const paymentInstructions = {
    bankName: 'Your Bank Name',
    accountName: 'Your Account Name',
    accountNumber: '0000000000',
    iban: 'IBAN00000000000000000000',
    whatsappNumber: '0000000000',
    email: 'payments@example.com',
  };

  const mapAddress = (address) => ({
    id: address.id,
    fullName: address.full_name || '',
    phone: address.phone || '',
    line1: address.address_line1 || '',
    line2: address.address_line2 || '',
    city: address.city || '',
    state: address.state || '',
    postalCode: address.postal_code || '',
    country: address.country || '',
    isDefault: Boolean(address.is_default),
  });

  const loadAddresses = async (userId) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      setAddressActionError(error.message);
      return;
    }

    const mapped = (data || []).map(mapAddress);
    setAddresses(mapped);

    const defaultAddress = mapped.find((address) => address.isDefault);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    } else if (mapped.length > 0) {
      setSelectedAddressId(mapped[0].id);
    }

    if (mapped.length === 0) {
      setShowAddressForm(true);
      setSetDefaultOnSave(true);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfileData({
          fullName: data.full_name || '',
          phone: data.phone || '',
        });
      }

      await loadAddresses(user.id);
    };

    fetchProfile();
  }, [user]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '') : value;
    setAddressForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const startAddAddress = () => {
    setEditingAddressId('');
    setAddressActionError('');
    setAddressForm({
      fullName: profileData.fullName || '',
      phone: profileData.phone || '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });
    setSetDefaultOnSave(addresses.length === 0);
    setShowAddressForm(true);
  };

  const startEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressActionError('');
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });
    setSetDefaultOnSave(address.isDefault);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    setAddressActionError('');

    if (
      !addressForm.fullName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.line1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.postalCode.trim() ||
      !addressForm.country.trim()
    ) {
      setAddressActionError('Please fill in all required address fields.');
      return;
    }

    setIsSavingAddress(true);

    try {
      if (setDefaultOnSave) {
        const { error: resetError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);

        if (resetError) throw resetError;
      }

      const payload = {
        user_id: user.id,
        full_name: addressForm.fullName,
        phone: addressForm.phone,
        address_line1: addressForm.line1,
        address_line2: addressForm.line2,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postalCode,
        country: addressForm.country,
        is_default: setDefaultOnSave,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = editingAddressId
        ? await supabase
            .from('addresses')
            .update(payload)
            .eq('id', editingAddressId)
            .select('id')
            .single()
        : await supabase
            .from('addresses')
            .insert(payload)
            .select('id')
            .single();

      if (error) throw error;

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: addressForm.fullName,
          phone: addressForm.phone,
          updated_at: new Date().toISOString(),
        });

      setShowAddressForm(false);
      setEditingAddressId('');
      setSelectedAddressId(data.id);
      await loadAddresses(user.id);
    } catch (err) {
      setAddressActionError(err.message || 'Unable to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    setAddressActionError('');

    try {
      const { error: resetError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      const { error: setError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (setError) throw setError;

      setSelectedAddressId(addressId);
      await loadAddresses(user.id);
    } catch (err) {
      setAddressActionError(err.message || 'Unable to update default address.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setAddressActionError('');

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
      }

      await loadAddresses(user.id);
    } catch (err) {
      setAddressActionError(err.message || 'Unable to delete address.');
    }
  };

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  const hasRequiredAddress = Boolean(
    selectedAddress?.fullName?.trim() &&
    selectedAddress?.phone?.trim() &&
    selectedAddress?.line1?.trim() &&
    selectedAddress?.city?.trim() &&
    selectedAddress?.state?.trim() &&
    selectedAddress?.postalCode?.trim() &&
    selectedAddress?.country?.trim()
  );

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    if (items.length === 0) {
      return;
    }

    if (!selectedAddress) {
      setOrderError('Please select or add a delivery address.');
      return;
    }

    if (!hasRequiredAddress) {
      setOrderError('Please complete the required delivery details.');
      return;
    }

    const placeOrder = async () => {
      setOrderError('');
      setPlacingOrder(true);

      try {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            total_amount: totalWithTax,
            status: 'pending',
            payment_status: 'unpaid',
            shipping_address: {
              full_name: selectedAddress.fullName,
              phone: selectedAddress.phone,
              email: user.email,
              line1: selectedAddress.line1,
              line2: selectedAddress.line2,
              city: selectedAddress.city,
              state: selectedAddress.state,
              postal_code: selectedAddress.postalCode,
              country: selectedAddress.country,
            },
          })
          .select('id')
          .single();

        if (orderError) throw orderError;

        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        setOrderId(order.id);
        setOrderSummary(items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })));
        setOrderAddress(selectedAddress);
        setOrderTotal(totalWithTax);
        setOrderSuccess(true);
        clearCart();
      } catch (err) {
        setOrderError(err.message || 'Order failed. Please try again.');
      } finally {
        setPlacingOrder(false);
      }
    };

    placeOrder();
  };

  if (orderSuccess) {
    const whatsappLink = `https://wa.me/${paymentInstructions.whatsappNumber}?text=${encodeURIComponent(
      `Hello, I placed an order (${orderId}). Please share payment instructions.`
    )}`;
    const itemsText = orderSummary.length
      ? orderSummary.map((item) => `- ${item.name} x${item.quantity} ($${item.price})`).join('\n')
      : '- (items not available)';
    const addressText = orderAddress
      ? [
          orderAddress.fullName,
          orderAddress.phone,
          orderAddress.line1,
          orderAddress.line2,
          `${orderAddress.city}, ${orderAddress.state} ${orderAddress.postalCode}`,
          orderAddress.country,
        ]
          .filter(Boolean)
          .join('\n')
      : '(address not available)';
    const emailBody = [
      `Hello, I placed an order (${orderId}).`,
      '',
      'Order items:',
      itemsText,
      '',
      'Delivery address:',
      addressText,
      '',
      `Total: $${orderTotal.toFixed(2)}`,
      '',
      'Please share payment instructions.',
    ].join('\n');
    const emailLink = `mailto:${paymentInstructions.email}?subject=${encodeURIComponent(
      `Order ${orderId} payment`
    )}&body=${encodeURIComponent(emailBody)}`;

    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="max-w-2xl w-full px-4 py-12">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-3">Order placed</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your order has been created. Use the details below to complete payment.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="font-semibold break-all">{orderId}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h2 className="font-semibold mb-2">Bank Transfer</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bank: {paymentInstructions.bankName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Account Name: {paymentInstructions.accountName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Account Number: {paymentInstructions.accountNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  IBAN: {paymentInstructions.iban}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h2 className="font-semibold mb-2">WhatsApp</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Send your payment confirmation to our WhatsApp.
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium"
                >
                  Message on WhatsApp
                </a>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <h2 className="font-semibold mb-2">Email</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Email your payment confirmation or questions.
                </p>
                <a
                  href={emailLink}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium"
                >
                  Email Us
                </a>
              </div>
            </div>

            <Link to="/store">
              <Button size="lg" className="w-full">Continue Shopping</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-700" />
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Discover our collection and add items to your cart
            </p>
            <Link to="/store">
              <Button size="lg">Browse Store</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Shopping Cart</h1>
            <button
              onClick={clearCart}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} hover={false} className="p-6">
                  <div className="flex gap-6">
                    <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={item.image_path}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.dimensions}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${item.price} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card hover={false} className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Delivery Details</h2>
                  <Button variant="outline" size="sm" onClick={startAddAddress}>
                    Add Address
                  </Button>
                </div>

                {addressActionError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    {addressActionError}
                  </p>
                )}

                {addresses.length > 0 && !showAddressForm && (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 rounded-lg border ${
                          selectedAddressId === address.id
                            ? 'border-black dark:border-white'
                            : 'border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{address.fullName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.phone}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.line1} {address.line2}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.country}
                            </p>
                            {address.isDefault && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Default</span>
                            )}
                          </div>
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditAddress(address)}
                          >
                            Edit
                          </Button>
                          {!address.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(address.id)}
                              className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                            >
                              Set default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      name="fullName"
                      value={addressForm.fullName}
                      onChange={handleAddressChange}
                      required
                    />
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      required
                    />
                    <Input
                      label="Address Line 1"
                      name="line1"
                      value={addressForm.line1}
                      onChange={handleAddressChange}
                      required
                    />
                    <Input
                      label="Address Line 2"
                      name="line2"
                      value={addressForm.line2}
                      onChange={handleAddressChange}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        required
                      />
                      <Input
                        label="State"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Postal Code"
                        name="postalCode"
                        value={addressForm.postalCode}
                        onChange={handleAddressChange}
                        required
                      />
                      <Input
                        label="Country"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={setDefaultOnSave}
                        onChange={(e) => setSetDefaultOnSave(e.target.checked)}
                      />
                      Set as default address
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={handleSaveAddress}
                        disabled={isSavingAddress}
                      >
                        {isSavingAddress ? 'Saving...' : 'Save address'}
                      </Button>
                      {addresses.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddressId('');
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
              <Card hover={false} className="p-6 sticky top-24">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax</span>
                    <span>${(total * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>${totalWithTax.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={placingOrder}
                  >
                    <CreditCard className="w-5 h-5" />
                    {placingOrder ? 'Placing Order...' : 'Proceed to Checkout'}
                  </Button>
                  {orderError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {orderError}
                    </p>
                  )}
                  <Link to="/store" className="block">
                    <Button variant="outline" size="lg" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <h3 className="font-semibold mb-2">Manual Payment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    After placing the order, you can complete payment by bank transfer or WhatsApp.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;
