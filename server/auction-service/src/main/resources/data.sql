INSERT INTO auctions (item_id, current_highest_bid, highest_bidder_id, highest_bidder_username,
    end_time, status)
VALUES
    (1, 50.00,  NULL, NULL, DATEADD('HOUR', 48, CURRENT_TIMESTAMP), 'OPEN'),
    (2, 800.00, NULL, NULL, DATEADD('HOUR', 72, CURRENT_TIMESTAMP), 'OPEN'),
    (3, 100.00, NULL, NULL, DATEADD('HOUR', 24, CURRENT_TIMESTAMP), 'OPEN'),
    (4, 200.00, NULL, NULL, DATEADD('HOUR', 36, CURRENT_TIMESTAMP), 'OPEN'),
    (5, 300.00, NULL, NULL, DATEADD('HOUR', 96, CURRENT_TIMESTAMP), 'OPEN');