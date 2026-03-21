-- Auction Service Database Initialization

CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER UNIQUE NOT NULL,
    current_highest_bid NUMERIC(10,2) DEFAULT 0,
    highest_bidder_id INTEGER,
    highest_bidder_username VARCHAR(255),
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    username VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id)
);

INSERT INTO auctions (id, item_id, current_highest_bid, highest_bidder_id, highest_bidder_username, end_time, status)
VALUES
    (1, 1, 50.00,  NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '48 hours', 'OPEN'),
    (2, 2, 800.00, NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '72 hours', 'OPEN'),
    (3, 3, 100.00, NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '24 hours', 'OPEN'),
    (4, 4, 200.00, NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '36 hours', 'OPEN'),
    (5, 5, 300.00, NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '96 hours', 'OPEN')
ON CONFLICT (item_id) DO NOTHING;
