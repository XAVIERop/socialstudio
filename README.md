# Social Studio Website

## Project Structure

- `client/`: React frontend application
- `server/`: Express backend API

## Setup

### Client

Install dependencies and start the development server:

```bash
cd client
npm install
npm start
```

### Server

Install dependencies and start the server:

```bash
cd server
npm install
npm run dev
```

## Linting

Run ESLint on client and server:

```bash
cd client
npm run lint

cd ../server
npm run lint
```

## Testing

Run tests on client and server:

```bash
cd client
npm test

cd ../server
npm test
```

## Notes

- The server includes global error handling middleware.
- API routes have validation and error handling.
- Client uses react-toastify for user notifications.
