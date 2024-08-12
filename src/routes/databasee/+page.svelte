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
        ButtonGroup,
        Modal,
        Label,
        Input,
        Select
    } from 'flowbite-svelte';
    import NavBar from '$lib/components/navbar/navBar.svelte';
    import { ChevronRightOutline, ChevronLeftOutline } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';
    import {
        fetchUsers,
        fetchUserSessions,
        fetchCombinedUserData,
        updateUser,
        deleteUser,
        fetchCourses,
        fetchDepartments
    } from '$lib/service/supabaseService';
    import type { CombinedUserData, Course, Department } from '$lib/usertypes';

    let currentUserData: CombinedUserData[] = [];
    let searchTerm = '';
    let currentPosition = 0;
    const itemsPerPage = 10;
    const showPage = 5;
    let totalPages = 0;
    let pagesToShow: number[] = [];
    let totalItems = 0;
    let startRange = 0;
    let endRange = 0;
    let filteredItems: CombinedUserData[] = [];
    let currentPageItems: CombinedUserData[] = [];
    let selectedItems = new Set<number>();
    let editModalOpen = false;
    let deleteModalOpen = false;
    let editUser: CombinedUserData | null = null;
    let selectedDepartmentId = 0;
    let availableCourses: Course[] = [];
    let courses: Course[] = [];
    let departments: Department[] = [];

    async function fetchData() {
        try {
            const [users, userSessions, courseData, departmentData] = await Promise.all([
                fetchUsers(),
                fetchUserSessions(),
                fetchCourses(),
                fetchDepartments()
            ]);
            const combinedData = await Promise.all(users.map(user => fetchCombinedUserData(user.rfid)));
            currentUserData = combinedData.filter(data => data !== null) as CombinedUserData[];
            totalItems = currentUserData.length;

            courses = courseData;
            departments = departmentData;
            renderPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    onMount(async () => {
        await fetchData();
    });

    const renderPagination = () => {
        filteredItems = currentUserData.filter((item) =>
            (item.given_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.student_id.toString().includes(searchTerm) ||
            item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.student_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.rfid_id?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (selectedDepartmentId === 0 || item.department === getDepartmentNameById(selectedDepartmentId))
        );
        totalPages = Math.ceil(filteredItems.length / itemsPerPage);
        const currentPage = Math.ceil((currentPosition + 1) / itemsPerPage);

        let startPage = currentPage - Math.floor(showPage / 2);
        startPage = Math.max(1, startPage);
        let endPage = Math.min(startPage + showPage - 1, totalPages);

        pagesToShow = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
        updateDataAndPagination();
    };

    const updateDataAndPagination = () => {
        startRange = currentPosition + 1;
        endRange = Math.min(currentPosition + itemsPerPage, totalItems);
        currentPageItems = filteredItems.slice(currentPosition, currentPosition + itemsPerPage);
    };

    const goToPage = (pageNumber: number) => {
        currentPosition = (pageNumber - 1) * itemsPerPage;
        updateDataAndPagination();
    };

    const loadNextPage = () => {
        if (currentPosition + itemsPerPage < filteredItems.length) {
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

    const navigateToRegistration = () => {
        goto('/registration');
    };

    $: if (searchTerm || selectedDepartmentId) {
        renderPagination();
    }

    const openEditModal = (user: CombinedUserData) => {
        editUser = { ...user };
        selectedDepartmentId = getDepartmentIdByName(editUser.department);
        handleDepartmentChange();
        editModalOpen = true;
    };

    const closeEditModal = () => {
        editModalOpen = false;
        editUser = null;
    };

    const handleDepartmentChange = () => {
        if (selectedDepartmentId) {
            availableCourses = courses.filter(course => course.department_id === selectedDepartmentId);
            if (editUser) {
                editUser.course_name = ''; // Reset the course selection when the department changes
            }
        } else {
            availableCourses = [];
        }
    };

    const handleSaveEdit = async () => {
        if (editUser) {
            editUser.department = getDepartmentNameById(selectedDepartmentId);
            const selectedCourse = availableCourses.find(course => course.name === editUser?.course_name);
            if (selectedCourse) {
                editUser.course_id = selectedCourse.id;
            }

            try {
                const updatedUser = await updateUser(editUser);
                const index = currentUserData.findIndex(user => user.student_id === editUser?.student_id);
                if (index !== -1) {
                    currentUserData[index] = updatedUser!;
                    renderPagination();
                    closeEditModal();
                }
            } catch (error) {
                console.error('Error updating user:', error);
            }
        }
    };

    const getDepartmentNameById = (departmentId: number) => {
        const department = departments.find(dept => dept.id === departmentId);
        return department ? department.name : '';
    };

    const getDepartmentIdByName = (departmentName: string) => {
        const department = departments.find(dept => dept.name === departmentName);
        return department ? department.id : 0;
    };

    const toggleSelectItem = (studentId: number) => {
        if (selectedItems.has(studentId)) {
            selectedItems.delete(studentId);
        } else {
            selectedItems.add(studentId);
        }
        console.log("Selected items:", selectedItems);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === currentPageItems.length) {
            selectedItems.clear();
        } else {
            currentPageItems.forEach(item => selectedItems.add(item.student_id));
        }
        console.log("Selected items:", selectedItems);
    };

    const openDeleteModal = () => {
        deleteModalOpen = true;
    };

    const closeDeleteModal = () => {
        deleteModalOpen = false;
    };

    const deleteSelected = async () => {
        try {
            const idsToDelete = Array.from(selectedItems);
            console.log("Deleting users with IDs:", idsToDelete);
            for (let studentId of idsToDelete) {
                await deleteUser(studentId);
            }
            currentUserData = currentUserData.filter(user => !selectedItems.has(user.student_id));
            selectedItems.clear();
            renderPagination();
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting users:', error);
        }
    };

    const deleteUserById = async (studentId: number) => {
        try {
            await deleteUser(studentId);
            currentUserData = currentUserData.filter(user => user.student_id !== studentId);
            renderPagination();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };
</script>

<NavBar />

<div class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center">
            <Button on:click={navigateToRegistration} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Add New User
            </Button>
            <Button on:click={openDeleteModal} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2">
                Delete Selected
            </Button>
        </div>
        <div class="flex items-center">
            <Select bind:value={selectedDepartmentId} on:change={handleDepartmentChange} class="ml-2">
                <option value="0">Choose department...</option>
                {#each departments as department}
                    <option value={department.id}>{department.name}</option>
                {/each}
            </Select>
        </div>
    </div>
    <TableSearch
        placeholder="Search"
        hoverable={true}
        bind:inputValue={searchTerm}
        divClass="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden"
        innerDivClass="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4"
        searchClass="w-full md:w-1/2 relative"
        classInput="text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 pl-10"
    >
        <div slot="header" class="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0"></div>
        <TableHead>
            <TableHeadCell padding="px-4 py-3" scope="col">
            </TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">First Name</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Last Name</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Student ID</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Department</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Course</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Student Type</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">RFID ID</TableHeadCell>
            <TableHeadCell padding="px-4 py-3" scope="col">Actions</TableHeadCell>
        </TableHead>
        <TableBody class="divide-y">
            {#if searchTerm !== ''}
                {#each filteredItems as item (item.student_id)}
                    <TableBodyRow>
                        <TableBodyCell class="px-4 py-3">
                            <input type="checkbox" checked={selectedItems.has(item.student_id)} on:change={() => toggleSelectItem(item.student_id)} />
                        </TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.given_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.last_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.department}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.course_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_type}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.rfid_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">
                            <Button on:click={() => openEditModal(item)} class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">Edit</Button>
                            <Button on:click={() => deleteUserById(item.student_id)} class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded ml-2">Delete</Button>
                        </TableBodyCell>
                    </TableBodyRow>
                {/each}
            {:else}
                {#each currentPageItems as item (item.student_id)}
                    <TableBodyRow>
                        <TableBodyCell class="px-4 py-3">
                            <input type="checkbox" checked={selectedItems.has(item.student_id)} on:change={() => toggleSelectItem(item.student_id)} />
                        </TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.given_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.last_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.department}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.course_name}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.student_type}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">{item.rfid_id}</TableBodyCell>
                        <TableBodyCell class="px-4 py-3">
                            <Button on:click={() => openEditModal(item)} class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">Edit</Button>
                            <Button on:click={() => deleteUserById(item.student_id)} class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded ml-2">Delete</Button>
                        </TableBodyCell>
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
                <Button on:click={loadPreviousPage} disabled={currentPosition === 0}>
                    <ChevronLeftOutline size="xs" class="m-1.5" />
                </Button>
                {#each pagesToShow as pageNumber}
                    <Button on:click={() => goToPage(pageNumber)}>{pageNumber}</Button>
                {/each}
                <Button on:click={loadNextPage} disabled={currentPosition + itemsPerPage >= totalItems}>
                    <ChevronRightOutline size="xs" class="m-1.5" />
                </Button>
            </ButtonGroup>
        </div>
    </TableSearch>
</div>

{#if editModalOpen && editUser}
    <Modal bind:open={editModalOpen}>
        <div class="p-6 space-y-4">
            <h3 class="text-xl font-semibold text-gray-900">Edit User</h3>
            <div class="space-y-2">
                <Label for="editFirstName">First Name</Label>
                <Input id="editFirstName" type="text" bind:value={editUser.given_name} />
            </div>
            <div class="space-y-2">
                <Label for="editLastName">Last Name</Label>
                <Input id="editLastName" type="text" bind:value={editUser.last_name} />
            </div>
            <div class="space-y-2">
                <Label for="editDepartment">Department</Label>
                <Select id="editDepartment" bind:value={selectedDepartmentId} on:change={handleDepartmentChange}>
                    <option value="0">Choose department...</option>
                    {#each departments as department}
                        <option value={department.id}>{department.name}</option>
                    {/each}
                </Select>
            </div>
            <div class="space-y-2">
                <Label for="editCourseName">Course</Label>
                <Select id="editCourseName" bind:value={editUser.course_name}>
                    {#each availableCourses as course}
                        <option value={course.name}>{course.name}</option>
                    {/each}
                </Select>
            </div>
            <div class="space-y-2">
                <Label for="editStudentType">Student Type</Label>
                <Input id="editStudentType" type="text" bind:value={editUser.student_type} />
            </div>
            <div class="space-y-2">
                <Label for="editRFID">RFID ID</Label>
                <Input id="editRFID" type="text" bind:value={editUser.rfid_id} />
            </div>
            <div class="space-y-2">
                <Label for="editStudentID">Student ID</Label>
                <Input id="editStudentID" type="text" value={editUser.student_id} disabled />
            </div>
            <div class="flex justify-end space-x-2">
                <Button on:click={handleSaveEdit} class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Save</Button>
                <Button on:click={closeEditModal} class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</Button>
            </div>
        </div>
    </Modal>
{/if}

{#if deleteModalOpen}
    <Modal bind:open={deleteModalOpen}>
        <div class="p-6 space-y-4">
            <h3 class="text-xl font-semibold text-gray-900">Delete Users</h3>
            <p>Are you sure you want to delete the selected users?</p>
            <div class="flex justify-end space-x-2">
                <Button on:click={deleteSelected} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Delete</Button>
                <Button on:click={closeDeleteModal} class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</Button>
            </div>
        </div>
    </Modal>
{/if}
