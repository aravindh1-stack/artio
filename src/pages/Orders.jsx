import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  // Auth Protection: User illana login-ku poga vekkum
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  // Neon DB-la irundhu orders fetch panna
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const userId = user.id || user.email;
        const response = await fetch(`/api/admin/orders?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load orders');
        }
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Orders fetch panna mudiyala. Check connection.');
      }
    };
    fetchOrders();
  }, [user]);

  // Secure Download Logic
  const handleDownload = async (productId, itemId) => {
    setDownloadError('');
    setDownloadingId(itemId);
    
    try {
      // 1. Backend-ku request anupuvom (Signed URL kekka)
      // 2. Neon-la payment status 'paid'-ah irundha backend signed URL tharum
      // 3. Adha use panni download start pannuvom
      
      console.log(`Downloading high-res poster for product: ${productId}`);
      
      // Temporary logic:
      // window.location.href = `/api/download/${productId}`;
      
    } catch (err) {
      setDownloadError(err?.message || 'Download failed. Please try again.');
    } finally {
      setDownloadingId('');
    }
  };

  if (loading) return <div className="pt-20 text-center">Loading Artio Gallery...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Orders</h1>
          <Link to="/store">
            <Button variant="outline">Browse Store</Button>
          </Link>
        </div>

        {/* Error Notifications */}
        {(error || downloadError) && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error || downloadError}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Neenga inum posters purchase pannala.</p>
            <Link to="/store">
                <Button>Start Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6 border-l-4 border-l-blue-500">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-lg">Order #{order.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <span className="capitalize">{order.status}</span> · 
                      Payment: <span className={order.payment_status === 'paid' ? 'text-green-500' : 'text-orange-500'}>
                        {order.payment_status || 'unpaid'}
                      </span>
                    </p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">${Number(order.total_amount).toFixed(2)}</p>
                </div>

                <div className="space-y-3 mt-4 border-t pt-4 dark:border-gray-800">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.products?.name || 'Artio Poster'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty {item.quantity} · ${Number(item.price_at_purchase).toFixed(2)}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant={order.payment_status === 'paid' ? "primary" : "outline"}
                        disabled={order.payment_status !== 'paid' || downloadingId === item.id}
                        onClick={() => handleDownload(item.product_id, item.id)}
                      >
                        {downloadingId === item.id ? 'Securing Link...' : 
                         order.payment_status === 'paid' ? 'Download High-Res' : 'Payment Required'}
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