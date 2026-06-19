import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

type Me = {
  app: string;
  username: string;
  email: string | null;
  issuer: string;
};

type Todo = {
  id: string;
  title: string;
  done: boolean;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);
  readonly appLabel = 'App 1';
  readonly me = signal<Me | null>(null);
  readonly todos = signal<Todo[]>([]);
  readonly draft = signal('');
  readonly error = signal('');

  constructor() {
    this.http.get<Me>('/api/me').subscribe({
      next: (me) => this.me.set(me),
      error: () => this.error.set('Could not load user profile')
    });
    this.load();
  }

  inputValue(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  load() {
    this.http.get<Todo[]>('/api/todos').subscribe({
      next: (todos) => this.todos.set(todos),
      error: () => this.error.set('Could not load todos')
    });
  }

  add(event: Event) {
    event.preventDefault();
    const title = this.draft().trim();
    if (!title) return;

    this.http.post<Todo>('/api/todos', { title }).subscribe({
      next: (todo) => {
        this.todos.update((todos) => [...todos, todo]);
        this.draft.set('');
        this.error.set('');
      },
      error: () => this.error.set('Could not add todo')
    });
  }

  toggle(todo: Todo) {
    this.http.patch<Todo>(`/api/todos/${todo.id}`, { done: !todo.done }).subscribe({
      next: (updated) => {
        this.todos.update((todos) => todos.map((item) => (item.id === updated.id ? updated : item)));
        this.error.set('');
      },
      error: () => this.error.set('Could not update todo')
    });
  }

  remove(todo: Todo) {
    this.http.delete(`/api/todos/${todo.id}`).subscribe({
      next: () => {
        this.todos.update((todos) => todos.filter((item) => item.id !== todo.id));
        this.error.set('');
      },
      error: () => this.error.set('Could not delete todo')
    });
  }
}
