<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { User, UserSession, Department, Course } from '$lib/usertypes';
    import {
        handleUserLogin,
        fetchUsers,
        fetchUserSessions,
        fetchUserDepartment,
        fetchUserCourse,
        formatDuration,
        getTapMessage
    } from '$lib/service/supabaseService';
    import {
        updateAttendanceData,
        getTotalAttendance,
        getAttendanceData
    } from '$lib/service/attendanceData';
    import LoginInput from '$lib/components/rfid/RFIDInput.svelte';
    import LoginMessage from '$lib/components/rfid/RFIDMessage.svelte';
    import { Modal } from 'flowbite-svelte';
    import { goto } from '$app/navigation';
    import { latestUser } from '$lib/store'; // Import the store

    export let users: User[] = [];
    export let userSessions: UserSession[] = [];
    let latestUserSession: UserSession | null = null;
    let loginMessage = '';
    let loginOutSuccessful = false;
    let messageTimeoutId: string | number | NodeJS.Timeout | undefined;
    let intervalId: ReturnType<typeof setInterval>;
    let defaultModal = false;
    let modalTimeoutId: string | number | NodeJS.Timeout | undefined;
    let tapCount = 0;

    let latestUserData: {
        user: User;
        department: Department;
        course: Course;
        timestamp: string;
        isLoggedIn: boolean;
    } | null = null;

    async function refreshData() {
        try {
            console.log('Refreshing data...');
            users = await fetchUsers();
            userSessions = await fetchUserSessions();
            latestUserSession = getLatestUserSession(userSessions);
            console.log('Data refreshed:', { users, userSessions, latestUserSession });
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    function getLatestUserSession(sessions: UserSession[]): UserSession | null {
        if (sessions.length === 0) return null;
        return sessions.reduce((latest, session) => {
            return new Date(session.login_timestamp) > new Date(latest.login_timestamp)
                ? session
                : latest;
        }, sessions[0]);
    }

    onMount(async () => {
        console.log('Component mounted');
        await refreshData();
        intervalId = setInterval(refreshData, 35000);
    });

    onDestroy(() => {
        console.log('Component destroyed');
        clearInterval(intervalId);
    });

    $: if (latestUserSession && latestUserData) {
        latestUserData.isLoggedIn =
            latestUserSession.user_id === latestUserData.user.id && !latestUserSession.logout_timestamp;
        latestUserData.timestamp = new Date(latestUserSession.login_timestamp).toLocaleString();
    }

    async function updateAttendance(rfid: string, users: User[], userSessions: UserSession[]) {
        console.log('Attempting to update attendance for RFID:', rfid);
        const userLogin = await handleUserLogin(rfid, users, userSessions);
        console.log('Login result:', userLogin);
        if (userLogin.success) {
            const user = users.find((u) => u.rfid === rfid);
            if (user) {
                const course = await fetchUserCourse(user.course_id);
                if (course) {
                    const department = await fetchUserDepartment(course.department_id);
                    console.log('Fetched Course:', course);
                    console.log('Fetched Department:', department);
                    if (department) {
                        updateAttendanceData(department.name, course.name);
                        console.log('Updated attendanceData:', getAttendanceData());
                        console.log('Total Attendance:', getTotalAttendance());
                    } else {
                        console.error('Department not found for user:', user);
                    }
                } else {
                    console.error('Course not found for user:', user);
                }
            } else {
                console.error('User not found for RFID:', rfid);
            }
        } else {
            console.error('User login failed:', userLogin.message);
        }
    }

    async function onLogin(event: CustomEvent<string>) {
        const rfid = event.detail;
        console.log('RFID received:', rfid);
        if (rfid.length !== 10) {
            console.warn('Invalid RFID length');
            return;
        }

        tapCount++;
        loginMessage = getTapMessage(tapCount);
        loginOutSuccessful = false;

        const { message, success } = await handleUserLogin(rfid, users, userSessions);
        loginMessage = message;
        loginOutSuccessful = success;
        console.log('Login result:', { message, success });

        // Refresh user sessions and get the latest one
        userSessions = await fetchUserSessions();
        latestUserSession = getLatestUserSession(userSessions);

        const loginLogoutTimestamp = new Date().toLocaleString();

        if (success) {
            const currentUser = users.find((user) => user.rfid === rfid);
            if (currentUser) {
                const currentUserCourse = await fetchUserCourse(currentUser.course_id);
                if (currentUserCourse) {
                    const currentUserDepartment = await fetchUserDepartment(currentUserCourse.department_id);
                    console.log('Current user details:', {
                        currentUser,
                        currentUserCourse,
                        currentUserDepartment
                    });

                    if (currentUserDepartment) {
                        // Determine if the user is logged in based on the latest session
                        const isLoggedIn =
                            latestUserSession &&
                            latestUserSession.user_id === currentUser.id &&
                            !latestUserSession.logout_timestamp;

                        latestUserData = {
                            user: currentUser,
                            department: currentUserDepartment,
                            course: currentUserCourse,
                            timestamp: loginLogoutTimestamp,
                            isLoggedIn: !!isLoggedIn // Ensure isLoggedIn is always a boolean
                        };

                        console.log('Latest user:', latestUserData);

                        // Update the latestUser store with the new user data
                        latestUser.set([latestUserData]);

                        // Update attendance after a successful login/logout
                        await updateAttendance(rfid, users, userSessions);
                    } else {
                        console.error('Department not found for current user:', currentUser);
                    }
                } else {
                    console.error('Course not found for current user:', currentUser);
                }
            }
        }

        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
        }
        messageTimeoutId = setTimeout(() => {
            loginMessage = '';
            loginOutSuccessful = false;
            tapCount = 0;
        }, 2000);

        // Show the modal on successful login/logout
        if (success) {
            defaultModal = true;
            if (modalTimeoutId) {
                clearTimeout(modalTimeoutId);
            }
            modalTimeoutId = setTimeout(() => {
                defaultModal = false;
            }, 2000);
        }
    }

    function navigateTo() {
        console.log('Navigating to dashboard');
        goto('/dashboard');
    }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
    <div class="w-full max-w-md p-8 bg-white shadow-md rounded-md">
        <h1 class="text-4xl text-blue-900 font-black mb-6 text-center">WELCOME BACK</h1>
        <LoginInput on:login={onLogin} />
        {#if loginMessage}
            <LoginMessage {loginMessage} {loginOutSuccessful} />
        {/if}
        <button
            class="mt-6 w-full py-2 bg-blue-900 text-white rounded-md hover:bg-red-600 transition-colors"
            on:click={navigateTo}
        >
            Go to Dashboard
        </button>
    </div>

    {#if latestUserData}
        <Modal class="bg-white rounded-lg shadow-lg" bind:open={defaultModal}>
            <div class="flex flex-col items-center justify-center p-4">
                <img
                    src={latestUserData.user.photo_url}
                    alt="{latestUserData.user.given_name}'s photo"
                    class="w-32 h-32 object-cover rounded-full mb-4"
                />
                <p class="text-2xl text-blue-900 leading-relaxed text-center mt-1 font-black">
                    {latestUserData.user.given_name} {latestUserData.user.last_name}
                </p>
                <p class="text-xl text-blue-900 leading-relaxed text-center mt-1">
                    {latestUserData.department.name}
                </p>
                <p class="text-xl text-blue-900 leading-relaxed text-center mt-1">
                    {latestUserData.course.name}
                </p>
                <p class="text-lg text-blue-900 leading-relaxed text-center mt-1">
                    ID: {latestUserData.user.id}
                </p>
                <p class="text-lg text-blue-900 leading-relaxed text-center mt-1">
                    {latestUserData.timestamp}
                </p>
                <p class="text-xl text-blue-900 leading-relaxed text-center mt-1 font-semibold">
                    {latestUserData.isLoggedIn ? 'Logged In' : 'Logged Out'}
                </p>
            </div>
        </Modal>
    {/if}
</div>
