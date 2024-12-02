import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { notificationQueue } from "../../../lib/queue";
// import { z } from "zod";
const prisma = new PrismaClient();
interface decodedToken {
  id: string;
  role: string;
}
export async function POST(req: NextRequest) {
  try {
    const { date, time, doctorId } = await req.json();
    if (!date || !time || !doctorId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    //get patientId from the token in session
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as decodedToken;
    const patientId = decoded.id;
    //check the role is patient
    const role = decoded.role;
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Unauthorized:only patient can book appointment" },
        { status: 403 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID not found in token" },
        { status: 403 }
      );
    }
    //check if the doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    //check if date is of the format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }
    //check if time is of the format HH:MM
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM" },
        { status: 400 }
      );
    }
    //merge date and time
    const dateTime = new Date(`${date}T${time}`);
    //check for past dates and time
    const currentDate = new Date();
    if (dateTime < currentDate) {
      return NextResponse.json(
        { error: "Cannot book appointments in the past" },
        { status: 400 }
      );
    }
    const notificationTime = new Date(dateTime.getTime() - 2 * 60 * 60 * 1000);
    const formattedDate = new Date(date).toISOString();
    // return NextResponse.json({ message: "temp" });
    //Check for conflicting appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        date: dateTime,
        doctorId: doctorId,
        status: { not: "CANCELLED" },
      },
    });
    if (appointments.length) {
      return NextResponse.json(
        { error: "Appointment already exists for this time" },
        { status: 400 }
      );
    }
    //Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        date: dateTime,
        doctorId: doctor.id,
        patientId: patientId,
        status: "CONFIRMED",
      },
      include: {
        doctor: true,
        patient: true,
      },
    });
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { email: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const interval = notificationTime.getTime() - Date.now();
    //if the appointment is within 2 hours, send an email immediately
    if (interval <= 0) {
      await notificationQueue.add("send-email", {
        email: patient.email,
        subject: "Appointment Reminder",
        message: `You have an appointment on ${formattedDate} at ${time} with Dr. ${doctor.name}`,
      });
      return NextResponse.json(
        {
          message: "Appointment created successfully",
          appointment: appointment,
        },
        { status: 201 }
      );
    }
    await notificationQueue.add(
      "send-email",
      {
        email: patient.email,
        subject: "Appointment Reminder",
        message: `You have an appointment on ${date} at ${time} with Dr. ${doctor.name}`,
      },
      {
        delay: notificationTime.getTime() - Date.now(), // Schedule job 2 hours before
      }
    );
    return NextResponse.json(
      { message: "Appointment created successfully", appointment: appointment },
      { status: 201 }
    );
  } catch (error: unknown) {
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: "Appointment booking error:", erroris: errorMessage },
      { status: 500 }
    );
  }
}
