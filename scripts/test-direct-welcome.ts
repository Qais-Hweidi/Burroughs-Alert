/**
 * Test welcome email directly with your real email
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testDirectWelcome() {
  console.log('📧 Testing Direct Welcome Email...\n');

  try {
    // Send welcome email directly
    const { sendWelcomeEmail } = await import(
      '../src/lib/notifications/email-service'
    );

    console.log('Sending welcome email to hweidiqais@pm.me...');
    const result = await sendWelcomeEmail('hweidiqais@pm.me');

    if (result.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log('\n📬 Check your email inbox for the welcome message.');
    } else {
      console.log('❌ Welcome email failed to send');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error testing welcome email:', error);
    throw error;
  }
}

testDirectWelcome();
