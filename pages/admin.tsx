import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  reviewCount: number;
  joined: string;
}

interface RewardTransaction {
  id: string;
  userId: string;
  amount: number;
  status: string;
  timestamp: string;
  txHash: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Mock users data for admin panel
  useEffect(() => {
    if (session) {
      // In a real app, this would be fetched from an API
      const mockUsers = [
        {
          id: 'user1',
          name: 'Coffee Lover',
          reviewCount: 12,
          joined: '2025-01-15T12:30:00Z'
        },
        {
          id: 'user2',
          name: 'Espresso Enthusiast',
          reviewCount: 8,
          joined: '2025-02-03T09:45:00Z'
        },
        {
          id: 'user3',
          name: 'Caffeine Connoisseur',
          reviewCount: 15,
          joined: '2025-01-20T15:20:00Z'
        },
        {
          id: 'user4',
          name: 'Brew Master',
          reviewCount: 6,
          joined: '2025-03-05T10:15:00Z'
        },
        {
          id: 'user5',
          name: 'Latte Artist',
          reviewCount: 10,
          joined: '2025-02-18T14:30:00Z'
        }
      ];
      setUsers(mockUsers);
      
      // Mock transaction history
      const mockTransactions = [
        {
          id: 'tx-1',
          userId: 'user1',
          amount: 15,
          status: 'success',
          timestamp: '2025-03-28T14:30:00Z',
          txHash: '0x3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
        },
        {
          id: 'tx-2',
          userId: 'user3',
          amount: 20,
          status: 'success',
          timestamp: '2025-03-25T11:15:00Z',
          txHash: '0x7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e'
        }
      ];
      setTransactions(mockTransactions);
    }
  }, [session]);

  const handleSendReward = async () => {
    if (!selectedUser || rewardAmount <= 0) {
      setMessage({
        type: 'error',
        text: 'Please select a user and enter a valid amount'
      });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          amount: rewardAmount,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reward');
      }
      
      const data = await response.json();
      
      // Add new transaction to the list
      setTransactions([data.transaction, ...transactions]);
      
      setMessage({
        type: 'success',
        text: `Successfully sent ${rewardAmount} tokens to user!`
      });
      
      // Reset form
      setSelectedUser('');
      setRewardAmount(10);
      
    } catch (error) {
      console.error('Error sending reward:', error);
      setMessage({
        type: 'error',
        text: 'Failed to send reward. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Truncate transaction hash for display
  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  if (!session) {
    return null; // This component will redirect in useEffect
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-amber-700 hover:text-amber-900">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reward Distribution Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Distribute Rewards</h2>
          <p className="text-gray-600 mb-4">
            Send tokens to users who have contributed valuable reviews.
          </p>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="user-select">
              Select User
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.reviewCount} reviews)
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="amount-input">
              Reward Amount
            </label>
            <input
              id="amount-input"
              type="number"
              min="1"
              max="100"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          {message && (
            <div className={`mb-4 p-3 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}
          
          <button
            onClick={handleSendReward}
            disabled={isLoading || !selectedUser}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Send Reward'
            )}
          </button>
        </div>
        
        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          
          {transactions.length > 0 ? (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const user = users.find(u => u.id === tx.userId);
                    return (
                      <tr key={tx.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{user?.name || 'Unknown User'}</td>
                        <td className="py-3">{tx.amount} tokens</td>
                        <td className="py-3">{formatDate(tx.timestamp)}</td>
                        <td className="py-3 font-mono text-sm">
                          <a 
                            href={`https://etherscan.io/tx/${tx.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {truncateHash(tx.txHash)}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>
      
      {/* User Management */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">User ID</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Reviews</th>
                <th className="text-left py-2">Joined</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-mono text-sm">{user.id}</td>
                  <td className="py-3">{user.name}</td>
                  <td className="py-3">{user.reviewCount}</td>
                  <td className="py-3">{formatDate(user.joined)}</td>
                  <td className="py-3">
                    <button 
                      onClick={() => {
                        setSelectedUser(user.id);
                        setRewardAmount(10);
                        document.getElementById('user-select')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-amber-700 hover:text-amber-900"
                    >
                      Reward
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
