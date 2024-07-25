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
		Dropdown,
		DropdownItem,
		Checkbox,
		ButtonGroup
	} from 'flowbite-svelte';
	import { Section } from 'flowbite-svelte-blocks';
	import type { User } from '$lib/usertypes';
	import { fetchUsers } from '$lib/service/supabaseService';
	import {
		PlusOutline,
		ChevronDownOutline,
		FilterSolid,
		ChevronRightOutline,
		ChevronLeftOutline
	} from 'flowbite-svelte-icons';
	import NavBar from '$lib/components/navbar/navBar.svelte';

	let divClass = 'bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden';
	let innerDivClass =
		'flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4';
	let searchClass = 'w-full md:w-1/2 relative';
	let svgDivClass = 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none';
	let classInput =
		'text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2  pl-10';

	export let users: User[] = [];

	let searchTerm = '';
	let currentPosition = 0;
	const itemsPerPage = 10;
	const showPage = 5;
	let totalPages = 0;
	let pagesToShow: number[] = [];
	let totalItems = 0;
	let startPage: number[] = [];
	let endPage: number[] = [];
	let paginationData: User[] = [];
	let selectedDepartments: string[] = [];
	let selectedItems = new Set();

	async function fetchData() {
		try {
			users = await fetchUsers();
		} catch (error) {
			console.error('Error refreshing data:', error);
		}
	}

	const updateDataAndPagination = () => {
		const currentPageItems = paginationData.slice(currentPosition, currentPosition + itemsPerPage);
		renderPagination(currentPageItems.length);
	};

	const loadNextPage = () => {
		if (currentPosition + itemsPerPage < paginationData.length) {
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

	const renderPagination = (totalItems) => {
		totalPages = Math.ceil(paginationData.length / itemsPerPage);
		const currentPage = Math.ceil((currentPosition + 1) / itemsPerPage);

		startPage = currentPage - Math.floor(showPage / 2);
		startPage = Math.max(1, startPage);
		endPage = Math.min(startPage + showPage - 1, totalPages);

		pagesToShow = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
	};

	const goToPage = (pageNumber) => {
		currentPosition = (pageNumber - 1) * itemsPerPage;
		updateDataAndPagination();
	};

	const toggleDepartmentFilter = (department) => {
		if (selectedDepartments.includes(department)) {
			selectedDepartments = selectedDepartments.filter((dept) => dept !== department);
		} else {
			selectedDepartments.push(department);
		}
	};

	// const deleteAllItems = async () => {
	// 	// Example: Deleting all rows from Supabase
	// 	const { error } = await supabase.from('students').delete().neq('id', '');
	// 	if (error) {
	// 		console.error('Error deleting all items:', error);
	// 	}
	// 	paginationData = [];
	// 	updateDataAndPagination();
	// };

	const massEditItems = () => {
		// Implement your mass edit logic here
		alert('Mass Edit functionality is not implemented yet.');
	};

	const toggleItemSelection = (itemId) => {
		if (selectedItems.has(itemId)) {
			selectedItems.delete(itemId);
		} else {
			selectedItems.add(itemId);
		}
	};

	$: startRange = currentPosition + 1;
	$: endRange = Math.min(currentPosition + itemsPerPage, totalItems);

	onMount(async () => {
		paginationData = await fetchData();
		totalItems = paginationData.length;
		renderPagination(paginationData.length);
	});

	$: filteredItems = paginationData.filter((item) => {
		const matchesSearch = item.first_name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesDepartment =
			selectedDepartments.length === 0 || selectedDepartments.includes(item.department);
		return matchesSearch && matchesDepartment;
	});

	$: currentPageItems = filteredItems.slice(currentPosition, currentPosition + itemsPerPage);
</script>

<NavBar />

<Section name="advancedTable" classSection="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
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
			<Button>
				<PlusOutline class="h-3.5 w-3.5 mr-2" />Add student
			</Button>
			<Button color="alternative">Actions<ChevronDownOutline class="w-3 h-3 ml-2 " /></Button>
			<Dropdown class="w-44 divide-y divide-gray-100">
				<DropdownItem on:click={massEditItems}>Mass Edit</DropdownItem>
				<!-- <DropdownItem on:click={deleteAllItems}>Delete all</DropdownItem> -->
			</Dropdown>
			<Button color="alternative">Filter<FilterSolid class="w-3 h-3 ml-2 " /></Button>
			<Dropdown class="w-48 p-3 space-y-2 text-sm">
				<h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Choose Department</h6>
				<li>
					<Checkbox on:change={() => toggleDepartmentFilter('CCIS')}>CCIS</Checkbox>
				</li>
				<li>
					<Checkbox on:change={() => toggleDepartmentFilter('CEA')}>CEA</Checkbox>
				</li>
				<li>
					<Checkbox on:change={() => toggleDepartmentFilter('CHS')}>CHS</Checkbox>
				</li>
				<li>
					<Checkbox on:change={() => toggleDepartmentFilter('CAS')}>CAS</Checkbox>
				</li>
				<li>
					<Checkbox on:change={() => toggleDepartmentFilter('ATYCB')}>ATYCB</Checkbox>
				</li>
			</Dropdown>
		</div>
		<TableHead>
			<TableHeadCell padding="px-4 py-3" scope="col">FirstName</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">LastName</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">StudentID</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">Department</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">RFID-ID</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">Time-IN</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">Time-Out</TableHeadCell>
			<TableHeadCell padding="px-4 py-3" scope="col">Date</TableHeadCell>
		</TableHead>
		<TableBody class="divide-y">
			{#if searchTerm !== ''}
				{#each filteredItems as item (item.id)}
					<TableBodyRow>
						<TableBodyCell tdClass="px-4 py-3">{item.first_name}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.last_name}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.student_id}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.department}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.rfid_id}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.time_in}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.time_out}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.date}</TableBodyCell>
					</TableBodyRow>
				{/each}
			{:else}
				{#each currentPageItems as item (item.id)}
					<TableBodyRow>
						<TableBodyCell tdClass="px-4 py-3">{item.first_name}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.last_name}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.student_id}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.department}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.rfid_id}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.time_in}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.time_out}</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-3">{item.date}</TableBodyCell>
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
				<Button on:click={loadNextPage} disabled={totalPages === endPage}
					><ChevronRightOutline size="xs" class="m-1.5" /></Button
				>
			</ButtonGroup>
		</div>
	</TableSearch>
</Section>
