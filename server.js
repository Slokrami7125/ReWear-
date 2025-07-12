const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./utils/cloudinary');
require('dotenv').config();

// Import and configure PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rewear-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Resize for optimization
      { quality: 'auto' } // Auto-optimize quality
    ]
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.userId = user.userId;
    req.userEmail = user.email;
    next();
  });
};

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Routes

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    // Validate required fields
    if (!name || !email || !password || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, password, location) are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        location,
        points: 0, // Default points
        joinDate: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        points: true,
        joinDate: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          name: user.name,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Image Upload Routes

// POST /api/upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: req.file.path,
        publicId: req.file.filename
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific Multer errors
    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files (jpg, png, gif, etc.) are allowed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Item Routes

// POST /api/items (create new item)
app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const { title, category, condition, imageUrl } = req.body;

    // Validate required fields
    if (!title || !category || !condition || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, category, condition, imageUrl) are required'
      });
    }

    // Create item in database
    const newItem = await prisma.item.create({
      data: {
        title,
        category,
        condition,
        imageUrl,
        userId: req.userId,
        status: 'available' // Default status
      },
      select: {
        id: true,
        title: true,
        category: true,
        condition: true,
        imageUrl: true,
        status: true,
        listedAt: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item'
    });
  }
});

// PATCH /api/items/:id/status (update item status)
app.patch('/api/items/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    const allowedStatuses = ['available', 'requested', 'borrowed', 'unavailable'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: available, requested, borrowed, unavailable'
      });
    }

    // Find the item and check ownership
    const item = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        status: true
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user owns the item
    if (item.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update the status of your own items'
      });
    }

    // Update the item status
    const updatedItem = await prisma.item.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        category: true,
        condition: true,
        imageUrl: true,
        status: true,
        listedAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Item status updated to ${status}`,
      data: updatedItem
    });

  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item status'
    });
  }
});

// GET /api/items (get all items)
app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        condition: true,
        imageUrl: true,
        status: true,
        listedAt: true,
        user: {
          select: {
            name: true,
            location: true
          }
        }
      },
      orderBy: {
        listedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Items retrieved successfully',
      data: items
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve items'
    });
  }
});

// GET /api/items/:id (get specific item)
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        condition: true,
        imageUrl: true,
        status: true,
        listedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item retrieved successfully',
      data: item
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve item'
    });
  }
});

// Request System Routes

// POST /api/requests (create new request)
app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.body;

    // Validate required fields
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    // Get the item and check if it exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        title: true,
        userId: true,
        status: true
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user is trying to request their own item
    if (item.userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request your own item'
      });
    }

    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for borrowing'
      });
    }

    // Check if user already has a pending request for this item
    const existingRequest = await prisma.swapRequest.findFirst({
      where: {
        itemId: itemId,
        fromUserId: req.userId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this item'
      });
    }

    // Create the request
    const newRequest = await prisma.swapRequest.create({
      data: {
        itemId: itemId,
        fromUserId: req.userId,
        toUserId: item.userId,
        status: 'pending'
      },
      select: {
        id: true,
        itemId: true,
        fromUserId: true,
        toUserId: true,
        status: true,
        requestedAt: true,
        item: {
          select: {
            title: true,
            category: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: newRequest
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request'
    });
  }
});

// PATCH /api/requests/:id (accept/decline request)
app.patch('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    const allowedStatuses = ['accepted', 'declined'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: accepted, declined'
      });
    }

    // Find the request
    const request = await prisma.swapRequest.findUnique({
      where: { id },
      select: {
        id: true,
        itemId: true,
        fromUserId: true,
        toUserId: true,
        status: true,
        item: {
          select: {
            id: true,
            title: true,
            status: true,
            userId: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Check if user is the item owner (toUserId)
    if (request.toUserId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only respond to requests for your own items'
      });
    }

    // Update request status
    const updatedRequest = await prisma.swapRequest.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        itemId: true,
        fromUserId: true,
        toUserId: true,
        status: true,
        requestedAt: true,
        item: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    // If accepted, update item status to "borrowed"
    if (status === 'accepted') {
      await prisma.item.update({
        where: { id: request.itemId },
        data: { status: 'borrowed' }
      });
      
      updatedRequest.item.status = 'borrowed';
    }

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request'
    });
  }
});

// GET /api/requests/me (get user's requests)
app.get('/api/requests/me', authenticateToken, async (req, res) => {
  try {
    // Get requests sent by the user
    const sentRequests = await prisma.swapRequest.findMany({
      where: { fromUserId: req.userId },
      select: {
        id: true,
        itemId: true,
        status: true,
        requestedAt: true,
        item: {
          select: {
            title: true,
            category: true,
            imageUrl: true,
            status: true,
            user: {
              select: {
                name: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Get requests received by the user
    const receivedRequests = await prisma.swapRequest.findMany({
      where: { toUserId: req.userId },
      select: {
        id: true,
        itemId: true,
        status: true,
        requestedAt: true,
        item: {
          select: {
            title: true,
            category: true,
            imageUrl: true,
            status: true
          }
        },
        fromUser: {
          select: {
            name: true,
            location: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Requests retrieved successfully',
      data: {
        sent: sentRequests,
        received: receivedRequests
      }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve requests'
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ReWear API is running'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ReWear server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 