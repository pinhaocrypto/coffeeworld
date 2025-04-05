import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import ReviewForm from '../../components/ReviewForm';
import ReviewList from '../../components/ReviewList';

interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  description?: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  date: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
}

interface CoffeeShopDetailProps {
  shop: CoffeeShop;
  reviews: Review[];
}

export default function CoffeeShopDetail({ shop, reviews: initialReviews }: CoffeeShopDetailProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const handleAddReview = (newReview: Review) => {
    setReviews([newReview, ...reviews]);
  };

  const handleVote = async (reviewId: string, voteType: 'up' | 'down') => {
    if (!session) return;

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          voteType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const updatedReview = await response.json();
      
      // Update the reviews state with the updated review
      setReviews(
        reviews.map((review) =>
          review.id === updatedReview.id ? updatedReview : review
        )
      );
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Render stars for rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Half star
    if (halfStar) {
      stars.push(
        <svg key="half" className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`half-gradient-detail`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill={`url(#half-gradient-detail)`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };

  return (
    <div>
      <Link href="/" className="inline-flex items-center text-amber-700 hover:text-amber-900 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Back to all coffee shops
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 w-full">
          <Image 
            src={shop.image}
            alt={shop.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
          <p className="text-gray-600 mb-3">{shop.address}</p>
          
          <div className="flex items-center mb-4">
            <div className="flex mr-2">
              {renderStars(shop.rating)}
            </div>
            <span className="text-gray-700">
              {shop.rating.toFixed(1)} ({shop.reviewCount} {shop.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          
          {shop.description && (
            <p className="text-gray-700 mb-6">{shop.description}</p>
          )}
        </div>
      </div>

      {session ? (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Leave a Review</h2>
          <ReviewForm coffeeShopId={shop.id} onReviewAdded={handleAddReview} />
        </div>
      ) : (
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-center text-amber-800">
            Please log in with Worldcoin to leave a review.
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        {reviews.length > 0 ? (
          <ReviewList reviews={reviews} onVote={handleVote} />
        ) : (
          <p className="text-center py-8 bg-gray-50 rounded-lg">
            No reviews yet. Be the first to leave a review!
          </p>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  
  // This would typically call your API or database
  // For demo purposes, we'll use mock data
  
  // Mock coffee shops data (same as in the API route)
  const mockCoffeeShops = [
    {
      id: '1',
      name: 'Brew Haven',
      address: '123 Coffee Lane, Beantown',
      image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
      rating: 4.7,
      reviewCount: 42,
      description: 'A cozy retreat serving specialty coffee from ethically sourced beans. Known for their pour-overs and house-made pastries.'
    },
    {
      id: '2',
      name: 'The Roasted Bean',
      address: '456 Espresso Avenue, Brewville',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      rating: 4.3,
      reviewCount: 28,
      description: 'A rustic coffee shop with in-house roasting. Their signature blend combines notes of chocolate, caramel, and citrus.'
    },
    {
      id: '3',
      name: 'Morning Ritual',
      address: '789 Latte Boulevard, Arabica',
      image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80',
      rating: 4.9,
      reviewCount: 64,
      description: 'An artisanal coffee experience with a minimalist aesthetic. Each cup is crafted with precision using single-origin beans.'
    },
    {
      id: '4',
      name: 'Caffeine Culture',
      address: '101 Mocha Street, Brewtown',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
      rating: 4.5,
      reviewCount: 37,
      description: 'A vibrant community hub with a focus on coffee education. Their baristas are award-winning and offer regular workshops.'
    },
    {
      id: '5',
      name: 'Artisan Pours',
      address: '202 Americano Road, Beanville',
      image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80',
      rating: 4.2,
      reviewCount: 19,
      description: 'A charming café specializing in latte art and cold brews. Their seasonal drinks incorporate local ingredients and spices.'
    },
    {
      id: '6',
      name: 'Third Wave Brews',
      address: '303 Cappuccino Circle, Groundsville',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      rating: 4.6,
      reviewCount: 53,
      description: 'A modern coffee lab pushing the boundaries of brewing techniques. Their experimental methods result in unique flavor profiles.'
    }
  ];
  
  // Find the coffee shop by ID
  const shop = mockCoffeeShops.find(shop => shop.id === id);
  
  // If shop not found, return 404
  if (!shop) {
    return {
      notFound: true,
    };
  }
  
  // Mock reviews for this coffee shop
  const mockReviews = [
    {
      id: '101',
      userId: 'user1',
      userName: 'Coffee Lover',
      rating: 5,
      content: 'Amazing coffee and atmosphere! The baristas are knowledgeable and friendly. I especially loved their signature pour-over.',
      date: '2025-03-15T08:30:00Z',
      upvotes: 12,
      downvotes: 1,
      userVote: null as ('up' | 'down' | null)
    },
    {
      id: '102',
      userId: 'user2',
      userName: 'Espresso Enthusiast',
      rating: 4,
      content: 'Great espresso with perfect crema. The pastries are delicious too. Only downside is it gets very crowded on weekends.',
      date: '2025-03-10T14:45:00Z',
      upvotes: 8,
      downvotes: 2,
      userVote: null as ('up' | 'down' | null)
    },
    {
      id: '103',
      userId: 'user3',
      userName: 'Caffeine Connoisseur',
      rating: 4.5,
      content: 'The single-origin Ethiopian beans made for one of the best coffees I\'ve had in months. The ambiance is perfect for remote work.',
      date: '2025-03-05T11:20:00Z',
      upvotes: 15,
      downvotes: 0,
      userVote: null as ('up' | 'down' | null)
    }
  ];
  
  return {
    props: {
      shop,
      reviews: mockReviews,
    },
  };
};
