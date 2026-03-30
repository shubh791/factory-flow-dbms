import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   GET ALL EMPLOYEES
======================================================================== */
export async function GET(request) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: {
          select: { id: true, name: true },
        },
        role: {
          select: { id: true, title: true, level: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Fetch Employees Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

/* =========================================================================
   CREATE EMPLOYEE
======================================================================== */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, experience, departmentId, roleId, employeeCode } = body;

    if (!name || !employeeCode || !departmentId || !roleId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
      return NextResponse.json(
        { error: "Name must contain letters only" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        employeeCode: employeeCode.trim(),
        experience: Number(experience) || 0,
        departmentId: Number(departmentId),
        roleId: Number(roleId),
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Create Employee Error:", error);
    return NextResponse.json(
      { error: "Employee creation failed" },
      { status: 500 }
    );
  }
}
