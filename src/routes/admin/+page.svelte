<script lang="ts">
    import { onMount } from 'svelte';
    import {
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        TableSearch,
        Button,
        ButtonGroup
    } from 'flowbite-svelte';
    import { Section } from 'flowbite-svelte-blocks';
    import type { User, UserSession, CombinedUserData } from '$lib/usertypes';
    import {
        fetchUsers,
        fetchUserSessions,
        handleUserLogin,
        fetchCombinedUserData
    } from '$lib/service/supabaseService';
    import {
        PlusOutline,
        ChevronRightOutline,
        ChevronLeftOutline
    } from 'flowbite-svelte-icons';
    import NavBar from '$lib/components/navbar/navBar.svelte';
    import { latestUser } from '$lib/store';

    let divClass = 'bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden';
    let innerDivClass =
        'flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4';
    let searchClass = 'w-full md:w-1/2 relative';
    let svgDivClass = 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none';
    let classInput =
        'text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2  pl-10';

    let users: User[] = [];
    let userSessions: UserSession[] = [];
    let searchTerm = '';
    let currentPosition = 0;
    const itemsPerPage = 10;
    const showPage = 5;
    let totalPages = 0;
    let pagesToShow: number[] = [];
    let totalItems = 0;
    let startPage = 0;
    let endPage = 0;
    let paginationData: CombinedUserData[] = [];
    let currentUserData: CombinedUserData[] = [];
    let selectedItems = new Set();
    let startRange: number;
    let endRange: number;

    async function fetchData() {
        try {
            users = await fetchUsers();
            userSessions = await fetchUserSessions();
            const storedData = localStorage.getItem('currentUserData');
            if (storedData) {
                currentUserData = JSON.parse(storedData);
            }
            totalItems = currentUserData.length;
            renderPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    const updateDataAndPagination = () => {
        renderPagination();
    };

    const loadNextPage = () => {
        if (currentPosition + itemsPerPage < currentUserData.length) {
            currentPosition += itemsPerPage;
            updateDataAndPagination();
        }
    };

    const loadPreviousPage = () => {
        if (currentPosition - itemsPerPage >= 0) {
            currentPosition -= itemsPerPage;
            updateDataAndPagination();
        }
    };

    const renderPagination = () => {
        totalPages = Math.ceil(currentUserData.length / itemsPerPage);
        const currentPage = Math.ceil((currentPosition + 1) / itemsPerPage);

        startPage = currentPage - Math.floor(showPage / 2);
        startPage = Math.max(1, startPage);
        endPage = Math.min(startPage + showPage - 1, totalPages);

        pagesToShow = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

        // Update startRange and endRange based on current position and items per page
        startRange = currentPosition + 1;
        endRange = Math.min(currentPosition + itemsPerPage, totalItems);
    };

    const goToPage = (pageNumber: number) => {
        currentPosition = (pageNumber - 1) * itemsPerPage;
        updateDataAndPagination();
    };

    const handleLogin = async (rfid: string) => {
        try {
            const loginResult = await handleUserLogin(rfid, users, userSessions);
            console.log('Login result:', loginResult);
            if (loginResult.success) {
                const combinedData = await fetchCombinedUserData(rfid);
                console.log('Combined data:', combinedData);
                if (combinedData) {
                    currentUserData = currentUserData.filter(data => data.student_id !== combinedData.student_id);
                    currentUserData.push(combinedData);
                    saveToLocalStorage();
                    renderPagination();
                }
            } else {
                console.error('User login failed:', loginResult.message);
            }
        } catch (error) {
            console.error('Error handling user login:', error);
        }
    };

    function saveToLocalStorage() {
        localStorage.setItem('currentUserData', JSON.stringify(currentUserData));
    }

    async function simulateLogin() {
        const rfid = '0490708178	'; // Test RFID
        await handleLogin(rfid);
    }

    onMount(async () => {
        await fetchData();
        latestUser.subscribe((data) => {
            if (data.length > 0) {
                currentUserData = currentUserData.filter(user => user.student_id !== data[0].user.id);
                currentUserData.push({
                    given_name: data[0].user.given_name,
                    last_name: data[0].user.last_name,
                    student_id: data[0].user.id,
                    department: data[0].department.name,
                    student_type: data[0].user.category,
                    rfid_id: data[0].user.rfid,
                    time_in: data[0].timestamp,
                    time_out: data[0].isLoggedIn ? null : data[0].timestamp,
                    date: new Date().toLocaleDateString(),
                    course_id: data[0].user.course_id,
                    course_name: data[0].course.name // Ensure course_name is included here
                });
                saveToLocalStorage();
                renderPagination();
            }
        });
    });

    $: filteredItems = currentUserData.filter((item) => {
        const matchesSearch = item.given_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    $: currentPageItems = filteredItems.slice(currentPosition, currentPosition + itemsPerPage);
</script>

<NavBar />

<Section name="advancedTable" classSection="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
    <Button on:click={simulateLogin} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Simulate Login
    </Button>
    <TableSearch
        placeholder="Search"
        hoverable={true}
        bind:inputValue={searchTerm}
        {divClass}
        {innerDivClass}
        {searchClass}
        {classInput}
    >
        <div
            slot="header"
            class="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0"
        >
        </div>
        <TableHead>
            <TableHeadCell padding="px-4 py-3" scope="col">First Name</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Last Name</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Student ID</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Department</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Student Type</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">RFID ID</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Course</TableHeadCell> <!-- Add this line -->
            <TableHeadCell padding="px-4 py-3" scope="col">Time IN</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Time OUT</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Date</TableHeadCell>
        </TableHead>
        <TableBody>
            {#if searchTerm !== ''}
                {#each filteredItems as item (item.student_id)}
                    <TableBodyRow>
                        <TableBodyCell class="px-4 py-3">{item.given_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.last_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.department}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_type}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.rfid_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.course_name}</TableBodyCell> <!-- Add this line -->
                        <TableBodyCell class="px-4 py-3">{item.time_in}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.time_out}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.date}</TableBodyCell>
                    </TableBodyRow>
                {/each}
            {:else}
                {#each currentPageItems as item (item.student_id)}
                    <TableBodyRow>
                        <TableBodyCell class="px-4 py-3">{item.given_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.last_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.department}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_type}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.rfid_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.course_name}</TableBodyCell> <!-- Add this line -->
                        <TableBodyCell class="px-4 py-3">{item.time_in}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.time_out}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.date}</TableBodyCell>
                    </TableBodyRow>
                {/each}
            {/if}
        </TableBody>
        <div
            slot="footer"
            class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
            aria-label="Table navigation"
        >
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                Showing
                <span class="font-semibold text-gray-900 dark:text-white">{startRange}-{endRange}</span>
                of
                <span class="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
            </span>
            <ButtonGroup>
                <Button on:click={loadPreviousPage} disabled={currentPosition === 0}
                    ><ChevronLeftOutline size="xs" class="m-1.5" /></Button
                >
                {#each pagesToShow as pageNumber}
                    <Button on:click={() => goToPage(pageNumber)}>{pageNumber}</Button>
                {/each}
                <Button on:click={loadNextPage} disabled={currentPosition + itemsPerPage >= totalItems}
                    ><ChevronRightOutline size="xs" class="m-1.5" /></Button
                >
            </ButtonGroup>
        </div>
    </TableSearch>
</Section>
