import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// Mock data for coffee shops
const mockCoffeeShops = [
  {
    id: '1',
    name: 'Brew Haven',
    address: '123 Coffee Lane, Beantown',
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
    rating: 4.7,
    reviewCount: 42
  },
  {
    id: '2',
    name: 'The Roasted Bean',
    address: '456 Espresso Avenue, Brewville',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    rating: 4.3,
    reviewCount: 28
  },
  {
    id: '3',
    name: 'Morning Ritual',
    address: '789 Latte Boulevard, Arabica',
    image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80',
    rating: 4.9,
    reviewCount: 64
  },
  {
    id: '4',
    name: 'Caffeine Culture',
    address: '101 Mocha Street, Brewtown',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    rating: 4.5,
    reviewCount: 37
  },
  {
    id: '5',
    name: 'Artisan Pours',
    address: '202 Americano Road, Beanville',
    image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80',
    rating: 4.2,
    reviewCount: 19
  },
  {
    id: '6',
    name: 'Third Wave Brews',
    address: '303 Cappuccino Circle, Groundsville',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    rating: 4.6,
    reviewCount: 53
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock coffee shops
  res.status(200).json(mockCoffeeShops);
}
