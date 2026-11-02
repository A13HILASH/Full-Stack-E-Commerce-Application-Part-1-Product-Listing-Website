-- Sample data: 4 categories, 12 products. Prices are in cents.
INSERT INTO categories (id, name, slug) VALUES
 (1, 'Desk',     'desk'),
 (2, 'Kitchen',  'kitchen'),
 (3, 'Lighting', 'lighting'),
 (4, 'Bags',     'bags');

INSERT INTO products (id, name, description, price_cents, image_url, category_id, stock) VALUES
 (1,  'Walnut Desk Tray',      'Hand-finished walnut tray with three compartments for pens, cards and cables. Felt-lined base protects your desk.', 3400, '/images/walnut-desk-tray.svg', 1, 25),
 (2,  'Linen Notebook Set',    'Two A5 notebooks with linen covers and 120 pages of 100gsm dotted paper that resists ink bleed.',                    1800, '/images/linen-notebook-set.svg', 1, 60),
 (3,  'Brass Pen Stand',       'Weighted solid-brass stand that holds up to eight pens. Develops a soft patina with use.',                          2600, '/images/brass-pen-stand.svg', 1, 18),
 (4,  'Ceramic Pour-Over Set', 'Matte ceramic dripper and carafe for two cups. Dishwasher safe, with reusable steel filter.',                        4500, '/images/ceramic-pour-over-set.svg', 2, 12),
 (5,  'Olive Wood Board',      'Chopping and serving board cut from a single piece of olive wood. Each grain pattern is unique.',                   3800, '/images/olive-wood-board.svg', 2, 30),
 (6,  'Stoneware Mug (Pair)',  'Two 350 ml stoneware mugs with a speckled glaze. Microwave and dishwasher safe.',                                   2400, '/images/stoneware-mug-pair.svg', 2, 40),
 (7,  'Enamel Kettle',         '1.2 L stovetop kettle in enamelled steel with a heat-proof handle and a whistling spout.',                          5200, '/images/enamel-kettle.svg', 2, 0),
 (8,  'Arc Desk Lamp',         'Dimmable LED lamp with a long adjustable arm, 3 colour temperatures and a USB charging port.',                      6900, '/images/arc-desk-lamp.svg', 3, 15),
 (9,  'Paper Globe Pendant',   'Folding rice-paper pendant shade, 40 cm across. Casts a soft, even light. Bulb not included.',                      2900, '/images/paper-globe-pendant.svg', 3, 22),
 (10, 'Rechargeable Lantern',  'Portable lantern with 20 hours of battery life, warm light and a carry loop for patio or camping.',                 4200, '/images/rechargeable-lantern.svg', 3, 9),
 (11, 'Canvas Daypack',        '18 L waxed-canvas backpack with padded laptop sleeve (fits 15 in) and leather-trimmed straps.',                     8900, '/images/canvas-daypack.svg', 4, 14),
 (12, 'Leather Card Wallet',   'Slim vegetable-tanned leather wallet with four card slots and one cash pocket.',                                    3200, '/images/leather-card-wallet.svg', 4, 35);
