import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'hostel_split',
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Generate random avatar color
function generateAvatarColor() {
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ============ AUTH ROUTES ============

// Signup
app.post('/api/auth/signup', async (req, res) => {
    console.log('📝 Signup request received:', req.body);
    
    const { full_name, email, password } = req.body;
    
    if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const avatarColor = generateAvatarColor();

        const insertResult = await pool.query(
            `INSERT INTO users (id, email, full_name, password_hash, avatar_color) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, full_name, unique_code, avatar_color`,
            [userId, email, full_name, hashedPassword, avatarColor]
        );

        const newUser = insertResult.rows[0];
        
        console.log('✅ User created successfully:', {
            id: newUser.id,
            email: newUser.email,
            unique_code: newUser.unique_code
        });

        res.status(201).json({ 
            message: 'User created successfully',
            unique_code: newUser.unique_code
        });
        
    } catch (err) {
        console.error('❌ Signup error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    console.log('🔐 Login request received:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        
        if (!user.password_hash) {
            console.error('❌ User has no password_hash:', user.id);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in:', user.email);

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                unique_code: user.unique_code,
                avatar_color: user.avatar_color
            }
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ============ ROOM ROUTES ============

// Get user's rooms
app.get('/api/rooms', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.* FROM rooms r 
             JOIN room_members rm ON r.id = rm.room_id 
             WHERE rm.user_id = $1 
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Find room by invite code
app.get('/api/rooms/find-by-code/:code', authenticateToken, async (req, res) => {
    const { code } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT id, name, type, invite_code FROM rooms WHERE invite_code = $1',
            [code.toUpperCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create room
app.post('/api/rooms', authenticateToken, async (req, res) => {
    const { name, type } = req.body;
    const roomId = uuidv4();
    const inviteCode = 'HS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        await pool.query('BEGIN');
        
        await pool.query(
            'INSERT INTO rooms (id, name, type, creator_id, invite_code) VALUES ($1, $2, $3, $4, $5)',
            [roomId, name, type, req.user.id, inviteCode]
        );
        
        await pool.query(
            'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
            [roomId, req.user.id]
        );
        
        await pool.query('COMMIT');
        
        res.status(201).json({
            id: roomId,
            name,
            type,
            creator_id: req.user.id,
            invite_code: inviteCode
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete room
app.delete('/api/rooms/:roomId', authenticateToken, async (req, res) => {
    const { roomId } = req.params;

    try {
        const roomCheck = await pool.query(
            'SELECT creator_id FROM rooms WHERE id = $1',
            [roomId]
        );
        
        if (roomCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        if (roomCheck.rows[0].creator_id !== req.user.id) {
            return res.status(403).json({ error: 'Only room creator can delete the room' });
        }
        
        await pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);
        
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get room data
app.get('/api/rooms/:roomId/data', authenticateToken, async (req, res) => {
    const { roomId } = req.params;

    try {
        const memberCheck = await pool.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, req.user.id]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a member of this room' });
        }

        const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        const room = roomResult.rows[0];

        const membersResult = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.unique_code, u.avatar_color 
             FROM users u 
             JOIN room_members rm ON u.id = rm.user_id 
             WHERE rm.room_id = $1`,
            [roomId]
        );
        const members = membersResult.rows;

        const expensesResult = await pool.query(
            `SELECT e.*, u.full_name as paid_by_name 
             FROM expenses e 
             JOIN users u ON e.paid_by = u.id 
             WHERE e.room_id = $1 
             ORDER BY e.created_at DESC`,
            [roomId]
        );
        const expenses = expensesResult.rows;

        const timelineMap = new Map();
        
        expenses.forEach(exp => {
            const date = new Date(exp.created_at);
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            
            if (!timelineMap.has(dayLabel)) {
                timelineMap.set(dayLabel, {
                    dayLabel,
                    items: [],
                    totalDayVolume: 0
                });
            }
            
            const group = timelineMap.get(dayLabel);
            group.items.push({
                id: exp.id,
                description: exp.description,
                amount: parseFloat(exp.amount),
                category: exp.category || 'Other',
                paid_by: exp.paid_by,
                paid_by_name: exp.paid_by_name,
                created_at: exp.created_at
            });
            group.totalDayVolume += parseFloat(exp.amount);
        });
        
        const timeline = Array.from(timelineMap.values());

        const balances = members.map(member => {
            let paid = 0;
            expenses.forEach(exp => {
                if (exp.paid_by === member.id) {
                    paid += parseFloat(exp.amount);
                }
            });
            const equalShare = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) / (members.length || 1);
            const net = paid - equalShare;
            
            return {
                id: member.id,
                full_name: member.full_name,
                net: net,
                avatar_color: member.avatar_color
            };
        });

        res.json({ room, members, timeline, balances });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
    const { room_id, amount, description, category, split_type, splits } = req.body;
    const expenseId = uuidv4();

    try {
        await pool.query('BEGIN');
        
        await pool.query(
            'INSERT INTO expenses (id, room_id, paid_by, amount, description, category, split_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [expenseId, room_id, req.user.id, amount, description, category || 'Other', split_type]
        );
        
        for (const split of splits) {
            await pool.query(
                'INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1, $2, $3)',
                [expenseId, split.user_id, split.amount_owed]
            );
        }
        
        await pool.query('COMMIT');
        res.status(201).json({ id: expenseId });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete expenses by timeframe
app.delete('/api/rooms/:roomId/expenses/purge', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const { timeframe } = req.body;

    try {
        let deleted;
        
        if (timeframe === 'week') {
            const result = await pool.query(
                'DELETE FROM expenses WHERE room_id = $1 AND created_at >= NOW() - INTERVAL \'7 days\' RETURNING id',
                [roomId]
            );
            deleted = result.rows.length;
        } else if (timeframe === 'month') {
            const result = await pool.query(
                'DELETE FROM expenses WHERE room_id = $1 AND created_at >= NOW() - INTERVAL \'30 days\' RETURNING id',
                [roomId]
            );
            deleted = result.rows.length;
        } else {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }
        
        res.json({ message: `${deleted} expenses deleted` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add member to room (Admin only)
app.post('/api/rooms/:roomId/members', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const { email, unique_code } = req.body;

    try {
        const roomCheck = await pool.query(
            'SELECT creator_id FROM rooms WHERE id = $1',
            [roomId]
        );
        
        if (roomCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        if (roomCheck.rows[0].creator_id !== req.user.id) {
            return res.status(403).json({ error: 'Only room admin can add members' });
        }
        
        const userResult = await pool.query(
            'SELECT id, full_name FROM users WHERE email = $1 AND unique_code = $2',
            [email, unique_code]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found. Check email and unique ID.' });
        }
        
        const userToAdd = userResult.rows[0];
        
        const memberCheck = await pool.query(
            'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, userToAdd.id]
        );
        
        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User is already a member' });
        }
        
        await pool.query(
            'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
            [roomId, userToAdd.id]
        );
        
        res.json({ message: 'Member added successfully', user: userToAdd });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ NEW: EXPORT EXPENSES TO CSV ============
app.get('/api/rooms/:roomId/export', authenticateToken, async (req, res) => {
    const { roomId } = req.params;

    try {
        const memberCheck = await pool.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, req.user.id]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a member of this room' });
        }

        const expensesResult = await pool.query(
            `SELECT 
                e.created_at as date,
                e.description,
                e.category,
                e.amount,
                u.full_name as paid_by,
                STRING_AGG(u2.full_name, ', ') as split_with
             FROM expenses e
             JOIN users u ON e.paid_by = u.id
             JOIN expense_splits es ON e.id = es.expense_id
             JOIN users u2 ON es.user_id = u2.id
             WHERE e.room_id = $1
             GROUP BY e.id, e.created_at, e.description, e.category, e.amount, u.full_name
             ORDER BY e.created_at DESC`,
            [roomId]
        );

        res.json(expensesResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ NEW: REQUEST TO JOIN ROOM ============
app.post('/api/rooms/:roomId/join-request', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const { invite_code } = req.body;

    try {
        const roomResult = await pool.query(
            'SELECT * FROM rooms WHERE id = $1 AND invite_code = $2',
            [roomId, invite_code]
        );
        
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid room code' });
        }

        const room = roomResult.rows[0];

        const existingMember = await pool.query(
            'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, req.user.id]
        );
        
        if (existingMember.rows.length > 0) {
            return res.status(400).json({ error: 'You are already a member of this room' });
        }

        const pendingRequest = await pool.query(
            'SELECT * FROM join_requests WHERE room_id = $1 AND user_id = $2 AND status = $3',
            [roomId, req.user.id, 'pending']
        );
        
        if (pendingRequest.rows.length > 0) {
            return res.status(400).json({ error: 'Join request already pending approval' });
        }

        await pool.query(
            'INSERT INTO join_requests (room_id, user_id, status, requested_at) VALUES ($1, $2, $3, NOW())',
            [roomId, req.user.id, 'pending']
        );

        res.json({ 
            message: 'Join request sent! Waiting for admin approval.',
            room_name: room.name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ NEW: GET PENDING JOIN REQUESTS ============
app.get('/api/rooms/:roomId/pending-requests', authenticateToken, async (req, res) => {
    const { roomId } = req.params;

    try {
        const roomCheck = await pool.query(
            'SELECT creator_id FROM rooms WHERE id = $1',
            [roomId]
        );
        
        if (roomCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        if (roomCheck.rows[0].creator_id !== req.user.id) {
            return res.status(403).json({ error: 'Only room admin can view join requests' });
        }

        const requestsResult = await pool.query(
            `SELECT jr.*, u.full_name, u.email, u.avatar_color, u.unique_code
             FROM join_requests jr
             JOIN users u ON jr.user_id = u.id
             WHERE jr.room_id = $1 AND jr.status = 'pending'
             ORDER BY jr.requested_at DESC`,
            [roomId]
        );

        res.json(requestsResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ NEW: APPROVE OR REJECT JOIN REQUEST ============
app.post('/api/rooms/:roomId/approve-request', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const { request_id, action } = req.body;

    try {
        const roomCheck = await pool.query(
            'SELECT creator_id FROM rooms WHERE id = $1',
            [roomId]
        );
        
        if (roomCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        if (roomCheck.rows[0].creator_id !== req.user.id) {
            return res.status(403).json({ error: 'Only room admin can approve requests' });
        }

        const requestResult = await pool.query(
            'SELECT * FROM join_requests WHERE id = $1 AND room_id = $2',
            [request_id, roomId]
        );
        
        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Join request not found' });
        }

        const joinRequest = requestResult.rows[0];

        if (action === 'approve') {
            await pool.query(
                'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
                [roomId, joinRequest.user_id]
            );
            
            await pool.query(
                'UPDATE join_requests SET status = $1, processed_at = NOW() WHERE id = $2',
                ['approved', request_id]
            );
            
            res.json({ message: 'User approved and added to room' });
        } else if (action === 'reject') {
            await pool.query(
                'UPDATE join_requests SET status = $1, processed_at = NOW() WHERE id = $2',
                ['rejected', request_id]
            );
            
            res.json({ message: 'Join request rejected' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ NEW: GET SETTLEMENT SUGGESTIONS ============
app.get('/api/rooms/:roomId/settlements', authenticateToken, async (req, res) => {
    const { roomId } = req.params;

    try {
        const balancesResult = await pool.query(
            `SELECT 
                u.id,
                u.full_name,
                u.avatar_color,
                COALESCE(SUM(CASE WHEN e.paid_by = u.id THEN e.amount ELSE 0 END), 0) as paid,
                COALESCE(SUM(es.amount_owed), 0) as owes
             FROM users u
             JOIN room_members rm ON u.id = rm.user_id
             LEFT JOIN expenses e ON e.room_id = rm.room_id AND e.paid_by = u.id
             LEFT JOIN expense_splits es ON es.user_id = u.id
             LEFT JOIN expenses e2 ON es.expense_id = e2.id AND e2.room_id = rm.room_id
             WHERE rm.room_id = $1
             GROUP BY u.id, u.full_name, u.avatar_color`,
            [roomId]
        );

        let balances = balancesResult.rows.map(b => ({
            id: b.id,
            name: b.full_name,
            avatar_color: b.avatar_color,
            net: parseFloat(b.paid) - parseFloat(b.owes)
        }));

        let creditors = balances.filter(b => b.net > 0).sort((a, b) => b.net - a.net);
        let debtors = balances.filter(b => b.net < 0).sort((a, b) => a.net - b.net);
        
        let settlements = [];
        let i = 0, j = 0;
        
        while (i < creditors.length && j < debtors.length) {
            let creditor = creditors[i];
            let debtor = debtors[j];
            let amount = Math.min(creditor.net, Math.abs(debtor.net));
            
            if (amount > 0.01) {
                settlements.push({
                    from: debtor.name,
                    from_id: debtor.id,
                    to: creditor.name,
                    to_id: creditor.id,
                    amount: amount
                });
            }
            
            creditor.net -= amount;
            debtor.net += amount;
            
            if (creditor.net < 0.01) i++;
            if (debtor.net > -0.01) j++;
        }

        res.json(settlements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});