export const imageModel = (sequelize, Sequelize) => {
    const Image = sequelize.define(
        'image',
        {
            image_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            file_name: {
                type: Sequelize.STRING,
                required: true,
                allowNull: false,
            },
            s3_bucket_path: {
                type: Sequelize.STRING,
                required: true,
                unique: true,
                allowNull: true,
            },
            date_created: {
                type: 'TIMESTAMP',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                allowNull: false,
            }
        },
        {
            createdAt: 'date_created',
            updatedAt: false
        },
        {
            initialAutoIncrement: 1,
        }
    )
    return Image
}