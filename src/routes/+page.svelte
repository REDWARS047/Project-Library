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
    import LoginModal from '$lib/components/login/loginModal.svelte';
    import { modalOpen } from '$lib/components/login/modalStore';
    import { latestUser } from '$lib/store';

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
    let isLoginFailed = false;
    let modalKey = 0;

    let latestUserData: {
        user: User;
        department: Department;
        course: Course;
        timestamp: string;
        isLoggedIn: boolean;
    } | null = null;

    function handleClick() {
        $modalOpen = true;
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    }

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
                const course = (await fetchUserCourse(user.course_id))[0];
                const department = course
                    ? (await fetchUserDepartment(course.department_id))[0]
                    : undefined;
                console.log('Fetched Course:', course);
                console.log('Fetched Department:', department);
                if (department && course) {
                    updateAttendanceData(department.name, course.name);
                    console.log('Updated attendanceData:', getAttendanceData());
                    console.log('Total Attendance:', getTotalAttendance());
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

    async function onLogin(event: CustomEvent<string>) {
        const rfid = event.detail;
        console.log('RFID received:', rfid);
        if (rfid.length !== 10) {
            console.warn('Invalid RFID length');
            isLoginFailed = true;
            return;
        }

        tapCount++;
        loginMessage = getTapMessage(tapCount);
        loginOutSuccessful = false;

        const { message, success } = await handleUserLogin(rfid, users, userSessions);
        loginMessage = message;
        loginOutSuccessful = success;
        console.log('Login result:', { message, success });

        if (!success) {
            isLoginFailed = true;
            return;
        }

        isLoginFailed = false;
        // Refresh user sessions and get the latest one
        userSessions = await fetchUserSessions();
        latestUserSession = getLatestUserSession(userSessions);

        const loginLogoutTimestamp = new Date().toLocaleString();

        if (success) {
            const currentUser = users.find((user) => user.rfid === rfid);
            if (currentUser) {
                const currentUserCourse = (await fetchUserCourse(currentUser.course_id))[0];
                const currentUserDepartment = (
                    await fetchUserDepartment(currentUserCourse.department_id)
                )[0];

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
                    isLoggedIn: isLoggedIn ?? false
                };

                console.log('Latest user:', latestUserData);

                // Update the latestUser store with the new user data
                latestUser.set([latestUserData]);

                // Update attendance after a successful login/logout
                await updateAttendance(rfid, users, userSessions);
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
            }, 1500);
        }
    }

    let inputElement: HTMLInputElement | null = null;

    function focusInput() {
        if (inputElement) {
            inputElement.focus();
        }
    }

    $: if (defaultModal === false) {
        // Use setTimeout to delay the focus until after the modal has fully closed
        setTimeout(focusInput, 0);
    }
</script>

<img src="decorative-tab.png" alt="decorative header" class="w-full h-auto" />

<div class="min-h-screen bg-custom flex flex-col">
    <div class="w-full p-4 flex justify-between items-start">
        <img
            src="mmcm-logo.png"
            alt="mmcm-logo"
            class="w-1/4 max-w-[600px] min-w-[100px] h-auto ml-auto"
        />
        <h1
            class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-blue-900 font-bold m-auto text-center"
        >
            MMCM Library Sign-in
        </h1>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            class="w-[4vw] h-[4vw] max-w-[60px] max-h-[60px] min-w-[12px] min-h-[12px] mr-auto mt-2 stroke-blue-900 hover:stroke-blue-800 transition-colors duration-200 ease-in-out"
            on:click={handleClick}
            on:keydown={handleKeyDown}
            tabindex="0"
            role="button"
            aria-label="Login"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.982 18.725A7.488 7 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
        </svg>

        <LoginModal />
    </div>

    <div class="flex-grow flex items-center justify-center">
        <div class="flex flex-col items-center w-full max-w-3xl">
            <LoginInput on:login={onLogin} bind:inputElement {isLoginFailed} />
            {#if loginMessage}
                <LoginMessage {loginMessage} {loginOutSuccessful} />
            {/if}
        </div>
    </div>

    {#key modalKey}
        {#if latestUserData && defaultModal}
            <Modal
                class="bg-white rounded-xl shadow-2xl max-w-3xl mx-auto"
                bind:open={defaultModal}
                on:close={() => {
                    modalKey += 1;
                }}
            >
                <div class="flex flex-col items-center justify-center p-8">
                    <img
                        src={latestUserData.user.photo_url}
                        alt="{latestUserData.user.given_name}'s photo"
                        class="w-48 h-48 object-cover rounded-full mb-6 border-4 border-blue-900"
                    />
                    <p class="text-4xl text-blue-900 leading-relaxed text-center mt-2 font-black">
                        {latestUserData.user.given_name}
                        {latestUserData.user.last_name}
                    </p>
                    <p class="text-2xl text-blue-900 leading-relaxed text-center mt-2">
                        {latestUserData.department.name}
                    </p>
                    <p class="text-2xl text-blue-900 leading-relaxed text-center mt-2">
                        {latestUserData.course.name}
                    </p>
                    <p class="text-xl text-blue-900 leading-relaxed text-center mt-3">
                        ID: {latestUserData.user.id}
                    </p>
                    <p class="text-xl text-blue-900 leading-relaxed text-center mt-2">
                        {latestUserData.timestamp}
                    </p>
                    <p class="text-3xl text-blue-900 leading-relaxed text-center mt-4 font-semibold">
                        {latestUserData.isLoggedIn ? 'Logged In' : 'Logged Out'}
                    </p>
                </div>
            </Modal>
        {/if}
    {/key}

    <div class="w-full flex justify-between items-end p-4">
        <img
            src="clir-logo.png"
            alt="clir logo"
            class="w-1/4 max-w-[400px] min-w-[100px] h-auto mb-32 ml-32"
        />
        <div class="flex-grow"></div>
        <img
            src="ccis-logo.png"
            alt="ccis logo"
            class="w-1/16 max-w-[150px] min-w-[60px] h-auto mb-24 mr-12"
        />
    </div>
</div>
