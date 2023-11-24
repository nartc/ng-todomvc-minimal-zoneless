import { ApplicationConfig, NgZone, ɵNoopNgZone } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import Todo from './app.component';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter([{ path: '', component: Todo }], withComponentInputBinding()),
		{ provide: NgZone, useClass: ɵNoopNgZone },
	],
};
