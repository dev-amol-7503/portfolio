import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { map, take } from 'rxjs/operators';

export const adminGuard = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);
  
  return adminService.isAdmin$.pipe(
    take(1),
    map(isAdmin => {
      if (isAdmin) {
        return true;
      }
      
      router.navigate(['/admin/login']);
      return false;
    })
  );
};