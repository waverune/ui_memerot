// import ethLogo from '/logos/ETH.png';
// import wethLogo from '/logos/WETH.png';
// import usdcLogo from '/logos/USDC.png';
// import spx6900Logo from '/logos/spx6900.png';
// import mogLogo from '/logos/MOG.png';
// import hposLogo from '/logos/HPOS.png';

export interface TokenConfig {
    name?: string;
    address: string;
    decimals: number;
    symbol: string;
    logo: string;
    coingeckoId: string;
}

export const TOKENS: { [key: string]: TokenConfig } = {
    ETH: {
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        symbol: "ETH",
        logo: "/logos/ETH.png",
        coingeckoId: "ethereum"
    },
    WETH: {
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        decimals: 18,
        symbol: "WETH",
        logo: "/logos/WETH.png",
        coingeckoId: "weth"
    },
    USDC: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
        symbol: "USDC",
        logo: "/logos/USDC.png",
        coingeckoId: "usd-coin"
    },
    SPX6900: {
        address: "0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c",
        decimals: 8,
        symbol: "SPX6900",
        logo: "/logos/spx6900.png",
        coingeckoId: "spx6900"
    },
    MOG: {
        address: "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a",
        decimals: 18,
        symbol: "MOG",
        logo: "/logos/MOG.png",
        coingeckoId: "mog-coin"
    },
    HPOS: {
        address: "0x72e4f9f808c49a2a61de9c5896298920dc4eeea9",
        decimals: 8,
        symbol: "HPOS",
        logo: "/logos/HPOS.png",
        coingeckoId: "harrypotterobamasonic10in"
    },
    WOJAK: {
        address: "0x5026f006b85729a8b14553fae6af249ad16c9aab",
        decimals: 18,
        symbol: "WOJAK",
        logo: "/logos/wojak.png",
        coingeckoId: "wojak"
    },
    PEIPEI: {
        address: "0x3ffeea07a27fab7ad1df5297fa75e77a43cb5790",
        decimals: 18,
        symbol: "PEIPEI",
        logo: "/logos/peipei.png",
        coingeckoId: "peipeicoin-vip"
    }
};

export type TokenSymbol = keyof typeof TOKENS;
