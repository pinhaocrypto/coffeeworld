# CoffeeWorld

CoffeeWorld is a decentralized coffee shop discovery platform designed to deliver authentic reviews and real-time crowd insights—powered by Worldcoin’s WorldID verification.

## Overview

When searching for a cozy coffee shop, it’s often hard to tell which reviews are genuine. Many platforms are flooded with paid or fake comments that don’t reflect the actual experience. CoffeeWorld solves this problem by ensuring every review comes from a verified human using WorldID. In addition, our check-in feature provides real-time data on how crowded each coffee shop is, giving you a true picture of your surroundings.

## Features

- WorldID Verified Reviews:
Every review is linked to a unique, verified user, ensuring authenticity and trustworthiness.
- Real-Time Check-Ins:
Users can check in at their favorite coffee shops to update current occupancy. Color codes indicate crowd levels:
- 🟢 Relaxed (few people)
- 🟡 Moderate (some seating)
- 🔴 Crowded (likely to have a wait)
- Incentives for Engagement:
Businesses can reward reviews that receive significant community support, encouraging honest feedback and building a trusted community.

## How It Works

1. User Verification:
Using Worldcoin’s MiniKit, users verify their identity with WorldID before they can post a review or check in. This prevents fake reviews and ensures every interaction is backed by a real, unique human.
2. Review & Check-In System:
- Reviews: Verified users post reviews about the coffee shop’s products, environment, and service.
- Check-Ins: Users can check in to provide real-time data on the current crowd. This information is aggregated and color-coded for easy visualization.
3. Backend Verification:
The verification proof (including details like proof, merkle_root, and nullifier_hash) is sent to our backend for further validation, ensuring the integrity of every review.

## Technology Stack

- Frontend:
  - Next.js with TypeScript for a modern, scalable web application.
  - Tailwind CSS for rapid and responsive UI development.
- Backend:
  - Next.js API routes for handling secure server-side operations, such as verifying WorldID proofs and managing reviews.
- Third-Party Integrations:
  - Worldcoin MiniKit for identity verification.
  - Google Maps API for displaying nearby coffee shops (with our own custom review and check-in data).

## Setup & Installation

1. Clone the Repository:

git clone https://github.com/pinhaocrypto/coffeeworld.git
cd coffeeworld


2. Install Dependencies:

pnpm install


3. Set Up Environment Variables:
Create a .env.local file at the root of the project and add your keys:

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_WORLDCOIN_APP_ID=your_worldcoin_app_id
NEXTAUTH_SECRET=your_nextauth_secret


4. Run the Development Server:

pnpm dev


5. Deploy:
When you’re ready to deploy, use Vercel or your preferred deployment platform. Ensure your environment variables are configured in the deployment settings.

## Roadmap

- Complete World ID Verify Feature:
Finalize and optimize the verification process with Worldcoin’s MiniKit.
- Incentive Mechanism:
Develop and integrate a rewards system to encourage user check-ins and quality reviews.
- Expand to More Use Cases:
Enhance the platform with additional features like personalized recommendations and detailed analytics for coffee shop owners.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you have ideas for improvements or new features.

## License

This project is licensed under the MIT License.

⸻

CoffeeWorld aims to bring real, verified experiences to coffee enthusiasts everywhere. By ensuring every review and check-in comes from a genuine user, we empower consumers and businesses alike with trustworthy insights. Enjoy discovering your next favorite coffee spot—one real review at a time!

⸻

