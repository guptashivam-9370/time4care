# Time4Care(Notification-Based Appointment Reminder System)

## Tech Stack

- Next.js
- TypeScript
- PostgreSQL
- Redis
- BullMQ
- Nodemailer

## Features

1. User Management
   - User Registration
   - User Authentication
2. Appointment Scheduling
   - Patients can book an appointment with a doctor
3. Notification System
   - Automatically send an email to patients a few hours before their scheduled appointment

## Setup Instructions

### Prerequisites

- Node.js (>= 14.x)
- PostgreSQL
- Redis

### Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```env
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/guptashivam9370/time4care.git
   cd your-repo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Start Redis server:
   ```bash
   redis-server
   ```

## API Documentation

### User Registration

#### Endpoint

`POST /api/register`

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "doctor",
  "doctorId": "1234ABC",
  "phone": "1234567890",
  "designation": "Cardiologist"
}
```

#### Response

```json
{
  "message": "Doctor registered successfully",
  "token": "jwt-token"
}
```

### User Authentication

#### Endpoint

`POST /api/login`

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "doctor"
}
```

#### Response

```json
{
  "message": "Login successful",
  "token": "jwt-token"
}
```

### Book Appointment

#### Endpoint

`POST /api/appointments`

- the appointment will be booked with the doctor of specified doctorId
- doctor with doctorId should present in database

#### Request Body

```json
{
  "date": "2024-12-03",
  "time": "12:20",
  "doctorId": 1
}
```

#### Response

```json
{
  "message":"Appointment created successfully"
  "appointment":{
        "id": 1,
        "date": "2024-12-03T12:20:00.000Z",
        "doctorId": 1,
        "patientId": "some-patient-id",
        "status": "CONFIRMED",
        "createdAt":"some date",
        "doctor":{
            ...
        }
        "patient":{
            ...
        }
  }
}
```

### List Down appointments

`/api/appointment/listappointments`

- patient or doctor should be authenticated
- all the appointments of the logged in person will be displayed

#### Response

```json
{
    "status":200,
    "body":{
        [{appointments}]
    }
}
```

### Error Handling

#### Invalid Appointment Data

```json
{
  "error": "Invalid time format. Use HH:MM"
}
```

#### Unauthorized Access

```json
{
  "error": "Unauthorized"
}
```

#### User Not Found

```json
{
  "error": "User not found"
}
```

## Notification System

### Description

The notification system uses BullMQ to handle sending email notifications asynchronously. Nodemailer is used for delivering emails.

### Setup

- Ensure Redis server is running.
- The worker processes jobs from the queue and sends email notifications.
