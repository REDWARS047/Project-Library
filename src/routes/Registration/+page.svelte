<script lang="ts">
    import { Section } from 'flowbite-svelte-blocks';
    import { Label, Input, Button, Select } from 'flowbite-svelte';
    import NavBar from '$lib/components/navbar/navBar.svelte';

    let selectedCollege = '';
    let selectedDepartment = '';
    let selectedStudentType = '';

    let colleges = [
        { name: 'CAS', departments: ['COMM', 'MMA'] },
        { name: 'CHS', departments: ['PT', 'PH', 'PSY', 'BIO'] },
        { name: 'ATYCB', departments: ['ENT', 'ACT', 'MA', 'TM', 'REM'] },
        { name: 'CCIS', departments: ['EMC', 'CS', 'IS'] },
        { name: 'CEA', departments: ['AR', 'ChE', 'CE', 'CpE', 'EE', 'Ece', 'IE', 'ME'] }
    ];
    let studentTypes = ['SHS', 'COLLEGE', 'Staff'];
    let shsDepartments = ['STEM', 'HUMMS', 'ABM', 'TVL'];

    const handleSubmit = () => {
        alert('Form submitted.');
    };
    
    const handleRegister = () => {
        alert('Register Student button clicked.');
    };

    const handleReturn = () => {
        alert('Return button clicked.');
    };
</script>

<NavBar/>

<Section name="crudcreateform" class="flex justify-center items-center min-h-screen bg-gray-100">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h2 class="mb-4 text-2xl font-bold text-gray-900">Add New Student</h2>
        <form on:submit|preventDefault={handleSubmit}>
            <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div class="w-full">
                    <Label for="firstName" class="mb-2">First Name</Label>
                    <Input type="text" id="firstName" placeholder="Type first name" required />
                </div>
                <div class="w-full">
                    <Label for="lastName" class="mb-2">Last Name</Label>
                    <Input type="text" id="lastName" placeholder="Type last name" required />
                </div>
                <div class="w-full">
                    <Label for="studentID" class="mb-2">Student ID</Label>
                    <Input type="text" id="studentID" placeholder="Type student ID" required />
                </div>
                <div class="w-full">
                    <Label for="college" class="mb-2">College</Label>
                    <Select id="college" bind:value={selectedCollege} disabled={selectedStudentType === 'SHS' || selectedStudentType === 'Staff'}>
                        <option value="" disabled selected>Select college</option>
                        {#each colleges as college}
                            <option value={college.name}>{college.name}</option>
                        {/each}
                    </Select>
                </div>
                <div class="w-full">
                    <Label for="department" class="mb-2">Department</Label>
                    <Select id="department" bind:value={selectedDepartment} disabled={selectedStudentType === 'Staff'} required>
                        <option value="" disabled selected>Select department</option>
                        {#if selectedStudentType === 'SHS'}
                            {#each shsDepartments as department}
                                <option value={department}>{department}</option>
                            {/each}
                        {:else if selectedCollege}
                            {#each colleges.find(c => c.name === selectedCollege)?.departments as department}
                                <option value={department}>{department}</option>
                            {/each}
                        {/if}
                    </Select>
                </div>
                <div class="w-full">
                    <Label for="studentType" class="mb-2">Student Type</Label>
                    <Select id="studentType" bind:value={selectedStudentType} required>
                        <option value="" disabled selected>Select student type</option>
                        {#each studentTypes as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </Select>
                </div>
                <div class="w-full">
                    <Label for="rfid" class="mb-2">RFID-ID</Label>
                    <Input type="number" id="rfid" placeholder="Type RFID-ID" required />
                </div>
                <div class="sm:col-span-2 flex justify-center mt-4">
                    <Button type="submit" class="w-32">Add Student</Button>
                </div>
            </div>
        </form>
        <div class="flex justify-center mt-4 space-x-4">
            <Button on:click={handleRegister} class="w-48 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Register Student
            </Button>
        </div>
    </div>
</Section>
