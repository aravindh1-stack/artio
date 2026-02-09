import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Orders = () => {
  const { user, loading } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('id, status, payment_status, total_amount, created_at, order_items(id, product_id, quantity, price_at_purchase, products(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setOrders(data || []);
    };

    fetchOrders();
  }, [user]);

  const handleDownload = async (productId, itemId) => {
    setDownloadError('');
    setDownloadingId(itemId);

    try {
      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { productId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Download link not available.');

      window.location.href = data.url;
    } catch (err) {
      setDownloadError(err.message || 'Download failed.');
    } finally {
      setDownloadingId('');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Orders</h1>
          <Link to="/store">
            <Button variant="outline">Browse Store</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {downloadError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <Card className="p-8">
            <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold">Order {order.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: {order.status} · Payment: {order.payment_status || 'unpaid'}
                    </p>
                  </div>
                  <p className="text-lg font-bold">${Number(order.total_amount).toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.products?.name || 'Product'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty {item.quantity} · ${Number(item.price_at_purchase).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={order.payment_status !== 'paid' || downloadingId === item.id}
                        onClick={() => handleDownload(item.product_id, item.id)}
                      >
                        {downloadingId === item.id ? 'Preparing...' : 'Download'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
