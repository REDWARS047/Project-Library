<script lang="ts">
    import { Section } from 'flowbite-svelte-blocks';
    import { Label, Input, Button, Select } from 'flowbite-svelte';
    import NavBar from '$lib/components/navbar/NavBar.svelte';
    import { supabase } from '$lib/supabaseClient';

    let firstName = '';
    let lastName = '';
    let studentID = '';
    let rfid = '';
    let selectedDepartment = '';
    let selectedCourse = '';
    let selectedCategory = '';

    let departments = ['CAS', 'CHS', 'ATYCB', 'CCIS', 'CEA', 'SHS'];
    let courses: Record<string, string[]> = {
        CAS: ['COMM', 'MMA'],
        CHS: ['PT', 'PH', 'PSY', 'BIO'],
        ATYCB: ['ENT', 'ACT', 'MA', 'TM', 'REM'],
        CCIS: ['EMC', 'CS', 'IS'],
        CEA: ['AR', 'ChE', 'CE', 'CpE', 'EE', 'Ece', 'IE', 'ME'],
        SHS: ['STEM', 'HUMMS', 'ABM', 'TVL']
    };
    let categories = ['STUDENT', 'Staff'];

    const getCourseId = async (courseName: string) => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .single();
            if (error) {
                console.error('Error fetching course ID:', error);
                return null;
            }
            return data.id;
        } catch (error) {
            console.error('Unexpected error fetching course ID:', error);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (studentID.length !== 9) {
            alert('Student ID must be exactly 9 digits.');
            return;
        }
        if (rfid.length !== 10) {
            alert('RFID must be exactly 10 digits.');
            return;
        }

        try {
            const courseId = await getCourseId(selectedCourse);
            if (!courseId) {
                alert('Course ID not found. Cannot add student.');
                return;
            }

            const { data, error } = await supabase.from('users').insert([
                {
                    given_name: firstName,
                    last_name: lastName,
                    id: parseInt(studentID),
                    category: selectedCategory,
                    rfid: rfid,
                    course_id: courseId
                }
            ]);

            if (error) {
                console.error('Error adding student:', error);
                alert('Error adding student');
            } else {
                console.log('Student added successfully:', data);
                alert('Student added successfully');
                clearForm();
            }
        } catch (error) {
            console.error('Unexpected error adding student:', error);
            alert('Unexpected error');
        }
    };

    const clearForm = () => {
        firstName = '';
        lastName = '';
        studentID = '';
        rfid = '';
        selectedDepartment = '';
        selectedCourse = '';
        selectedCategory = '';
    };

    const handleStudentIDInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        studentID = target.value.slice(0, 9);
    };

    const handleRFIDInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        rfid = target.value.slice(0, 10);
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
                    <Input type="text" id="firstName" placeholder="Type first name" bind:value={firstName} required />
                </div>
                <div class="w-full">
                    <Label for="lastName" class="mb-2">Last Name</Label>
                    <Input type="text" id="lastName" placeholder="Type last name" bind:value={lastName} required />
                </div>
                <div class="w-full">
                    <Label for="studentID" class="mb-2">Student ID</Label>
                    <Input type="text" id="studentID" placeholder="Type student ID" bind:value={studentID} required on:input={handleStudentIDInput} />
                </div>
                <div class="w-full">
                    <Label for="rfid" class="mb-2">RFID-ID</Label>
                    <Input type="text" id="rfid" placeholder="Type RFID-ID" bind:value={rfid} required on:input={handleRFIDInput} />
                </div>
                <div class="w-full">
                    <Label for="studentType" class="mb-2">Student Type</Label>
                    <Select id="studentType" bind:value={selectedCategory} required>
                        <option value="" disabled selected>Select student type</option>
                        {#each categories as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </Select>
                </div>
                <div class="w-full">
                    <Label for="department" class="mb-2">Department</Label>
                    <Select id="department" bind:value={selectedDepartment} disabled={selectedCategory === 'Staff'}>
                        <option value="" disabled selected>Select department</option>
                        {#each departments as department}
                            <option value={department}>{department}</option>
                        {/each}
                    </Select>
                </div>
                <div class="w-full">
                    <Label for="course" class="mb-2">Course</Label>
                    <Select id="course" bind:value={selectedCourse} disabled={selectedCategory === 'Staff' || !selectedDepartment}>
                        <option value="" disabled selected>Select course</option>
                        {#if selectedDepartment}
                            {#each courses[selectedDepartment] as course}
                                <option value={course}>{course}</option>
                            {/each}
                        {/if}
                    </Select>
                </div>
                <div class="sm:col-span-2 flex justify-center mt-4">
                    <Button type="submit" class="w-32 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Add Student
                    </Button>                    
                </div>
            </div>
        </form>
    </div>
</Section>
