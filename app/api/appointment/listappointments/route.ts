import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
// import jwt from "jsonwebtoken";
import { getData } from "@/lib/getdata";
const prisma = new PrismaClient();
export async function GET(req: NextRequest) {
  //   const { id, role } = await req.json();
  //get data from getData function
  const body = await getData(req);
  const { id, role } = body;
  console.log(body);
  if (!id) {
    return NextResponse.json(
      {
        body: { error: "ID is required" },
      },
      { status: 400 }
    );
  }
  //change doctorId to int

  try {
    if (role !== "patient") {
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: id,
        },
        include: {
          doctor: true,
          patient: true,
        },
      });
      return NextResponse.json({
        status: 200,
        body: appointments,
      });
    }
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: id,
      },
    });
    return NextResponse.json({
      status: 200,
      body: appointments,
    });
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
