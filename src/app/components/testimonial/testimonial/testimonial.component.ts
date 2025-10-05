import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Testimonial} from '../../../interfaces/social-post.model';
@Component({
  selector: 'app-testimonial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial.component.html',
  styleUrls: ['./testimonial.component.scss']
})
export class TestimonialComponent {
  // All testimonials
  testimonials: Testimonial[] = [
    {
      name: 'Vijay Gheji',
      position: 'Project Manager at TCS',
      text: 'Amol is an exceptional developer with an unwavering commitment to delivering high-quality work. His ability to pay attention to the smallest details and his impressive problem-solving skills make him stand out in every project he takes on. I’ve had the pleasure of working with him and can confidently say that he is a highly skilled and reliable asset to any team.',
      image: '../../../../assets/images/profile-user.png'
    },
    {
      name: 'Preeti Shah',
      position: 'UI/UX Designer at McKesson',
      text: 'Working with Amol has been a pleasure. He understands design requirements perfectly and implements them with precision. His attention to detail and creativity bring projects to life in a way that exceeds expectations. Amol\'s professionalism and collaborative approach make him an asset to any team.',
      image: '../../../../assets/images/profile-user.png'
    },
    {
      name: 'Apurv Kulkarni',
      position: 'Python developer at TCS',
      text: 'Amol\'s expertise in Angular and Spring Boot has been invaluable to our team. His problem-solving skills, collaborative attitude, and eagerness to share knowledge make him a great teammate and a dependable developer.',
      image: '../../../../assets/images/profile-user.png'
    },
    {
      name: 'Prathamesh Malwade',
      position: 'System Engineer at TCS',
      text: 'Working with Amol has been an absolute pleasure. He consistently brings innovative ideas to the table and ensures timely delivery without compromising on quality. Amol delivered our project ahead of schedule with excellent quality. His dedication and attention to detail truly stand out. Highly recommended!',
      image: '../../../../assets/images/profile-user.png'
    },
    {
      name: 'Jitendra Namade',
      position: 'Android Developer at TCS',
      text: 'Working with Amol has been a pleasure. The code he produced was not only clean and efficient but also well-documented, making it easy for the team to understand and build upon. His professionalism and attention to detail truly stand out.',
      image: '../../../../assets/images/profile-user.png'
    },
    {
      name: 'Senthil Kumar',
      position: 'Product Manager at Aptiv PLC',
      text: 'Amol was able to quickly understand our complex requirements and implement them flawlessly. His ability to grasp the technical and business needs of our project and deliver on them efficiently has been invaluable. Highly recommend his expertise!',
      image: '../../../../assets/images/profile-user.png'
    }
  ];

  // Number of testimonials to show initially
  initialVisibleCount = 3;
  
  // Flag to track if we're showing all testimonials
  showAll = false;
  
  // Computed property to get currently visible testimonials
  get visibleTestimonials(): Testimonial[] {
    return this.showAll 
      ? this.testimonials 
      : this.testimonials.slice(0, this.initialVisibleCount);
  }

  // Toggle between showing all and showing only initial count
  toggleViewMore(): void {
    this.showAll = !this.showAll;
  }
}