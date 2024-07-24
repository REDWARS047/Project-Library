<script lang="ts">
	import { Card } from 'flowbite-svelte';

	const colleges = [
		{ name: 'CAS', departments: ['COMM', 'MMA'] },
		{ name: 'CHS', departments: ['PT', 'PH', 'PSY', 'BIO'] },
		{ name: 'ATYCB', departments: ['ENT', 'ACT', 'MA', 'TM', 'REM'] },
		{ name: 'CCIS', departments: ['EMC', 'CS', 'IS'] },
		{ name: 'CEA', departments: ['AR', 'ChE', 'CE', 'CpE', 'EE', 'Ece', 'IE', 'ME'] }
	];

	const attendanceData = {
		CAS: { COMM: 0, MMA: 0 },
		CHS: { PT: 0, PH: 0, PSY: 0, BIO: 0 },
		ATYCB: { ENT: 0, ACT: 0, MA: 0, TM: 0, REM: 0 },
		CCIS: { EMC: 0, CS: 0, IS: 0 },
		CEA: { AR: 0, ChE: 0, CE: 0, CpE: 0, EE: 0, Ece: 0, IE: 0, ME: 0 }
	};

	const totalAttendance = Object.values(attendanceData).reduce((total, dept) => {
		return total + Object.values(dept).reduce((subTotal, value) => subTotal + value, 0);
	}, 0);
</script>

<Card>
	<div class="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
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
					<span class="text-sm font-semibold text-gray-900 dark:text-white"
						>{attendanceData[college.name][department]}</span
					>
				</div>
			{/each}
		</div>
	{/each}
</Card>
