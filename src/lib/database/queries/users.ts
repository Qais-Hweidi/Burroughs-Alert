/**
 * User Database Operations
 * CRUD operations for the users table
 */

import Database from 'better-sqlite3';
import { getDatabase } from '../index';
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserQueryFilters,
  CreateResult,
  UpdateResult,
  DeleteResult,
  PaginationOptions,
  PaginatedResult
} from '../../types/database.types';
import { generateUnsubscribeToken } from '../../utils/validation';
import { dbLogger, logDatabaseOperation, createTimer } from '../../utils/logger';
import { NotFoundError, ConflictError } from '../../utils/error-handler';

// ================================
// Prepared Statements
// ================================

let createUserStmt: Database.Statement | null = null;
let findUserByIdStmt: Database.Statement | null = null;
let findUserByEmailStmt: Database.Statement | null = null;
let findUserByTokenStmt: Database.Statement | null = null;
let updateUserStmt: Database.Statement | null = null;
let deleteUserStmt: Database.Statement | null = null;
let deactivateUserStmt: Database.Statement | null = null;

function initializeStatements(db: Database.Database) {
  if (!createUserStmt) {
    createUserStmt = db.prepare(`
      INSERT INTO users (email, unsubscribe_token)
      VALUES (?, ?)
      RETURNING *
    `);
  }

  if (!findUserByIdStmt) {
    findUserByIdStmt = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `);
  }

  if (!findUserByEmailStmt) {
    findUserByEmailStmt = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `);
  }

  if (!findUserByTokenStmt) {
    findUserByTokenStmt = db.prepare(`
      SELECT * FROM users WHERE unsubscribe_token = ?
    `);
  }

  if (!updateUserStmt) {
    updateUserStmt = db.prepare(`
      UPDATE users 
      SET email = COALESCE(?, email),
          is_active = COALESCE(?, is_active),
          unsubscribe_token = COALESCE(?, unsubscribe_token),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
  }

  if (!deleteUserStmt) {
    deleteUserStmt = db.prepare(`
      DELETE FROM users WHERE id = ?
    `);
  }

  if (!deactivateUserStmt) {
    deactivateUserStmt = db.prepare(`
      UPDATE users 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
  }
}

// ================================
// Create Operations
// ================================

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<CreateResult<User>> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    const unsubscribeToken = input.unsubscribeToken || generateUnsubscribeToken();
    
    const result = createUserStmt!.get(input.email, unsubscribeToken) as User;
    
    logDatabaseOperation('CREATE', 'users', true, timer());
    
    return {
      success: true,
      data: result,
      lastInsertRowid: result.id,
      changes: 1
    };
    
  } catch (error: any) {
    logDatabaseOperation('CREATE', 'users', false, timer(), error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new ConflictError('User with this email already exists');
    }
    
    throw error;
  }
}

/**
 * Create user or get existing (upsert operation)
 */
export async function createOrGetUser(email: string): Promise<User> {
  const timer = createTimer();
  
  try {
    // Try to find existing user first
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user if not found
    const result = await createUser({ email });
    if (!result.data) {
      throw new Error('Failed to create user');
    }
    
    return result.data;
    
  } catch (error) {
    logDatabaseOperation('UPSERT', 'users', false, timer(), error as any);
    throw error;
  }
}

// ================================
// Read Operations
// ================================

/**
 * Find user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    const result = findUserByIdStmt!.get(id) as User | undefined;
    
    logDatabaseOperation('SELECT', 'users', true, timer());
    
    return result || null;
    
  } catch (error) {
    logDatabaseOperation('SELECT', 'users', false, timer(), error as any);
    throw error;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    const result = findUserByEmailStmt!.get(email) as User | undefined;
    
    logDatabaseOperation('SELECT', 'users', true, timer());
    
    return result || null;
    
  } catch (error) {
    logDatabaseOperation('SELECT', 'users', false, timer(), error as any);
    throw error;
  }
}

/**
 * Find user by unsubscribe token
 */
export async function findUserByUnsubscribeToken(token: string): Promise<User | null> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    const result = findUserByTokenStmt!.get(token) as User | undefined;
    
    logDatabaseOperation('SELECT', 'users', true, timer());
    
    return result || null;
    
  } catch (error) {
    logDatabaseOperation('SELECT', 'users', false, timer(), error as any);
    throw error;
  }
}

/**
 * Get user with validation (throws if not found)
 */
export async function getUserById(id: number): Promise<User> {
  const user = await findUserById(id);
  if (!user) {
    throw new NotFoundError('User', id);
  }
  return user;
}

/**
 * Get user by email with validation (throws if not found)
 */
export async function getUserByEmail(email: string): Promise<User> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new NotFoundError('User', email);
  }
  return user;
}

/**
 * Find users with filters and pagination
 */
export async function findUsers(
  filters: UserQueryFilters = {},
  pagination: PaginationOptions = {}
): Promise<PaginatedResult<User>> {
  const timer = createTimer();
  const db = getDatabase();
  
  try {
    const { limit = 50, offset = 0, sort = 'created_at', order = 'DESC' } = pagination;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.email) {
      conditions.push('email LIKE ?');
      params.push(`%${filters.email}%`);
    }
    
    if (filters.is_active !== undefined) {
      conditions.push('is_active = ?');
      params.push(filters.is_active ? 1 : 0);
    }
    
    if (filters.has_alerts) {
      conditions.push(`${filters.has_alerts ? 'EXISTS' : 'NOT EXISTS'} (
        SELECT 1 FROM alerts WHERE alerts.user_id = users.id AND alerts.is_active = 1
      )`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    
    // Get paginated results
    const dataQuery = `
      SELECT * FROM users ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;
    const dataResult = db.prepare(dataQuery).all(...params, limit, offset) as User[];
    
    logDatabaseOperation('SELECT', 'users', true, timer());
    
    return {
      data: dataResult,
      total: countResult.total,
      limit,
      offset,
      hasMore: offset + dataResult.length < countResult.total
    };
    
  } catch (error) {
    logDatabaseOperation('SELECT', 'users', false, timer(), error as any);
    throw error;
  }
}

// ================================
// Update Operations
// ================================

/**
 * Update user by ID
 */
export async function updateUser(id: number, input: UpdateUserInput): Promise<UpdateResult> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User', id);
    }
    
    const result = updateUserStmt!.run(
      input.email || null,
      input.is_active !== undefined ? (input.is_active ? 1 : 0) : null,
      input.unsubscribe_token || null,
      id
    );
    
    logDatabaseOperation('UPDATE', 'users', true, timer());
    
    return {
      success: true,
      affectedRows: result.changes,
      changes: result.changes
    };
    
  } catch (error) {
    logDatabaseOperation('UPDATE', 'users', false, timer(), error as any);
    throw error;
  }
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(id: number): Promise<UpdateResult> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User', id);
    }
    
    const result = deactivateUserStmt!.run(id);
    
    logDatabaseOperation('UPDATE', 'users', true, timer());
    
    return {
      success: true,
      affectedRows: result.changes,
      changes: result.changes
    };
    
  } catch (error) {
    logDatabaseOperation('UPDATE', 'users', false, timer(), error as any);
    throw error;
  }
}

/**
 * Deactivate user by email
 */
export async function deactivateUserByEmail(email: string): Promise<UpdateResult> {
  const user = await getUserByEmail(email);
  return deactivateUser(user.id);
}

/**
 * Deactivate user by unsubscribe token
 */
export async function deactivateUserByToken(token: string): Promise<UpdateResult> {
  const user = await findUserByUnsubscribeToken(token);
  if (!user) {
    throw new NotFoundError('User with unsubscribe token');
  }
  return deactivateUser(user.id);
}

// ================================
// Delete Operations
// ================================

/**
 * Delete user permanently (hard delete)
 */
export async function deleteUser(id: number): Promise<DeleteResult> {
  const timer = createTimer();
  const db = getDatabase();
  initializeStatements(db);

  try {
    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User', id);
    }
    
    const result = deleteUserStmt!.run(id);
    
    logDatabaseOperation('DELETE', 'users', true, timer());
    
    return {
      success: true,
      deletedCount: result.changes,
      changes: result.changes
    };
    
  } catch (error) {
    logDatabaseOperation('DELETE', 'users', false, timer(), error as any);
    throw error;
  }
}

// ================================
// Utility Operations
// ================================

/**
 * Check if user exists
 */
export async function userExists(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  return user !== null;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  total: number;
  active: number;
  withAlerts: number;
  recentlyCreated: number;
}> {
  const timer = createTimer();
  const db = getDatabase();
  
  try {
    const totalResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const activeResult = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as { count: number };
    const withAlertsResult = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM alerts 
      WHERE is_active = 1
    `).get() as { count: number };
    const recentResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > datetime('now', '-7 days')
    `).get() as { count: number };
    
    logDatabaseOperation('SELECT', 'users', true, timer());
    
    return {
      total: totalResult.count,
      active: activeResult.count,
      withAlerts: withAlertsResult.count,
      recentlyCreated: recentResult.count
    };
    
  } catch (error) {
    logDatabaseOperation('SELECT', 'users', false, timer(), error as any);
    throw error;
  }
}