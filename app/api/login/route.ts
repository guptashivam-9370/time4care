import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Parse the incoming request body
        const { email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if the user exists in the doctor or patient table
        const doctor = await prisma.doctor.findUnique({ where: { email } });
        const patient = await prisma.patient.findUnique({ where: { email } });

        const user = doctor || patient;

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Determine the user role and generate a JWT
        const role = doctor ? 'doctor' : 'patient';

        const token = jwt.sign(
            { id: user.id, role },
            process.env.JWT_SECRET || 'defaultsecret',
            { expiresIn: '1d' }
        );

        // Send success response with the token
        return NextResponse.json(
            { message: 'Login successful', token },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}