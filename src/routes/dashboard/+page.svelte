<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import NavBar from '$lib/components/navbar/navBar.svelte';
	import { fetchUserDepartment, fetchUserCourse, handleUserLogin, fetchUsers, fetchUserSessions } from '$lib/service/supabaseService';
	import { updateAttendanceData, getTotalAttendance, getAttendanceData } from '$lib/service/attendanceData';
	import type { User, UserSession } from '$lib/usertypes';

	const colleges = [
		{ name: 'CAS', departments: ['COMM', 'MMA'] },
		{ name: 'CHS', departments: ['PT', 'PH', 'PSY', 'BIO'] },
		{ name: 'ATYCB', departments: ['ENT', 'ACT', 'MA', 'TM', 'REM'] },
		{ name: 'CCIS', departments: ['EMC', 'CS', 'IS'] },
		{ name: 'CEA', departments: ['AR', 'ChE', 'CE', 'CpE', 'EE', 'Ece', 'IE', 'ME'] }
	];

	let attendanceData = getAttendanceData();
	let totalAttendance = getTotalAttendance();

	async function updateAttendance(rfid: string, users: User[], userSessions: UserSession[]) {
		console.log('Attempting to update attendance for RFID:', rfid);
		const userLogin = await handleUserLogin(rfid, users, userSessions);
		console.log('Login result:', userLogin);
		if (userLogin.success) {
			const user = users.find(u => u.rfid === rfid);
			if (user) {
				const course = (await fetchUserCourse(user.course_id))[0];
				const department = course ? (await fetchUserDepartment(course.department_id))[0] : undefined;
				console.log('Fetched Course:', course);
				console.log('Fetched Department:', department);
				if (department && course) {
					updateAttendanceData(department.name, course.name);
					attendanceData = getAttendanceData(); // Refresh local copy
					totalAttendance = getTotalAttendance();
					console.log('Updated attendanceData:', attendanceData);
				} else {
					console.error('Department or Course not found for user:', user);
				}
			} else {
				console.error('User not found for RFID:', rfid);
			}
		} else {
			console.error('User login failed:', userLogin.message);
		}
	}

	// Example function to simulate a user login
	async function simulateLogin() {
		const rfid = '0490708168'; // Replace with a test RFID
		const users = await fetchUsers();
		const userSessions = await fetchUserSessions();
		await updateAttendance(rfid, users, userSessions);
	}
</script>

<NavBar />

<Card class="mx-auto my-auto w-full max-w-md min-w-full">
	<div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
		<div>
			<h5 class="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
				Library Attendance Statistics Report
			</h5>
			<p class="text-sm font-normal text-gray-500 dark:text-gray-400">May 2024</p>
		</div>
		<div>
			<h5 class="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
				Total: {totalAttendance}
			</h5>
		</div>
	</div>
	{#each colleges as college}
		<div class="pb-4">
			<h6 class="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">
				{college.name}
			</h6>
			{#each college.departments as department}
				<div class="flex justify-between border-b border-gray-200 dark:border-gray-700 py-1">
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">{department}</span>
					<span class="text-sm font-semibold text-gray-900 dark:text-white">
						{attendanceData[college.name][department]}
					</span>
				</div>
			{/each}
		</div>
	{/each}
</Card>

<!-- Test button to simulate login -->
<button on:click={simulateLogin} class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Simulate Login</button>
