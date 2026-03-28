-- Catalogue Service Database Initialization

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    starting_price NUMERIC(10,2),
    seller_id INTEGER,
    auction_start_time TIMESTAMP,
    auction_end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    shipping_days INTEGER DEFAULT 7,
    shipping_cost NUMERIC(10,2) DEFAULT 0,
    expedited_shipping_cost NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO items (id, name, description, category, starting_price, seller_id,
                   auction_start_time, auction_end_time, status,
                   shipping_days, shipping_cost, expedited_shipping_cost)
VALUES
    (1, 'Vintage Watch', 'A classic 1970s Swiss watch in excellent condition.',
     'Accessories', 50.00, 1,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '48 hours',
     'ACTIVE', 7, 10.00, 25.00),
    (2, 'Gaming Laptop', 'High performance gaming laptop, 32GB RAM, RTX 4080.',
     'Electronics', 800.00, 1,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '72 hours',
     'ACTIVE', 5, 15.00, 35.00),
    (3, 'Antique Vase', 'Ming Dynasty replica vase, hand-painted.',
     'Antiques', 100.00, 2,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours',
     'ACTIVE', 10, 20.00, 40.00),
    (4, 'Mountain Bike', 'Trek mountain bike, lightly used, 21-speed.',
     'Sports', 200.00, 2,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '36 hours',
     'ACTIVE', 14, 30.00, 60.00),
    (5, 'Leather Sofa', 'Brown leather 3-seater sofa, excellent condition.',
     'Furniture', 300.00, 1,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '96 hours',
     'ACTIVE', 10, 50.00, 90.00)
ON CONFLICT (id) DO NOTHING;
