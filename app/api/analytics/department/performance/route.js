import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: {
          where: {
            status: 'ACTIVE',
            isDeleted: false,
          },
          include: {
            productions: true,
          },
        },
      },
    });

    const result = departments.map((dept) => {
      let totalUnits = 0;
      let totalDefects = 0;
      let totalExperience = 0;

      dept.employees.forEach((emp) => {
        totalExperience += emp.experience || 0;

        emp.productions.forEach((p) => {
          totalUnits += p.units;
          totalDefects += p.defects;
        });
      });

      const efficiency =
        totalUnits > 0
          ? ((totalUnits - totalDefects) / totalUnits) * 100
          : 0;

      return {
        department: dept.name,
        employees: dept.employees.length,
        avgExperience:
          dept.employees.length > 0
            ? Number(
                (totalExperience / dept.employees.length).toFixed(1)
              )
            : 0,
        units: totalUnits,
        defects: totalDefects,
        efficiency: Number(efficiency.toFixed(2)),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Department performance error:', error);
    return NextResponse.json(
      { error: 'Failed to compute department performance' },
      { status: 500 }
    );
  }
}
