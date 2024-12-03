import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, password, role, phone, designation, doctorId } = body;

    if (
      !name ||
      !email ||
      !password ||
      !role ||
      (role === "doctor" && !doctorId)
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ email }, { doctorId }],
      },
    });
    const existingPatient = await prisma.patient.findUnique({
      where: { email },
    });
    if (existingPatient || existingDoctor) {
      return NextResponse.json(
        { error: "User already exists with same email or id" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (role === "doctor") {
      const newUser = await prisma.doctor.create({
        data: {
          name,
          email,
          password: hashedPassword,
          designation,
          phone,
          doctorId,
        },
      });
      //change id from Bigint to string
      const stringid = newUser.id;
      const token = jwt.sign(
        { id: stringid, role: "doctor" },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1d",
        }
      );
      return NextResponse.json(
        { message: "Doctor registered successfully", token },
        { status: 201 }
      );
    } else if (role === "patient") {
      const newUser = await prisma.patient.create({
        data: { name, email, password: hashedPassword, phone },
      });
      const token = jwt.sign(
        { id: newUser.id, role: "patient" },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1d",
        }
      );
      return NextResponse.json(
        { message: "Patient registered successfully", token },
        { status: 201 }
      );
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
  } catch (error: unknown) {
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      console.error(error.message);
      errorMessage = error.message;
    } else {
      console.error(error);
    }

    return NextResponse.json(
      { error: "Error in listing appointments", details: errorMessage },
      { status: 500 }
    );
  }
}
