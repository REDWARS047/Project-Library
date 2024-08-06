export type AttendanceData = {
	[college: string]: {
		[department: string]: number;
	};
};

const attendanceData: AttendanceData = {
	CAS: { COMM: 0, MMA: 0 },
	CHS: { PT: 0, PH: 0, PSY: 0, BIO: 0 },
	ATYCB: { ENT: 0, ACT: 0, MA: 0, TM: 0, REM: 0 },
	CCIS: { EMC: 0, CS: 0, IS: 0 },
	CEA: { AR: 0, ChE: 0, CE: 0, CpE: 0, EE: 0, Ece: 0, IE: 0, ME: 0 }
};

export function updateAttendanceData(departmentName: string, courseName: string): void {
	if (attendanceData[departmentName] && attendanceData[departmentName][courseName] !== undefined) {
		attendanceData[departmentName][courseName]++;
	}
}

export function getTotalAttendance(): number {
	return Object.values(attendanceData).reduce((total, dept) => {
		return total + Object.values(dept).reduce((subTotal, value) => subTotal + value, 0);
	}, 0);
}

export function getAttendanceData(): AttendanceData {
	return attendanceData;
}
