/**
 * Quiz System REST API Server
 * Phase 4 - Enterprise & Scale (v5.0)
 *
 * Lightweight Express server for serving the quiz system
 * and providing REST API endpoints.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STATIC_DIR = path.join(__dirname, '..', 'src', 'frontend');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// MIME type mapping
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip'
};

/**
 * Parse JSON request body
 */
function parseBody(req) {
    return new Promise(function(resolve, reject) {
        let body = '';
        req.on('data', function(chunk) { body += chunk; });
        req.on('end', function() {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Send JSON response
 */
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

/**
 * Serve static files
 */
function serveStatic(req, res, filePath) {
    var fullPath = path.join(STATIC_DIR, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(STATIC_DIR)) {
        sendJSON(res, 403, { error: 'Forbidden' });
        return;
    }

    // Default to index
    if (filePath === '/' || filePath === '') {
        fullPath = path.join(STATIC_DIR, 'quizGenerator.html');
    }

    fs.stat(fullPath, function(err, stats) {
        if (err || !stats.isFile()) {
            sendJSON(res, 404, { error: 'Not found' });
            return;
        }

        var ext = path.extname(fullPath).toLowerCase();
        var contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Security headers
        var headers = {
            'Content-Type': contentType,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };

        // Cache static assets
        if (ext !== '.html') {
            headers['Cache-Control'] = 'public, max-age=86400';
        }

        res.writeHead(200, headers);
        fs.createReadStream(fullPath).pipe(res);
    });
}

// In-memory store (replace with database for production)
var quizStore = {};
var resultStore = [];

/**
 * API route handlers
 */
var apiRoutes = {
    // Health check
    'GET /api/health': function(req, res) {
        sendJSON(res, 200, {
            status: 'healthy',
            version: '2.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    },

    // List quizzes
    'GET /api/quizzes': function(req, res) {
        var quizzes = Object.values(quizStore).map(function(q) {
            return {
                id: q.id,
                name: q.name,
                questionCount: q.data && q.data.tests && q.data.tests[0] ? q.data.tests[0].questions.length : 0,
                createdAt: q.createdAt,
                updatedAt: q.updatedAt
            };
        });
        sendJSON(res, 200, { quizzes: quizzes });
    },

    // Get a quiz
    'GET /api/quizzes/:id': function(req, res, params) {
        var quiz = quizStore[params.id];
        if (!quiz) return sendJSON(res, 404, { error: 'Quiz not found' });
        sendJSON(res, 200, { quiz: quiz });
    },

    // Create a quiz
    'POST /api/quizzes': async function(req, res) {
        try {
            var body = await parseBody(req);
            var id = 'quiz-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            quizStore[id] = {
                id: id,
                name: body.name || 'Untitled Quiz',
                data: body.data || { tests: [] },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Persist to disk
            saveStore();
            sendJSON(res, 201, { quiz: quizStore[id] });
        } catch (e) {
            sendJSON(res, 400, { error: e.message });
        }
    },

    // Update a quiz
    'PUT /api/quizzes/:id': async function(req, res, params) {
        try {
            if (!quizStore[params.id]) return sendJSON(res, 404, { error: 'Quiz not found' });

            var body = await parseBody(req);
            Object.assign(quizStore[params.id], {
                name: body.name || quizStore[params.id].name,
                data: body.data || quizStore[params.id].data,
                updatedAt: new Date().toISOString()
            });

            saveStore();
            sendJSON(res, 200, { quiz: quizStore[params.id] });
        } catch (e) {
            sendJSON(res, 400, { error: e.message });
        }
    },

    // Delete a quiz
    'DELETE /api/quizzes/:id': function(req, res, params) {
        if (!quizStore[params.id]) return sendJSON(res, 404, { error: 'Quiz not found' });
        delete quizStore[params.id];
        saveStore();
        sendJSON(res, 200, { message: 'Quiz deleted' });
    },

    // Submit quiz results
    'POST /api/results': async function(req, res) {
        try {
            var body = await parseBody(req);
            var result = {
                id: 'result-' + Date.now(),
                quizId: body.quizId,
                answers: body.answers,
                score: body.score,
                submittedAt: new Date().toISOString()
            };
            resultStore.push(result);
            if (resultStore.length > 10000) resultStore = resultStore.slice(-10000);
            sendJSON(res, 201, { result: result });
        } catch (e) {
            sendJSON(res, 400, { error: e.message });
        }
    },

    // Get results for a quiz
    'GET /api/results': function(req, res) {
        var parsed = url.parse(req.url, true);
        var quizId = parsed.query.quizId;
        var results = quizId ? resultStore.filter(function(r) { return r.quizId === quizId; }) : resultStore.slice(-100);
        sendJSON(res, 200, { results: results });
    },

    // Export quiz as shareable link data
    'GET /api/share/:id': function(req, res, params) {
        var quiz = quizStore[params.id];
        if (!quiz) return sendJSON(res, 404, { error: 'Quiz not found' });
        sendJSON(res, 200, {
            shareUrl: '/WebTest.html?quizId=' + params.id,
            quiz: { name: quiz.name, questionCount: quiz.data.tests[0] ? quiz.data.tests[0].questions.length : 0 }
        });
    }
};

/**
 * Save store to disk
 */
function saveStore() {
    try {
        fs.writeFileSync(
            path.join(DATA_DIR, 'quizzes.json'),
            JSON.stringify(quizStore, null, 2)
        );
    } catch (e) {
        console.error('Failed to save store:', e);
    }
}

/**
 * Load store from disk
 */
function loadStore() {
    try {
        var filePath = path.join(DATA_DIR, 'quizzes.json');
        if (fs.existsSync(filePath)) {
            quizStore = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error('Failed to load store:', e);
        quizStore = {};
    }
}

/**
 * Match API route with path parameters
 */
function matchRoute(method, pathname) {
    var routeKeys = Object.keys(apiRoutes);
    for (var i = 0; i < routeKeys.length; i++) {
        var parts = routeKeys[i].split(' ');
        var routeMethod = parts[0];
        var routePath = parts[1];

        if (routeMethod !== method) continue;

        // Convert route pattern to regex
        var paramNames = [];
        var regexStr = routePath.replace(/:(\w+)/g, function(match, paramName) {
            paramNames.push(paramName);
            return '([^/]+)';
        });

        var regex = new RegExp('^' + regexStr + '$');
        var match = pathname.match(regex);

        if (match) {
            var params = {};
            for (var j = 0; j < paramNames.length; j++) {
                params[paramNames[j]] = match[j + 1];
            }
            return { handler: apiRoutes[routeKeys[i]], params: params };
        }
    }
    return null;
}

// Load existing data
loadStore();

// Create server
var server = http.createServer(function(req, res) {
    var parsed = url.parse(req.url, true);
    var pathname = parsed.pathname;

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
        var route = matchRoute(req.method, pathname);
        if (route) {
            route.handler(req, res, route.params);
        } else {
            sendJSON(res, 404, { error: 'API endpoint not found' });
        }
        return;
    }

    // Static files
    serveStatic(req, res, pathname);
});

server.listen(PORT, function() {
    console.log('Quiz System Server running on http://localhost:' + PORT);
    console.log('API available at http://localhost:' + PORT + '/api/health');
    console.log('Quiz Generator at http://localhost:' + PORT + '/');
    console.log('WebTest at http://localhost:' + PORT + '/WebTest.html');
});

module.exports = server;
