// Using mock types for Worldcoin MiniKit as we're using a simulated authentication system
// instead of the actual Worldcoin integration
interface MiniAppPaymentSuccessPayload {
  status: string;
  transaction_id: string;
  amount: string;
  currency: string;
  timestamp: string;
  reference?: string;
}

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload;
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload;

    // IMPORTANT: Here we should fetch the reference you created in /initiate-payment to ensure the transaction we are verifying is the same one we initiated
    //   const reference = getReferenceFromDB();
    
    // Get the payment nonce from cookies
    const cookiesList = cookies();
    const reference = cookiesList.get("payment-nonce")?.value;

    console.log(reference);

    if (!reference) {
      return NextResponse.json({ success: false, error: "No payment reference found" });
    }

    // If you're using the actual Worldcoin integration, you'd want to verify the payment here
    // For our simulated system, we'll just assume it's valid if references match
    if (payload.reference === reference) {
      return NextResponse.json({ 
        success: true, 
        message: "Payment verified successfully" 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Payment reference mismatch" 
      });
    }
  } catch (error) {
    console.error("Error processing payment confirmation:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to process payment confirmation" 
    }, { status: 500 });
  }
}
