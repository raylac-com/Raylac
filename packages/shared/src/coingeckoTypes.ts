export interface CoingeckoCoinData {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string;
  platforms: Record<string, string>;
  detail_platforms: Record<string, CoingeckoDetailPlatform>;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string;
  additional_notices: any[]; // or a more specific type if you know its shape
  localization: Record<string, string>;
  description: Record<string, string>;
  links: CoingeckoLinks;
  image: CoingeckoImageLinks;
  country_origin: string;
  genesis_date: string | null;
  contract_address: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  market_data: CoingeckoMarketData;
  community_data: CoingeckoCommunityData;
  developer_data: CoingeckoDeveloperData;
  status_updates: any[]; // or a more specific type
  last_updated: string;
  tickers: CoingeckoTicker[];
}

/**
 * Example sub-interface for "detail_platforms" object.
 * Each chain key (e.g. "ethereum", "polkadot", etc.) maps to an object with decimal_place and contract_address.
 */
export interface CoingeckoDetailPlatform {
  decimal_place: number | null;
  contract_address: string;
}

export interface CoingeckoLinks {
  homepage: string[];
  whitepaper: string; // if empty string is valid, you can keep it as string
  blockchain_site: string[];
  official_forum_url: string[];
  chat_url: string[];
  announcement_url: string[];
  snapshot_url: string | null;
  twitter_screen_name: string;
  facebook_username: string;
  bitcointalk_thread_identifier: number | null;
  telegram_channel_identifier: string;
  subreddit_url: string;
  repos_url: {
    github: string[];
    bitbucket: string[];
  };
}

export interface CoingeckoImageLinks {
  thumb: string;
  small: string;
  large: string;
}

/**
 * The market_data object is very large.
 * For repeated structures, we often use Record<string, number> to map currency codes (e.g. "usd", "eur", "btc") to values.
 */
export interface CoingeckoMarketData {
  current_price: Record<string, number>;
  total_value_locked: number | null;
  mcap_to_tvl_ratio: number | null;
  fdv_to_tvl_ratio: number | null;
  roi: number | null;
  ath: Record<string, number>;
  ath_change_percentage: Record<string, number>;
  ath_date: Record<string, string>;
  atl: Record<string, number>;
  atl_change_percentage: Record<string, number>;
  atl_date: Record<string, string>;
  market_cap: Record<string, number>;
  market_cap_rank: number;
  fully_diluted_valuation: Record<string, number>;
  market_cap_fdv_ratio: number;
  total_volume: Record<string, number>;
  high_24h: Record<string, number>;
  low_24h: Record<string, number>;

  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_14d: number;
  price_change_percentage_30d: number;
  price_change_percentage_60d: number;
  price_change_percentage_200d: number;
  price_change_percentage_1y: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;

  price_change_24h_in_currency: Record<string, number>;
  price_change_percentage_1h_in_currency: Record<string, number>;
  price_change_percentage_24h_in_currency: Record<string, number>;
  price_change_percentage_7d_in_currency: Record<string, number>;
  price_change_percentage_14d_in_currency: Record<string, number>;
  price_change_percentage_30d_in_currency: Record<string, number>;
  price_change_percentage_60d_in_currency: Record<string, number>;
  price_change_percentage_200d_in_currency: Record<string, number>;
  price_change_percentage_1y_in_currency: Record<string, number>;

  market_cap_change_24h_in_currency: Record<string, number>;
  market_cap_change_percentage_24h_in_currency: Record<string, number>;

  total_supply: number | null;
  max_supply: number | null;
  max_supply_infinite: boolean;
  circulating_supply: number;
  last_updated: string;
}

export interface CoingeckoCommunityData {
  facebook_likes: number | null;
  twitter_followers: number;
  reddit_average_posts_48h: number;
  reddit_average_comments_48h: number;
  reddit_subscribers: number;
  reddit_accounts_active_48h: number;
  telegram_channel_user_count: number | null;
}

export interface CoingeckoDeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  total_issues: number;
  closed_issues: number;
  pull_requests_merged: number;
  pull_request_contributors: number;
  code_additions_deletions_4_weeks: {
    additions: number;
    deletions: number;
  };
  commit_count_4_weeks: number;
  last_4_weeks_commit_activity_series: any[]; // or a more specific type if known
}

export interface CoingeckoTicker {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
    has_trading_incentive: boolean;
  };
  last: number;
  volume: number;
  converted_last: Record<string, number>;
  converted_volume: Record<string, number>;
  trust_score: string;
  bid_ask_spread_percentage: number;
  timestamp: string; // e.g. "2025-01-12T09:27:55+00:00"
  last_traded_at: string; // same format as above
  last_fetch_at: string; // same format as above
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string | null;
  token_info_url: string | null;
  coin_id: string;
  target_coin_id: string;
}
