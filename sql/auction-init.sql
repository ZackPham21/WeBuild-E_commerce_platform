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

INSERT INTO auctions (item_id, current_highest_bid, highest_bidder_id,
                      highest_bidder_username, end_time, status)
SELECT * FROM (VALUES
    (1, 50.00,  NULL::INTEGER, NULL::VARCHAR, CURRENT_TIMESTAMP + INTERVAL '30 days', 'OPEN'),
    (2, 800.00, NULL::INTEGER, NULL::VARCHAR, CURRENT_TIMESTAMP + INTERVAL '30 days', 'OPEN'),
    (3, 100.00, NULL::INTEGER, NULL::VARCHAR, CURRENT_TIMESTAMP + INTERVAL '30 days', 'OPEN'),
    (4, 200.00, NULL::INTEGER, NULL::VARCHAR, CURRENT_TIMESTAMP + INTERVAL '30 days', 'OPEN'),
    (5, 300.00, NULL::INTEGER, NULL::VARCHAR, CURRENT_TIMESTAMP + INTERVAL '30 days', 'OPEN')
) AS v(item_id, current_highest_bid, highest_bidder_id,
       highest_bidder_username, end_time, status)
WHERE NOT EXISTS (SELECT 1 FROM auctions LIMIT 1);