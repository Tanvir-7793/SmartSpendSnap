import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface ExchangeRates {
  [key: string]: number;
}

interface ConversionResult {
  converted_amount: number;
  currency: string;
}

// Updated exchange rates with more currencies and more accurate rates
const exchangeRates: ExchangeRates = {
  USD: 1,
  INR: 83.25,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.50,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.90,
  CNY: 7.23,
  SGD: 1.35,
  AED: 3.67,
  NZD: 1.67,
  HKD: 7.83,
  SEK: 10.65,
  NOK: 10.75,
  DKK: 6.92,
  PLN: 4.05,
  MXN: 16.75,
  BRL: 5.05,
  ZAR: 18.75,
  TRY: 32.25,
  RUB: 92.50
};

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<ConversionResult> {
  try {
    // First try direct calculation using exchange rates
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const fromRate = exchangeRates[fromCurrency];
      const toRate = exchangeRates[toCurrency];
      const convertedAmount = (amount / fromRate) * toRate;
      
      return {
        converted_amount: Number(convertedAmount.toFixed(2)),
        currency: toCurrency
      };
    }

    // Fallback to Gemini API if direct calculation fails
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });

    const prompt = `Convert ${amount} ${fromCurrency} to ${toCurrency}. Return only a JSON object with converted_amount and currency fields.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const conversionResult = JSON.parse(jsonMatch[0]) as ConversionResult;
    return conversionResult;
  } catch (error) {
    console.error('Error converting currency:', error);
    // Return a fallback conversion if both methods fail
    return {
      converted_amount: amount,
      currency: toCurrency
    };
  }
}

export const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' }
]; 