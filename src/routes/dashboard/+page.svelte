<script lang="ts">
    import { Card } from 'flowbite-svelte';
    import NavBar from '$lib/components/navbar/navBar.svelte';
    import { latestUser } from '$lib/store'; // Import the store
    import { Chart, BarElement, CategoryScale, LinearScale, BarController } from 'chart.js';
    import {
        fetchUserDepartment,
        fetchUserCourse,
        handleUserLogin,
        fetchUsers,
        fetchUserSessions
    } from '$lib/service/supabaseService';
    import {
        updateAttendanceData,
        getTotalAttendance,
        getAttendanceData,
        fetchAttendanceData
    } from '$lib/service/attendanceData';
    import type { User, UserSession } from '$lib/usertypes';
    import { onMount } from 'svelte';

    Chart.register(BarElement, CategoryScale, LinearScale, BarController);

    const colleges = [
        { name: 'CAS', departments: ['COMM', 'MMA'] },
        { name: 'CHS', departments: ['PT', 'PH', 'PSY', 'BIO'] },
        { name: 'ATYCB', departments: ['ENT', 'ACT', 'MA', 'TM', 'REM'] },
        { name: 'CCIS', departments: ['EMC', 'CS', 'IS'] },
        { name: 'CEA', departments: ['AR', 'ChE', 'CE', 'CpE', 'EE', 'Ece', 'IE', 'ME'] },
        { name: 'SHS', departments: ['STEM', 'TVL', 'ABM', 'HUMMS'] }
    ];

    let attendanceData = getAttendanceData();
    let totalAttendance = getTotalAttendance();
    let courseAttendanceData: { [course: string]: number } = {};

    let users: User[] = [];
    let userSessions: UserSession[] = [];

    onMount(async () => {
        users = await fetchUsers();
        userSessions = await fetchUserSessions();
        await fetchAttendanceData();
        attendanceData = getAttendanceData();
        totalAttendance = getTotalAttendance();
        updateCourseAttendanceData();
        createCharts();
    });

    function updateCourseAttendanceData() {
        courseAttendanceData = {};
        for (const college in attendanceData) {
            for (const department in attendanceData[college]) {
                courseAttendanceData[department] = (courseAttendanceData[department] || 0) + attendanceData[college][department];
            }
        }
    }

    async function updateAttendance(rfid: string, users: User[], userSessions: UserSession[]) {
        console.log('Attempting to update attendance for RFID:', rfid);
        const userLogin = await handleUserLogin(rfid, users, userSessions);
        console.log('Login result:', userLogin);
        if (userLogin.success) {
            const user = users.find((u) => u.rfid === rfid);
            if (user) {
                const course = await fetchUserCourse(user.course_id);
                const department = course
                    ? await fetchUserDepartment(course.department_id)
                    : undefined;
                console.log('Fetched Course:', course);
                console.log('Fetched Department:', department);
                if (department && course) {
                    updateAttendanceData(department.name, course.name);
                    attendanceData = getAttendanceData(); // Refresh local copy
                    totalAttendance = getTotalAttendance();
                    updateCourseAttendanceData();
                    console.log('Updated attendanceData:', attendanceData);
                    createCharts();
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

    $: latestUser.subscribe((data) => {
        if (data.length > 0) {
            console.log('New user logged in:', data[0]);
            updateAttendance(data[0].user.rfid, users, userSessions);
        }
    });

    // Example function to simulate a user login
    async function simulateLogin() {
        const rfid = '0490708168'; // Replace with a test RFID
        await updateAttendance(rfid, users, userSessions);
    }

    let departmentChart: Chart | null = null;
    let courseChart: Chart | null = null;

    function createCharts() {
        createDepartmentChart();
        createCourseChart();
    }

    function createDepartmentChart() {
        const ctx = document.getElementById('attendanceChart') as HTMLCanvasElement | null;
        if (ctx) {
            if (departmentChart) {
                departmentChart.destroy();
            }
            departmentChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(attendanceData),
                    datasets: [{
                        label: 'Department Attendance',
                        data: Object.values(attendanceData).map(department => Object.values(department).reduce((a, b) => a + b, 0)),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    function createCourseChart() {
        const ctx = document.getElementById('courseAttendanceChart') as HTMLCanvasElement | null;
        if (ctx) {
            if (courseChart) {
                courseChart.destroy();
            }
            courseChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(courseAttendanceData),
                    datasets: [{
                        label: 'Course Attendance',
                        data: Object.values(courseAttendanceData),
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    function resetStatistics() {
        attendanceData = {
            CAS: { COMM: 0, MMA: 0 },
            CHS: { PT: 0, PH: 0, PSY: 0, BIO: 0 },
            ATYCB: { ENT: 0, ACT: 0, MA: 0, TM: 0, REM: 0 },
            CCIS: { EMC: 0, CS: 0, IS: 0 },
            CEA: { AR: 0, ChE: 0, CE: 0, CpE: 0, EE: 0, Ece: 0, IE: 0, ME: 0 },
            SHS: { STEM: 0, TVL: 0, ABM: 0, HUMMS: 0 }
        };
        totalAttendance = 0;
        courseAttendanceData = {};
        createCharts();
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
    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded" on:click={resetStatistics}>
        Reset Statistics
    </button>
    <button class="mt-4 px-4 py-2 bg-green-500 text-white rounded" on:click={simulateLogin}>
        Simulate Login
    </button>
</Card>

<div class="mt-4">
    <canvas id="attendanceChart"></canvas>
</div>
<div class="mt-4">
    <canvas id="courseAttendanceChart"></canvas>
</div>

<style>
    .chart-container {
        position: relative;
        margin: auto;
        height: 40vh;
        width: 80vw;
    }
</style>
