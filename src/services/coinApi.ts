const API_BASE_URL = 'http://localhost:8000'; // Adjust this to your backend URL

export interface CoinData {
    coin_id: string;
    price_usd: number;
    market_cap_usd: number;
}

export interface MarketCaps {
    mog: number;
    spx6900: number;
    dogecoin: number;
}

export const fetchCoinData = async (coinId: string): Promise<CoinData> => {
    console.log(`Fetching data for ${coinId}...`);
    const response = await fetch(`${API_BASE_URL}/coin/${coinId}`);
    if (!response.ok) {
        throw new Error(`Error fetching data for ${coinId}`);
    }
    const data = await response.json();
    console.log(`Received data for ${coinId}:`, data);
    return data;
};

export const fetchMarketCaps = async (): Promise<MarketCaps> => {
    console.log('Fetching market caps...');
    const response = await fetch(`${API_BASE_URL}/market_caps`);
    if (!response.ok) {
        throw new Error('Error fetching market caps');
    }
    const data = await response.json();
    console.log('Received market caps:', data);
    return data;
};
