import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  username = '';
  password = '';
  isLoggingIn = false;
  showPassword = false;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.toastr.error('Please enter both username and password');
      return;
    }

    this.isLoggingIn = true;
    
    // Use setTimeout to simulate API call
    setTimeout(() => {
      const success = this.adminService.login(this.username, this.password);
      
      if (success) {
        this.toastr.success('Login successful!');
        // Redirect to admin dashboard instead of home
        this.router.navigate(['/admin']);
      } else {
        this.toastr.error('Invalid credentials');
      }
      
      this.isLoggingIn = false;
    }, 1000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}