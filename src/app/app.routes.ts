import { CanDeactivateFn, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TranslatorComponent } from './translator/translator.component';
import { HarmonyComponent } from './harmony/harmony.component';

const canLeaveTranslator: CanDeactivateFn<TranslatorComponent> = (component) => component.canDeactivate();

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'translator', component: TranslatorComponent, canDeactivate: [canLeaveTranslator] },
  { path: 'harmony', component: HarmonyComponent },
  { path: '**', redirectTo: 'login' },
];
