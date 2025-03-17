export const productModel = (sequelize, Sequelize) => {
    const Product = sequelize.define(
        'product',
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                required: true,
                allowNull: false,
                defaultValue: null
            },
            description: {
                type: Sequelize.STRING,
                required: true,
                allowNull: false,
                defaultValue: null
            },
            sku: {
                type: Sequelize.STRING,
                required: true,
                unique: true,
                allowNull: false,
            },
            manufacturer: {
                type: Sequelize.STRING,
                required: true,
                allowNull: false,
                defaultValue: null
            },
            quantity: {
                type: Sequelize.INTEGER,
                required: true,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100
                },
                allowNull: false,
            },
            date_added: {
                type: 'TIMESTAMP',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: false,
            },
            date_last_updated: {
                type: 'TIMESTAMP',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: false,
            },
            owner_user_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            }
        },
        {
            updatedAt: 'date_last_updated',
            createdAt: 'date_added',
        },
        {
            initialAutoIncrement: 1,
        }
    )
    return Product
}