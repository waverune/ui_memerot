// import { useQueries, useQuery } from '@tanstack/react-query';
// import { fetchCoinData, fetchMarketCaps, CoinData, MarketCaps } from '../services/coinApi';
// import { TOKENS, TokenSymbol } from '../config/tokens';

// export const useCoinsData = () => {
//     const coinQueries = useQueries({
//         queries: Object.entries(TOKENS).map(([, config]) => ({
//             queryKey: ['coinData', config.coingeckoId],
//             queryFn: () => fetchCoinData(config.coingeckoId || ''),
//             staleTime: 60000, // 1 minute
//         })),
//     });

//     const { data: marketCaps } = useQuery<MarketCaps>({
//         queryKey: ['marketCaps'],
//         queryFn: fetchMarketCaps,
//         staleTime: 60000, // 1 minute
//     });

//     const coinPrices = Object.fromEntries(
//         coinQueries.map((query, index) => [
//             Object.keys(TOKENS)[index],
//             query.data?.price_usd || 0,
//         ])
//     ) as Record<TokenSymbol, number>;

//     return { coinPrices, marketCaps };
// };
