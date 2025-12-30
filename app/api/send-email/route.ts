import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { type, email, orderId, amount, customerName } = await request.json();

    if (type !== 'order_confirmation') {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (!email || !orderId || !amount || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send confirmation email
    const { data, error } = await resend.emails.send({
      from: 'Fashion Store <orders@fashionstore.com>',
      to: email,
      subject: 'Order Confirmation - Fashion Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Order Confirmation</h1>
          <p>Dear ${customerName},</p>
          <p>Thank you for your order! Your order has been successfully placed.</p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #374151;">Order Details</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>

          <p>You will receive another email when your order ships. If you have any questions, please contact our support team.</p>

          <p>Best regards,<br>The Fashion Store Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
