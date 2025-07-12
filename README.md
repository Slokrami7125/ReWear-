# ReWear Backend API

A Node.js backend API for the ReWear application with user authentication using JWT, bcrypt, and Prisma with MongoDB.

## Features

- User registration and authentication
- Password hashing with bcrypt
- JWT token-based authentication
- MongoDB database with Prisma ORM
- CORS enabled
- Input validation and error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="mongodb://localhost:27017/rewear"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=3000
   NODE_ENV=development
   ```

3. **Database Setup:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   ```

4. **Start the server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "location": "New York"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Items

#### POST `/api/items`
Create a new item (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "title": "Vintage Denim Jacket",
  "category": "Outerwear",
  "condition": "Good",
  "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/denim-jacket.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Vintage Denim Jacket",
    "category": "Outerwear",
    "condition": "Good",
    "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/denim-jacket.jpg",
    "status": "available",
    "listedAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### PATCH `/api/items/:id/status`
Update item status (requires authentication, owner only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "status": "requested"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item status updated to requested",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Vintage Denim Jacket",
    "category": "Outerwear",
    "condition": "Good",
    "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/denim-jacket.jpg",
    "status": "requested",
    "listedAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

#### GET `/api/items`
Get all items.

**Response (200):**
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Vintage Denim Jacket",
      "category": "Outerwear",
      "condition": "Good",
      "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/denim-jacket.jpg",
      "status": "available",
      "listedAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "name": "John Doe",
        "location": "New York"
      }
    }
  ]
}
```

#### GET `/api/items/:id`
Get specific item.

**Response (200):**
```json
{
  "success": true,
  "message": "Item retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Vintage Denim Jacket",
    "category": "Outerwear",
    "condition": "Good",
    "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/denim-jacket.jpg",
    "status": "available",
    "listedAt": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "location": "New York"
    }
  }
}
```

### Requests

#### POST `/api/requests`
Create a new request to borrow an item (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "itemId": "507f1f77bcf86cd799439012"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Request created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439031",
    "itemId": "507f1f77bcf86cd799439012",
    "fromUserId": "507f1f77bcf86cd799439011",
    "toUserId": "507f1f77bcf86cd799439012",
    "status": "pending",
    "requestedAt": "2024-01-15T11:30:00.000Z",
    "item": {
      "title": "Vintage Denim Jacket",
      "category": "Outerwear"
    }
  }
}
```

#### PATCH `/api/requests/:id`
Accept or decline a request (requires authentication, item owner only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request accepted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439031",
    "itemId": "507f1f77bcf86cd799439012",
    "fromUserId": "507f1f77bcf86cd799439011",
    "toUserId": "507f1f77bcf86cd799439012",
    "status": "accepted",
    "requestedAt": "2024-01-15T11:30:00.000Z",
    "item": {
      "id": "507f1f77bcf86cd799439012",
      "title": "Vintage Denim Jacket",
      "status": "borrowed"
    }
  }
}
```

#### GET `/api/requests/me`
Get all requests made by and received by the logged-in user (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Requests retrieved successfully",
  "data": {
    "sent": [
      {
        "id": "507f1f77bcf86cd799439031",
        "itemId": "507f1f77bcf86cd799439012",
        "status": "pending",
        "requestedAt": "2024-01-15T11:30:00.000Z",
        "item": {
          "title": "Vintage Denim Jacket",
          "category": "Outerwear",
          "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/denim-jacket.jpg",
          "status": "available",
          "user": {
            "name": "John Doe",
            "location": "New York"
          }
        }
      }
    ],
    "received": [
      {
        "id": "507f1f77bcf86cd799439032",
        "itemId": "507f1f77bcf86cd799439013",
        "status": "pending",
        "requestedAt": "2024-01-15T12:00:00.000Z",
        "item": {
          "title": "Classic White Sneakers",
          "category": "Footwear",
          "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/sneakers.jpg",
          "status": "available"
        },
        "fromUser": {
          "name": "Bob Wilson",
          "location": "Chicago"
        }
      }
    ]
  }
}
```

### Image Upload

#### POST `/api/upload`
Upload an image file.

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
```
image: [file]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/rewear/image.jpg",
    "publicId": "rewear/image"
  }
}
```

#### GET `/api/health`
Health check endpoint.

**Response (200):**
```json
{
  "success": true,
  "message": "ReWear API is running"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `500` - Internal Server Error

## Database Schema

### User Model
```prisma
model User {
  id       String   @id @default(auto()) @map("_id") @db.ObjectId
  name     String
  email    String   @unique
  password String
  location String
  points   Int      @default(0)
  joinDate DateTime @default(now())

  @@map("users")
}
```

## Security Features

- Passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire after 24 hours
- Email addresses are unique and validated
- Input validation for all required fields
- CORS enabled for cross-origin requests

## Development

- Uses nodemon for automatic server restart during development
- Comprehensive error handling with try-catch blocks
- Console logging for debugging
- Modular and clean code structure 