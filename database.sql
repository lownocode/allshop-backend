create TABLE users (
    id INTEGER,
    purchases JSON[],
    balance INTEGER,
    admin BOOLEAN,
    history JSON[]
);

create TABLE donuts (
    user_id INTEGER,
    payment_id INTEGER,
    amount INTEGER
);

create TABLE offers (
    author_id INTEGER,
    demo_link VARCHAR(255),
    source VARCHAR(255),
    type VARCHAR(255),
    sum INTEGER,
    description TEXT,
    title VARCHAR(255),
    offer_id SERIAL PRIMARY KEY
);

create TABLE products (
    author_id INTEGER,
    demo_link VARCHAR(255),
    source VARCHAR(255),
    type VARCHAR(255),
    sum INTEGER,
    description TEXT,
    title VARCHAR(255),
    product_id SERIAL PRIMARY KEY
);

create TABLE promocodes (
    id SERIAL PRIMARY KEY,
    promo TEXT,
    sum INTEGER,
    usages INTEGER,
    used_users JSON[]
);