-- Payment Service Database Initialization

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    winner_id INTEGER NOT NULL,
    winner_username VARCHAR(255),
    winning_bid NUMERIC(10,2),
    shipping_cost NUMERIC(10,2),
    expedited BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC(10,2),
    masked_card_number VARCHAR(255),
    card_holder_name VARCHAR(255),
    expiration_date VARCHAR(10),
    status VARCHAR(50) DEFAULT 'SUCCESS',
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
