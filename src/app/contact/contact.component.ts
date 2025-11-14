import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { ThemeService, ThemeConfig } from '../services/theme.service';
import emailjs from 'emailjs-com';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  @ViewChild('contactFormRef') contactFormRef!: NgForm;
  
  isSubmitting = false;
  isSuccess = false;
  isError = false;
  personalInfo: any = {};
  isEditMode = false;
  currentTheme!: ThemeConfig;
  isDarkTheme = false;

  // Form model - separate from template reference
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  constructor(
    private adminService: AdminService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.personalInfo = data.personalInfo || {};
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });

    // Subscribe to theme changes
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });

    // Initialize EmailJS with your credentials
    emailjs.init("SfSLIRa0rw3zFWVjx"); // Replace with your EmailJS public key
  }

  async onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.isSuccess = false;
    this.isError = false;

    try {
      const templateParams = {
        from_name: this.formData.name,
        from_email: this.formData.email,
        subject: this.formData.subject,
        message: this.formData.message,
        reply_to: this.formData.email,
        to_name: 'Amol Portfolio',
        submission_date: new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      };

      // Send email using EmailJS
      const response = await emailjs.send(
        'service_qwexfpu', // Replace with your EmailJS service ID
        'template_doanzcj', // Replace with your EmailJS template ID
        templateParams
      );

      if (response.status === 200) {
        this.isSuccess = true;
        this.resetForm();
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      this.isError = true;
      
      // Fallback: Show manual email option
      setTimeout(() => {
        const fallbackEmail = `mailto:amolnagare279@gmail.com?subject=${encodeURIComponent(this.formData.subject)}&body=${encodeURIComponent(`Name: ${this.formData.name}\nEmail: ${this.formData.email}\n\nMessage: ${this.formData.message}`)}`;
        window.location.href = fallbackEmail;
      }, 3000);
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm() {
    this.formData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
    
    // Reset the form validation state
    if (this.contactFormRef) {
      this.contactFormRef.resetForm();
    }
  }

  updatePersonalInfo() {
    if (this.isEditMode) {
      this.adminService.updatePersonalInfo(this.personalInfo);
    }
  }
}