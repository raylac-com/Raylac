export interface Transfer {
    type: string;
    to?: string;
    from?: string;
    amount: number;
    timestamp: number;
}