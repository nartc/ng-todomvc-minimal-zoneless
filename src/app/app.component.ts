import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	computed,
	inject,
	signal,
	type CreateSignalOptions,
} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

export function injectCDAwareSignal() {
	const cdr = inject(ChangeDetectorRef);

	return <T>(initialValue: T, options?: CreateSignalOptions<T>) => {
		const source = signal(initialValue, options);

		const originalSet = source.set.bind(source);
		const originalUpdate = source.update.bind(source);

		source.set = (...args: Parameters<(typeof source)['set']>) => {
			originalSet(...args);
			cdr.detectChanges();
		};

		source.update = (...args: Parameters<(typeof source)['update']>) => {
			originalUpdate(...args);
			cdr.detectChanges();
		};

		return source;
	};
}

type TodoFilter = 'all' | 'completed' | 'active';

type TodoItem = {
	complete: boolean;
	id: string;
	content: string;
	editing: boolean;
};

@Component({
	standalone: true,
	template: `
		<section class="todoapp">
			<header class="header">
				<h1>todos</h1>
				<input class="new-todo" placeholder="What needs to be done?" autofocus (keyup.enter)="addTodo($event)" />
			</header>
			<section class="main">
				<input id="toggle-all" class="toggle-all" type="checkbox" (change)="toggleAll()" />
				<label for="toggle-all">Mark all as complete</label>
				<ul class="todo-list">
					@for (todo of filteredTodos(); track todo.id) {
						<li [class.completed]="todo.complete" [class.editing]="todo.editing">
							<div class="view">
								<input class="toggle" type="checkbox" [checked]="todo.complete" (change)="toggle(todo.id)" />
								<label (dblclick)="toggleEditMode(todo.id)">{{ todo.content }}</label>
								<button class="destroy" (click)="deleteTodo(todo.id)"></button>
							</div>
							<input class="edit" [value]="todo.content" (keyup.enter)="updateTodo($event, todo.id)" />
						</li>
					}
				</ul>
			</section>
			<footer class="footer">
				<span class="todo-count">
					<strong>{{ activeTodos().length }}</strong>
					{{ activeTodos().length <= 1 ? 'item' : 'items' }} left
				</span>
				<ul class="filters">
					@for (filterType of ['all', 'active', 'completed']; track filterType) {
						<li>
							<a
								[class.selected]="filter() === filterType"
								[routerLink]="[]"
								[queryParams]="filterType === 'all' ? null : { f: filterType }"
							>
								{{ filterType }}
							</a>
						</li>
					}
				</ul>
				<button class="clear-completed" [hidden]="activeTodos().length === todos().length" (click)="clearComplete()">
					Clear completed
				</button>
			</footer>
		</section>
		<footer class="info">
			<p>Double-click to edit a todo</p>
			<p>
				Created by
				<a href="http://github.com/nartc/ng-minimal-todomvc">Chau</a>
			</p>
			<p>
				Part of
				<a href="http://todomvc.com">TodoMVC</a>
			</p>
		</footer>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterLink],
})
export default class Todo {
	private signal = injectCDAwareSignal();

	protected todos = this.signal<TodoItem[]>([]);
	protected filter = this.signal<TodoFilter>('all');
	protected activeTodos = computed(() => this.todos().filter((item) => !item.complete));
	protected filteredTodos = computed(() => {
		switch (this.filter()) {
			case 'all':
				return this.todos();
			case 'completed':
				return this.todos().filter((item) => item.complete);
			case 'active':
				return this.todos().filter((item) => !item.complete);
		}
	});

	addTodo(event: Event) {
		const input = event.target as HTMLInputElement;
		const value = input.value.trim();
		if (!value) return;
		this.todos.update((prev) => [
			...prev,
			{ id: Date.now().toString(), complete: false, editing: false, content: value },
		]);
		input.value = '';
	}

	@Input({ alias: 'f' }) set _filter(q: TodoFilter | undefined) {
		this.filter.set(q || 'all');
	}

	updateTodo(event: Event, id: string) {
		const input = event.target as HTMLInputElement;
		const value = input.value.trim();

		if (!value) return;
		this.todos.update((list) =>
			list.map((item) => {
				if (item.id !== id) return item;
				return { ...item, content: value, editing: false };
			}),
		);
	}

	deleteTodo(id: string) {
		this.todos.update((list) => list.filter((item) => item.id !== id));
	}

	toggle(id: string) {
		this.todos.update((list) =>
			list.map((item) => {
				if (item.id !== id) return item;
				return { ...item, complete: !item.complete };
			}),
		);
	}

	toggleEditMode(id: string) {
		this.todos.update((list) =>
			list.map((item) => {
				if (item.id !== id) return item;
				return { ...item, editing: true };
			}),
		);
	}

	toggleAll() {
		const hasIncomplete = this.todos().some((todo) => !todo.complete);
		this.todos.update((list) => list.map((item) => ({ ...item, complete: hasIncomplete })));
	}

	clearComplete() {
		this.todos.update((list) => list.filter((item) => !item.complete));
	}
}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet],
	template: `
		<router-outlet />
	`,
})
export class AppComponent {}
