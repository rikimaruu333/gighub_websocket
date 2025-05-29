const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Database connection setup
const db = mysql.createConnection({
    host: 'mediumblue-walrus-966639.hostingersite.com',
    user: 'u893176204_gighubph',
    password: '@LB&pGR|4b',
    database: 'u893176204_gighubdb'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Database connected.');
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    },
});

app.use(bodyParser.json()); // Parse JSON bodies


// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('identify', (userId) => {
        socket.join(userId);
        
        // Fetch initial notifications for the user and emit them
        db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at', [userId], (error, notifications) => {
            if (error) {
                console.error('Error fetching initial notifications:', error);
                return;
            }
            const unreadCount = notifications.filter(notif => !notif.viewed).length;
            socket.emit('initial-notifications', { success: true, notifications, unreadCount });
        });
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Adjust as needed for production
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});


app.post('/emit-restriction', (req, res) => {
    const { userId, isRestricted } = req.body;

    // Emit restriction event to the specific user
    if (isRestricted) {
        io.to(userId).emit('restriction', { isRestricted: true });
    }

    res.sendStatus(200); // Acknowledge the event
});

// Listen for incoming POST requests on /emit-unrestriction
app.post('/emit-unrestriction', (req, res) => {
    const { email, isUnrestricted } = req.body;
    console.log('Received unrestriction status for email:', email);
    io.emit('unrestriction', { isUnrestricted, email });
    res.status(200).send('Unrestriction status emitted');
});


// Endpoint to emit notifications
app.post('/emit-notification', (req, res) => {
    const { action, report } = req.body;
    console.log('Emitting notification:', action, report);

    // Emit the notification to all connected clients
    io.emit('notification', { action, report });
    res.status(200).send('Notification emitted');
});


app.post('/emit-booking-approval-notification', (req, res) => {
    const { userId, action, message } = req.body;

    if (!userId || !action || !message) {
        console.error('Missing fields in the request:', { userId, action, message });
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO notifications (user_id, action, message) VALUES (?, ?, ?)`;
    db.query(query, [userId, action, message], (error, results) => {
        if (error) {
            console.error('Error saving booking approval notification:', error);
            return res.status(500).json({ success: false, error: 'Error saving notification' });
        }

        // Emit the approval notification to the specific user's room
        const notification = {
            notification_id: results.insertId,
            action,
            message,
            user_id: userId,
            viewed: false,
            created_at: new Date().toISOString()
        };
        
        io.to(userId).emit('booking-approval-notification', notification);

        // Fetch all notifications after insert
        db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at', [userId], (fetchError, fetchResults) => {
            if (fetchError) {
                console.error('Error fetching notifications after insert:', fetchError);
                return res.status(500).json({ success: false, error: 'Error fetching notifications' });
            }
            
            const unreadCount = fetchResults.filter(notif => !notif.viewed).length;
            res.status(200).json({ success: true, notifications: fetchResults, unreadCount });
        });
    });
});

app.post('/emit-booking-rejection-notification', (req, res) => {
    const { userId, action, message } = req.body;

    if (!userId || !action || !message) {
        console.error('Missing fields in the request:', { userId, action, message });
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO notifications (user_id, action, message) VALUES (?, ?, ?)`;
    db.query(query, [userId, action, message], (error, results) => {
        if (error) {
            console.error('Error saving booking rejection notification:', error);
            return res.status(500).json({ success: false, error: 'Error saving notification' });
        }

        // Emit the rejection notification to the specific user's room
        const notification = {
            notification_id: results.insertId,
            action,
            message,
            user_id: userId,
            viewed: false,
            created_at: new Date().toISOString()
        };
        
        io.to(userId).emit('booking-rejection-notification', notification);

        // Fetch all notifications after insert
        db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at', [userId], (fetchError, fetchResults) => {
            if (fetchError) {
                console.error('Error fetching notifications after insert:', fetchError);
                return res.status(500).json({ success: false, error: 'Error fetching notifications' });
            }
            
            const unreadCount = fetchResults.filter(notif => !notif.viewed).length;
            res.status(200).json({ success: true, notifications: fetchResults, unreadCount });
        });
    });
});

app.post('/emit-booking-cancellation-notification', (req, res) => {
    const { userId, action, message } = req.body;

    if (!userId || !action || !message) {
        console.error('Missing fields in the request:', { userId, action, message });
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO notifications (user_id, action, message) VALUES (?, ?, ?)`;
    db.query(query, [userId, action, message], (error, results) => {
        if (error) {
            console.error('Error saving booking cancellation notification:', error);
            return res.status(500).json({ success: false, error: 'Error saving notification' });
        }

        // Emit the cancellation notification to the specific user's room
        const notification = {
            notification_id: results.insertId,
            action,
            message,
            user_id: userId,
            viewed: false,
            created_at: new Date().toISOString()
        };
        
        io.to(userId).emit('booking-cancellation-notification', notification);

        // Fetch all notifications after insert
        db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at', [userId], (fetchError, fetchResults) => {
            if (fetchError) {
                console.error('Error fetching notifications after insert:', fetchError);
                return res.status(500).json({ success: false, error: 'Error fetching notifications' });
            }
            
            const unreadCount = fetchResults.filter(notif => !notif.viewed).length;
            res.status(200).json({ success: true, notifications: fetchResults, unreadCount });
        });
    });
});



app.post('/emit-booking-notification', (req, res) => {
    const notifications = req.body.notifications;

    if (!Array.isArray(notifications)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    db.beginTransaction(transactionErr => {
        if (transactionErr) return res.status(500).json({ success: false, message: 'Transaction error' });

        let insertCount = 0;

        notifications.forEach(({ userId, action, message }) => {
            const query = `INSERT INTO notifications (user_id, action, message) VALUES (?, ?, ?)`;
            db.query(query, [userId, action, message], (error, results) => {
                if (error) return db.rollback(() => res.status(500).json({ success: false, message: 'Error saving notifications' }));

                const notification = {
                    notification_id: results.insertId,
                    action,
                    message,
                    user_id: userId,
                    viewed: false,
                    created_at: new Date().toISOString()
                };

                // Emit notification
                io.to(userId).emit('booking-notification', notification);

                insertCount++;

                // Commit and fetch notifications after the last insert
                if (insertCount === notifications.length) {
                    db.commit(commitErr => {
                        if (commitErr) return db.rollback(() => res.status(500).json({ success: false, message: 'Transaction commit error' }));

                        // Fetch all notifications for the user in the same response
                        db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at', [userId], (fetchError, fetchResults) => {
                            if (fetchError) return res.status(500).json({ success: false, message: 'Error fetching notifications' });
                            
                            const unreadCount = fetchResults.filter(notif => !notif.viewed).length;
                            res.status(200).json({ success: true, notifications: fetchResults, unreadCount });
                        });
                    });
                }
            });
        });
    });
});


app.post('/emit-ongoing-transaction-notification', (req, res) => {
    const notifications = req.body.notifications;

    if (!Array.isArray(notifications)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    db.beginTransaction(transactionErr => {
        if (transactionErr) return res.status(500).json({ success: false, message: 'Transaction error' });

        let insertCount = 0;

        notifications.forEach(({ userId, action, message }) => {
            // Validate the necessary fields
            if (!userId || !action || !message) {
                console.error('Missing fields in the request:', { userId, action, message });
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const query = `INSERT INTO notifications (user_id, action, message, viewed) VALUES (?, ?, ?, false)`;
            db.query(query, [userId, action, message], (error, results) => {
                if (error) return db.rollback(() => res.status(500).json({ success: false, message: 'Error saving notifications' }));

                const notification = {
                    notification_id: results.insertId,
                    action,
                    message,
                    user_id: userId,
                    viewed: false,
                    created_at: new Date().toISOString(),
                };

                // Emit notification via Socket.IO to the specific user's room
                io.to(userId).emit('ongoing-transaction-notification', notification);

                insertCount++;

                // Commit after processing all notifications
                if (insertCount === notifications.length) {
                    db.commit(commitErr => {
                        if (commitErr) return db.rollback(() => res.status(500).json({ success: false, message: 'Transaction commit error' }));

                        // Fetch all notifications for the users in the notifications array
                        const userIds = notifications.map(n => n.userId).join(',');
                        db.query(`SELECT * FROM notifications WHERE user_id IN (${userIds}) ORDER BY created_at DESC`, (fetchError, fetchResults) => {
                            if (fetchError) return res.status(500).json({ success: false, message: 'Error fetching notifications' });

                            const unreadCounts = notifications.reduce((acc, n) => {
                                acc[n.userId] = fetchResults.filter(f => f.user_id === n.userId && !f.viewed).length;
                                return acc;
                            }, {});

                            res.status(200).json({ success: true, notifications: fetchResults, unreadCounts });
                        });
                    });
                }
            });
        });
    });
});

// // Route to fetch notifications for a specific user
// app.get('/get-notifications', (req, res) => {
//     const user_id = req.query.user_id; // Pass user_id as query parameter
//     const query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at';

//     db.query(query, [user_id], (error, results) => {
//         if (error) {
//             res.status(500).json({ success: false, message: 'Error fetching notifications' });
//         } else {
//             const unreadCount = results.filter(notification => !notification.viewed).length;
//             res.json({ success: true, notifications: results, unreadCount });
//         }
//     });
// });

// Route to mark notifications as viewed
app.post('/mark-notifications-viewed', (req, res) => {
    const user_id = req.body.user_id;
    const query = 'UPDATE notifications SET viewed = 1 WHERE user_id = ? AND viewed = 0';

    db.query(query, [user_id], (error) => {
        if (error) {
            res.status(500).json({ success: false, message: 'Error updating notifications' });
        } else {
            res.json({ success: true });
        }
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
