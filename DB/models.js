import Sequelize from 'sequelize';
import sequelize from './sequelize.js';

const { DataTypes } = Sequelize;

export const User = sequelize.define('users', {
    uid: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
    id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    purchases: { type: DataTypes.ARRAY(DataTypes.JSON), defaultValue: [] },
    balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    admin: { type: DataTypes.BOOLEAN, defaultValue: false },
    history: { type: DataTypes.ARRAY(DataTypes.JSON), allowNull: false }
});

export const Donut = sequelize.define('donuts', {
    uid: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    payment_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false }
});

export const Offer = sequelize.define('offers', {
    uid: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    demo_link: { type: DataTypes.STRING, defaultValue: '' },
    source: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    sum: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
});

export const Product = sequelize.define('products', {
    uid: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    demo_link: { type: DataTypes.STRING, defaultValue: '' },
    source: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    sum: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
});

export const Promocode = sequelize.define('promocodes', {
    uid: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
    promo: { type: DataTypes.STRING },
    sum: { type: DataTypes.INTEGER, allowNull: false },
    usages: { type: DataTypes.INTEGER, allowNull: false },
    used_users: { type: DataTypes.ARRAY(DataTypes.JSON), defaultValue: [] }
});