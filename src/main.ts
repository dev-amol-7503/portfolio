import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app/app.routes'; // Your standalone routes file

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    importProvidersFrom(HttpClientModule),
    provideRouter(routes, withHashLocation()) // Use hash routing
  ]
}).catch(err => console.error(err));
