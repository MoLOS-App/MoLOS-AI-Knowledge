<script lang="ts">
	import { tasksStore, taskStats, addTaskStore, updateTaskStore, deleteTaskStore } from '$lib/stores/external_modules/MoLOS-AI-Knowledge';
	import type { Task } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import TaskItem from '$lib/components/external_modules/MoLOS-AI-Knowledge/task-item.svelte';

	const priorities = ['high', 'medium', 'low'] as const;

	// Local form state; this is the only UI in the boilerplate.
	let editingTaskId: string | null = $state(null);
	let formTitle = $state('');
	let formDescription = $state('');
	let formPriority = $state<'high' | 'medium' | 'low'>('medium');
	let formDueDateStr = $state('');

	const resetForm = () => {
		formTitle = '';
		formDescription = '';
		formPriority = 'medium';
		formDueDateStr = '';
		editingTaskId = null;
	};

	function startEdit(task: Task) {
		editingTaskId = task.id;
		formTitle = task.title;
		formDescription = task.description ?? '';
		formPriority = task.priority;
		formDueDateStr = task.dueDate
			? new Date(task.dueDate * 1000).toISOString().split('T')[0]
			: '';
	}

	async function handleSave() {
		if (!formTitle.trim()) return;
		const dueDate = formDueDateStr
			? Math.floor(new Date(formDueDateStr).getTime() / 1000)
			: undefined;

		const payload = {
			title: formTitle.trim(),
			description: formDescription.trim() || undefined,
			priority: formPriority,
			dueDate
		};

		// Create vs update based on editing state.
		if (editingTaskId) {
			await updateTaskStore(editingTaskId, payload);
		} else {
			await addTaskStore(payload);
		}

		resetForm();
	}

	async function handleToggle(task: Task) {
		await updateTaskStore(task.id, {
			status: task.isCompleted ? 'to_do' : 'done'
		});
	}

	async function handleDelete(taskId: string) {
		await deleteTaskStore(taskId);
		if (editingTaskId === taskId) {
			resetForm();
		}
	}
</script>

<div class="space-y-6">
	<header class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">Sample Tasks</h1>
		<p class="text-sm text-muted-foreground">
			A minimal tasks module: create, update, and delete.
		</p>
	</header>

	<div class="grid gap-4 md:grid-cols-3">
		<div class="p-4 border rounded-lg bg-card">
			<div class="text-xs font-semibold uppercase text-muted-foreground">Total</div>
			<div class="mt-2 text-2xl font-bold">{$taskStats.total}</div>
		</div>
		<div class="p-4 border rounded-lg bg-card">
			<div class="text-xs font-semibold uppercase text-muted-foreground">Active</div>
			<div class="mt-2 text-2xl font-bold">{$taskStats.active}</div>
		</div>
		<div class="p-4 border rounded-lg bg-card">
			<div class="text-xs font-semibold uppercase text-muted-foreground">Completed</div>
			<div class="mt-2 text-2xl font-bold">{$taskStats.completed}</div>
		</div>
	</div>

	<section class="p-4 border rounded-xl bg-card">
		<h2 class="text-lg font-semibold">{editingTaskId ? 'Edit Task' : 'Create Task'}</h2>
		<div class="grid gap-4 mt-4 md:grid-cols-2">
			<div class="space-y-2">
				<label class="text-xs font-semibold uppercase text-muted-foreground" for="title">Title</label>
				<input
					id="title"
					class="w-full h-10 px-3 border rounded-md bg-background"
					bind:value={formTitle}
					placeholder="What needs to be done?"
				/>
			</div>
			<div class="space-y-2">
				<label class="text-xs font-semibold uppercase text-muted-foreground" for="priority">Priority</label>
				<select
					id="priority"
					class="w-full h-10 px-3 border rounded-md bg-background"
					bind:value={formPriority}
				>
					{#each priorities as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2 md:col-span-2">
				<label class="text-xs font-semibold uppercase text-muted-foreground" for="description">Description</label>
				<textarea
					id="description"
					class="min-h-[80px] w-full rounded-md border bg-background p-3"
					bind:value={formDescription}
					placeholder="Optional details"
				></textarea>
			</div>
			<div class="space-y-2">
				<label class="text-xs font-semibold uppercase text-muted-foreground" for="dueDate">Due Date</label>
				<input
					id="dueDate"
					type="date"
					class="w-full h-10 px-3 border rounded-md bg-background"
					bind:value={formDueDateStr}
				/>
			</div>
			<div class="flex items-end gap-3">
				<button
					class="h-10 px-4 text-sm font-semibold rounded-md bg-primary text-primary-foreground"
					onclick={handleSave}
				>
					{editingTaskId ? 'Save Changes' : 'Add Task'}
				</button>
				{#if editingTaskId}
					<button
						class="h-10 px-4 text-sm font-semibold border rounded-md"
						onclick={resetForm}
					>
						Cancel
					</button>
				{/if}
			</div>
		</div>
	</section>

	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Your Tasks</h2>
		{#if $tasksStore.length === 0}
			<div class="p-8 text-sm text-center border border-dashed rounded-lg text-muted-foreground">
				No tasks yet. Create your first task above.
			</div>
		{:else}
			<div class="grid gap-3">
				{#each $tasksStore as task (task.id)}
					<TaskItem
						{task}
						on:toggle={() => handleToggle(task)}
						on:requestEdit={(e) => startEdit(e.detail)}
						on:delete={() => handleDelete(task.id)}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>
