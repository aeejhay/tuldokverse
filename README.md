# TULDOK Social

A blockchain-based social media platform using XRPL and XUMM Wallet integration.

## Project Structure

```
tuldokverse/
├── backend/           # Express.js server
│   ├── config/       # Database and initialization configuration
│   ├── controllers/  # Request handlers
│   ├── routes/       # API routes
│   └── server.js     # Main server file
└── frontend/         # React application
    ├── public/       # Static files
    └── src/          # Source code
```

## Features

- User registration and authentication with XUMM Wallet
- TULDOK token balance verification
- JWT-based authentication
- Social media post creation and management
- XRPL integration for blockchain transactions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL
- XUMM Wallet account
- XRPL account with TULDOK tokens

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd tuldokverse
```

2. Install Backend Dependencies
```bash
cd backend
npm install
```

3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

4. Configure Environment Variables
Create a `.env` file in the backend directory with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=tuldokverse_social
PORT=5000
JWT_SECRET=your-secret-key
```

### Running the Application

1. Start the Backend Server
```bash
cd backend
npm start
```

2. Start the Frontend Application
```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:5000`.

## API Endpoints

- POST `/api/users/register` - User registration
- POST `/api/users/login` - User login
- GET `/api/posts` - Get all posts
- POST `/api/posts` - Create a new post

## Technologies Used

- Frontend:
  - React.js
  - React Router
  - Axios
  - CSS3

- Backend:
  - Express.js
  - MySQL
  - JSON Web Tokens (JWT)
  - XRPL SDK
  - XUMM SDK

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 