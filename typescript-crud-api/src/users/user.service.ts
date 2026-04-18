import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Add this
import config from '../../config.json'; // Add this
import { db } from '../_helpers/db';
import { User, UserAttributes, UserCreationAttributes } from './user.model';
import { Role } from '../_helpers/role';
import { get } from 'node:http';

export const userService = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
};

async function authenticate({ email, password }: any) {
    // 1. Search for the user by email
    const user = await db.User.scope('withHash').findOne({ where: { email } });

    // 2. Compare input password with the hashed password in the DB
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new Error('Email or password incorrect');
    }

    // 3. Generate the JWT token using your config key
    const token = jwt.sign(
        { sub: user.id, role: user.role }, 
        config.jwtSecret, 
        { expiresIn: '7d' }
    );

    // 4. Prepare user data to send back (remove the password hash for safety)
    const userJson = user.get();
    delete userJson.passwordHash;

    return {
        ...userJson,
        token
    };
}

async function getAll(): Promise<User[]> {
    return await db.User.findAll();
}

async function getById(id: number): Promise<User> {
    return await getUser(id);
}

async function create(params: any): Promise<void> {

    const existingUser = await db.User.findOne({ where: { email: params.email } });
    if (existingUser) {
        throw new Error(`Email "${params.email}" is already registered`);
    }

    const passwordHash = await bcrypt.hash(params.password, 10);

    await db.User.create({
        ...params,
        passwordHash,
        role: params.role || Role.User,
    } as UserCreationAttributes);
}

async function update(id: number, params: Partial<UserAttributes> & { password?: string }): Promise<void> {
    const user = await getUser(id);

    if (params.password) {
        params.passwordHash = await bcrypt.hash(params.password, 10);
        delete params.password;
    }

    await user.update(params as Partial<UserAttributes>);
}

async function _delete(id: number): Promise<void> {
    const user = await getUser(id);
    await user.destroy();
}

async function getUser(id: number): Promise<User> {
    const user = await db.User.scope('defaultScope').findByPk(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}