import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReviewForm from '@/components/ReviewForm';
import ReviewItem from '@/components/ReviewItem';
import { Review } from '@/types/review';
import AuthButton from '@/components/AuthButton';

interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  description?: string;
  placeId?: string;
}

interface CoffeeShopDetailProps {
  shop: CoffeeShop;
  initialReviews: Review[];
}

export default function CoffeeShopDetail({ shop, initialReviews }: CoffeeShopDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews when the component mounts or when the shop ID changes
  useEffect(() => {
    if (shop?.id) {
      fetchReviews();
    }
  }, [shop?.id]);

  // Function to fetch reviews for the current coffee shop
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/reviews?coffeeShopId=${shop.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Unable to load reviews. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle when a new review is added
  const handleReviewAdded = (newReview: Review) => {
    setReviews(prevReviews => [newReview, ...prevReviews]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="text-amber-600 hover:text-amber-700 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Coffee Shops
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 sm:h-96">
          <Image
            src={shop.image || 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80'}
            alt={shop.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{shop.name}</h1>
              <p className="text-gray-600 mt-1">{shop.address}</p>
            </div>
            <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full">
              <svg className="w-5 h-5 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-amber-700 font-medium">{shop.rating.toFixed(1)}</span>
              <span className="text-gray-500 ml-1">({shop.reviewCount})</span>
            </div>
          </div>

          {shop.description && (
            <div className="mt-4 text-gray-700">
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p>{shop.description}</p>
            </div>
          )}

          {/* Google Maps link if available */}
          {shop.placeId && (
            <div className="mt-4">
              <a 
                href={`https://www.google.com/maps/place/?q=place_id:${shop.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View on Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">Reviews</h2>
        
        {/* Worldcoin Auth Message */}
        {!session ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Sign in with Worldcoin to join the discussion</h3>
            <p className="text-gray-600 mb-4">
              To leave reviews and vote on others&apos; reviews, you&apos;ll need to verify with Worldcoin.
            </p>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            <ReviewForm coffeeShopId={shop.id} onReviewAdded={handleReviewAdded} />
          </div>
        )}
        
        {/* Reviews list */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-700"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No reviews yet for this coffee shop.</p>
              {session && (
                <p>Be the first to share your experience!</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </>
          )}
        </div>
      </div>
      <div className="p-4 bg-yellow-50 rounded-lg mb-4">
        <p className="text-yellow-800">
          {session ? (
            <>You&apos;re verified with Worldcoin. You can leave reviews and vote.</>
          ) : (
            <>Please verify with Worldcoin to leave reviews and vote on other reviews.</>
          )}
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  
  try {
    // In a real application, you would fetch the coffee shop data from your API
    // For now, we'll use mock data
    const shop = {
      id: id as string,
      name: 'Brew Haven',
      address: '123 Coffee Lane, Seattle, WA',
      image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
      rating: 4.7,
      reviewCount: 42,
      description: 'A cozy local coffee shop with artisanal brews and a warm atmosphere. Perfect for both working and casual meetups. Our baristas are true coffee experts, and we source our beans directly from sustainable farms around the world.',
      placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' // Example Google Maps place ID
    };
    
    // Fetch initial reviews
    // In a real application, this would come from your API
    const initialReviews: Review[] = [];
    
    return {
      props: {
        shop,
        initialReviews,
      },
    };
  } catch (error) {
    console.error('Error fetching coffee shop details:', error);
    return {
      notFound: true,
    };
  }
};
