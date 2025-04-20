// Gemini AI service integration
const GEMINI_API_KEY = "AIzaSyC-lrO7LdB0tkWcUIoiCBhI3Dgs_OeEUXI";
const GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
const GEMINI_PRO_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum requests per minute
  timeWindow: 60 * 1000, // 1 minute in milliseconds
};

let requestCount = 0;
let lastResetTime = Date.now();

// Function to check rate limit
function checkRateLimit() {
  const now = Date.now();
  if (now - lastResetTime > RATE_LIMIT.timeWindow) {
    requestCount = 0;
    lastResetTime = now;
  }
  return requestCount < RATE_LIMIT.maxRequests;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { currencies } from './currency';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface ReceiptData {
  description: string;
  amount: number;
  merchant: string;
  date: string;
  category: string;
  type: 'expense' | 'income';
  currency?: string;
}

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptData | null> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });

    const prompt = `Analyze this receipt image and extract the following information:
1. Description of the purchase
2. Total amount paid
3. Merchant/store name
4. Date of purchase
5. Category (choose from: Food, Transportation, Shopping, Entertainment, Bills, Healthcare, Education, Other)
6. Type (expense or income)
7. Currency used (identify from the following list: ${currencies.map(c => `${c.code} (${c.name})`).join(', ')})

Return the data in this exact JSON format:
{
  "description": "string",
  "amount": number,
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "category": "string",
  "type": "expense" or "income",
  "currency": "currency code"
}

If any field cannot be determined, use null for that field.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const receiptData = JSON.parse(jsonMatch[0]) as ReceiptData;
    
    // Validate currency
    if (receiptData.currency && !currencies.find(c => c.code === receiptData.currency)) {
      receiptData.currency = 'USD'; // Default to USD if invalid currency
    }

    return receiptData;
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    return null;
  }
}

// Function to get financial tips based on transaction
export async function getTransactionTips(transaction: any) {
  try {
    if (!checkRateLimit()) {
      return {
        tips: [
          {
            title: "Rate Limit Exceeded",
            description: "Please try again later for personalized tips.",
            category: "System",
            action: "Wait a few minutes"
          }
        ]
      };
    }
    requestCount++;

    const response = await fetch(`${GEMINI_PRO_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant for "Smart-Spend-Snap: AI Financial Literacy & Expense Analyzer". Your role is to suggest 2–3 short, clear, and friendly financial tips based on the user's transaction.

Transaction Details:
Amount: $${transaction.amount}
Category: ${transaction.category || 'Uncategorized'}
Description: ${transaction.description}
Merchant: ${transaction.merchant}

📌 Your tips should:
- Be visually short and snappy
- Be dynamic based on the transaction type and amount
- Reflect financial literacy principles
- Be written in title case
- Be easy to understand at a glance
- Have a positive, simple, and motivating tone

✨ Example Tips Based on Situation:

📈 Income Increased:
- Increase Your Emergency Fund
- Set Up a SIP or Recurring Investment
- Save Before You Spend

📉 Income Decreased:
- Cut Non-Essential Subscriptions
- Buy in Bulk to Save
- Stick to a Daily Spending Limit

📈 Expenses Increased:
- Review Monthly Bills
- Use Cashback and Discounts
- Plan Weekly Meals

📉 Expenses Decreased:
- Reallocate Savings to Investments
- Maintain Minimal Lifestyle
- Challenge Yourself to a No-Spend Day

Return the tips in this JSON format:
{
  "tips": [
    {
      "title": "Tip Title",
      "description": "Brief description of the tip",
      "category": "Category this tip applies to",
      "action": "Suggested action to take"
    }
  ]
}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting transaction tips:', error);
    return {
      tips: [
        {
          title: "Track Your Expenses",
          description: "Keep a close eye on your spending patterns.",
          category: "Expense Tracking",
          action: "Review your monthly expenses"
        },
        {
          title: "Review Your Budget",
          description: "Ensure this purchase aligns with your financial goals.",
          category: "Budgeting",
          action: "Check your budget categories"
        }
      ]
    };
  }
}

// Function to get financial tips based on overall spending
export async function getFinancialTips(expenses: number, spendingByCategory: Record<string, number>) {
  try {
    if (!checkRateLimit()) {
      return {
        tips: [
          {
            title: "Rate Limit Exceeded",
            description: "Please try again later for personalized tips.",
            category: "System",
            action: "Wait a few minutes"
          }
        ]
      };
    }
    requestCount++;

    const response = await fetch(`${GEMINI_PRO_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant for "Smart-Spend-Snap: AI Financial Literacy & Expense Analyzer". Your role is to suggest 2–3 short, clear, and friendly financial tips based on the user's overall spending.

Spending Data:
Total expenses: $${expenses}
Spending by category: ${JSON.stringify(spendingByCategory)}

📌 Your tips should:
- Be visually short and snappy
- Be dynamic based on spending patterns
- Reflect financial literacy principles
- Be written in title case
- Be easy to understand at a glance
- Have a positive, simple, and motivating tone

✨ Example Tips Based on Situation:

📈 Income Increased:
- Increase Your Emergency Fund
- Set Up a SIP or Recurring Investment
- Save Before You Spend

📉 Income Decreased:
- Cut Non-Essential Subscriptions
- Buy in Bulk to Save
- Stick to a Daily Spending Limit

📈 Expenses Increased:
- Review Monthly Bills
- Use Cashback and Discounts
- Plan Weekly Meals

📉 Expenses Decreased:
- Reallocate Savings to Investments
- Maintain Minimal Lifestyle
- Challenge Yourself to a No-Spend Day

Return the tips in this JSON format:
{
  "tips": [
    {
      "title": "Tip Title",
      "description": "Brief description of the tip",
      "category": "Category this tip applies to",
      "action": "Suggested action to take"
    }
  ]
}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting financial tips:', error);
    return {
      tips: [
        {
          title: "Track Your Expenses",
          description: "Keep a close eye on your spending patterns.",
          category: "Expense Tracking",
          action: "Review your monthly expenses"
        },
        {
          title: "Set a Budget",
          description: "Create a monthly budget to manage your finances better.",
          category: "Budgeting",
          action: "Set up budget categories"
        },
        {
          title: "Save Regularly",
          description: "Try to save a portion of your income each month.",
          category: "Savings",
          action: "Set up automatic savings"
        }
      ]
    };
  }
}
