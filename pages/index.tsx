import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AuthButton from '@/components/AuthButton';
import CoffeeShopCard from '@/components/CoffeeShopCard';

interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
}

export default function Home() {
  const { data: session } = useSession();
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Only fetch coffee shops if user is authenticated
    if (session) {
      fetchCoffeeShops();
    } else {
      setCoffeeShops([]);
      setLoading(false);
    }
  }, [session]);

  const fetchCoffeeShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coffeeShops');
      if (!response.ok) {
        throw new Error('Failed to fetch coffee shops');
      }
      const data = await response.json();
      setCoffeeShops(data);
    } catch (error) {
      console.error('Error fetching coffee shops:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold mb-4">Find The Perfect Cup</h1>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Discover and review the best coffee shops in your area, authenticated with Worldcoin ID for a trusted community experience.
        </p>
        <AuthButton />
      </section>

      {session ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">Coffee Shops Near You</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-700"></div>
            </div>
          ) : coffeeShops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coffeeShops.map((shop) => (
                <CoffeeShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg">No coffee shops found. Check back soon!</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
