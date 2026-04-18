
import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
    User: any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
    const {host, port, user, password, database } = config.database;

    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

    const {default: userModel } = await import('../users/user.model');
    db.User = userModel(sequelize);

    await sequelize.sync({alter: true});

    console.log(' Database initialized and model synced ');

    // --- SEED ADMIN ACCOUNT ---
    const adminEmail = 'admin@example.com';
    const adminExists = await db.User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
        console.log(' Admin account not found. Seeding now...');
        
        // We import service here to avoid circular dependencies
        const { userService } = await import('../users/user.service');
        
        await userService.create({
            title: 'Mr.',
            firstName: 'System',
            lastName: 'Admin',
            email: adminEmail,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            role: 'admin' 
        } as any);

        // console.log('Admin account created: admin@example.com / Password123!');
    }
}