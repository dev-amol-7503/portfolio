import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatrixNotesService } from '../../../services/matrix-notes.service';
import { Tutorial, RoadmapStep } from '../../../interfaces/tutorial.model';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-tutorials-list',
  templateUrl: './tutorials-list.component.html',
  styleUrls: ['./tutorials-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class TutorialsListComponent implements OnInit, OnDestroy {
  // Tutorial list properties
  tutorials: Tutorial[] = [];
  filteredTutorials: Tutorial[] = [];
  publishedTutorials: Tutorial[] = []; // Add this property
  draftTutorials: Tutorial[] = []; // Add this property
  searchQuery: string = '';
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';
  selectedRoadmapStep: number = 0;
  sortBy: string = 'newest';
  isLoading: boolean = true;

  // Roadmap properties
  backendSteps: RoadmapStep[] = [];
  frontendSteps: RoadmapStep[] = [];
  currentStepIndex: number = 0;
  private animationInterval: any;
  isAnimationPaused: boolean = false;

  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title', label: 'Title A-Z' },
  ];

  categories: string[] = [
    'java',
    'spring',
    'angular',
    'typescript',
    'database',
    'devops',
    'frontend',
  ];
  difficulties: string[] = ['beginner', 'intermediate', 'advanced'];

  ngAfterViewInit() {
    // Reduce change detection cycles that cause multiple hasTutorial calls
    setTimeout(() => {
      console.log('✅ Component fully initialized');
    }, 1000);
  }

  // Alternative: Use ChangeDetectorRef
  constructor(
    private matrixNotesService: MatrixNotesService,
    private router: Router,
    private route: ActivatedRoute,
    public adminService: AdminService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef // Add this
  ) {}

  ngOnInit() {
    this.loadTutorials();
    this.initializeRoadmap();
    this.startRoadmapAnimation();
    // App mein kahin bhi call karo
   // this.matrixNotesService.debugRoadmapStepMappings();
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  private startRoadmapAnimation() {
    this.animationInterval = setInterval(() => {
      if (!this.isAnimationPaused) {
        this.moveToNextStep();
      }
    }, 5000);
  }

  private moveToNextStep() {
    // Reset all steps
    this.backendSteps.forEach((step) => (step.isActive = false));
    this.frontendSteps.forEach((step) => (step.isActive = false));

    // Calculate total steps and find next
    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    this.currentStepIndex = (this.currentStepIndex + 1) % allSteps.length;
    allSteps[this.currentStepIndex].isActive = true;

    // Auto-filter tutorials when step changes automatically
    if (this.selectedRoadmapStep === 0) {
      this.filterTutorialsByStep(allSteps[this.currentStepIndex]);
    }
  }

  selectStep(step: RoadmapStep) {
    this.isAnimationPaused = true;

    // Reset all steps
    this.backendSteps.forEach((s) => (s.isActive = false));
    this.frontendSteps.forEach((s) => (s.isActive = false));
    step.isActive = true;

    // Find current index
    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    this.currentStepIndex = allSteps.findIndex((s) => s.id === step.id);

    // Set selected roadmap step for filtering
    this.selectedRoadmapStep = step.id;

    // Filter tutorials for selected step
    this.filterTutorialsByStep(step);

    setTimeout(() => {
      this.isAnimationPaused = false;
    }, 15000);
  }

  // FIXED: Remove the second parameter from method calls
  async checkTutorialAvailabilityAndNavigate(step: RoadmapStep) {
    try {
      // FIX: Only pass step.id
      const hasTutorial = await this.matrixNotesService.hasTutorialForStep(
        step.id
      );

      if (hasTutorial) {
        // FIX: Only pass step.id
        const tutorial = await this.matrixNotesService.getTutorialByRoadmapStep(
          step.id
        );

        if (tutorial) {
          this.navigateToTutorial(tutorial.id, step.id);
        }
      } else {
        this.handleNoTutorialAvailable(step);
      }
    } catch (error) {
      console.error('Error checking tutorial availability:', error);
      this.toastr.error('Error checking tutorial availability');
    }
  }

  // In tutorials-list.component.ts - REPLACE the onRoadmapStepClick method:

  // FIXED: Enhanced roadmap step click handler
  async onRoadmapStepClick(step: RoadmapStep) {
    console.log(`🔄 Clicked on roadmap step: ${step.title} (ID: ${step.id})`);

    // Only proceed if step has tutorials
    if (!this.hasTutorial(step)) {
      this.toastr.warning(`No tutorial available for "${step.title}"`);
      return;
    }

    this.isAnimationPaused = true;

    // Reset all steps and activate current step
    this.backendSteps.forEach((s) => (s.isActive = false));
    this.frontendSteps.forEach((s) => (s.isActive = false));
    step.isActive = true;

    try {
      // Get tutorials for this step - FIXED: Use the service method
      const tutorials = await this.matrixNotesService.getTutorialsByRoadmapStep(
        step.id
      );

      console.log(`📚 Found ${tutorials.length} tutorials for step ${step.id}`);

      if (tutorials && tutorials.length > 0) {
        // Navigate to the first tutorial for this step
        const firstTutorial = tutorials[0];
        console.log(
          `🚀 Navigating to tutorial: ${firstTutorial.title} (ID: ${firstTutorial.id})`
        );

        this.router.navigate(['/tutorials', firstTutorial.id], {
          queryParams: { roadmapStep: step.id },
        });
      } else {
        console.warn(`❌ No tutorials found for step: ${step.id}`);
        this.toastr.warning(`No tutorial available for "${step.title}"`);
      }
    } catch (error) {
      console.error('❌ Error fetching tutorials for step:', error);
      this.toastr.error('Error loading tutorial');
    }

    // Resume animation after delay
    setTimeout(() => {
      this.isAnimationPaused = false;
    }, 3000);
  }

  // ADD this method to debug tutorial data
  private debugTutorialData() {
    console.log('🔍 DEBUG TUTORIAL DATA:');
    this.tutorials.forEach((tutorial) => {
      console.log(`Tutorial: ${tutorial.title}`, {
        id: tutorial.id,
        roadmapStep: tutorial.roadmapStep,
        published: tutorial.published,
        category: tutorial.category,
      });
    });
  }

  // Add this method to debug current state
  debugCurrentState() {
    console.log('🔍 DEBUG CURRENT STATE:');

    // Check all tutorials
    console.log(
      '📋 ALL TUTORIALS:',
      this.tutorials.map((t) => ({
        id: t.id,
        title: t.title,
        roadmapStep: t.roadmapStep,
        published: t.published,
        category: t.category,
      }))
    );

    // Check roadmap steps
    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    allSteps.forEach((step) => {
      const hasTut = this.hasTutorial(step);
      console.log(`Step ${step.id} (${step.title}): hasTutorial = ${hasTut}`);
    });
  }

  // tutorials-list.component.ts - ADD TEST METHOD

  // Temporary method to create a test tutorial
  async createTestTutorial() {
    try {
      const testTutorial: Partial<Tutorial> = {
        title: 'Java Fundamentals Tutorial - Test',
        description: 'This is a test tutorial for Java Fundamentals',
        content: [
          {
            id: '1',
            type: 'text',
            content: '# Java Fundamentals\n\nThis is a test tutorial content.',
            order: 0,
          },
        ],
        category: 'java',
        difficulty: 'beginner',
        tags: ['java', 'fundamentals', 'test'],
        roadmapStep: 1, // Java Fundamentals step ID
        published: true,
        technologies: ['Java 17', 'OOP'],
        prerequisites: ['Basic programming knowledge'],
        learningObjectives: ['Learn Java basics', 'Understand OOP concepts'],
      };

      const tutorialId = await this.matrixNotesService.createTutorial(
        testTutorial
      );
      await this.matrixNotesService.publishTutorial(tutorialId);

      console.log('✅ Test tutorial created with ID:', tutorialId);
      this.toastr.success('Test tutorial created!');

      // Reload tutorials
      await this.loadTutorials();
    } catch (error) {
      console.error('❌ Error creating test tutorial:', error);
      this.toastr.error('Failed to create test tutorial');
    }
  }

  // FIXED: Enhanced tutorial mapping
  private async enhancedMapTutorialsToRoadmap() {
    const allSteps = [...this.backendSteps, ...this.frontendSteps];

    allSteps.forEach((step) => {
      // Clear existing tutorials
      step.tutorials = [];

      // Find tutorials specifically assigned to this step
      const assignedTutorials = this.tutorials.filter(
        (tutorial) => tutorial.roadmapStep === step.id && tutorial.published
      );

      step.tutorials = assignedTutorials;

      // Log for debugging
      if (assignedTutorials.length > 0) {
        console.log(
          `📚 Step ${step.id} (${step.title}) has ${assignedTutorials.length} tutorials:`,
          assignedTutorials.map((t) => t.title)
        );
      }
    });

    console.log('✅ Enhanced tutorial mapping completed');
  }

  // FIXED: Remove the old openRoadmapStepDetails method and replace with simpler one
  async openRoadmapStepDetails(step: RoadmapStep) {
    // This is now just an alias for the click handler
    await this.onRoadmapStepClick(step);
  }

  // Handle when no tutorial is available
  private handleNoTutorialAvailable(step: RoadmapStep) {
    // Show message to user
    this.toastr.warning(`No tutorial available for "${step.title}"`);

    // Optional: Add visual feedback by adding a disabled class
    const stepElement = document.querySelector(`[data-step-id="${step.id}"]`);
    if (stepElement) {
      stepElement.classList.add('step-disabled');

      // Remove the class after animation
      setTimeout(() => {
        stepElement.classList.remove('step-disabled');
      }, 2000);
    }
  }

  // NEW: Method to navigate to a specific tutorial from roadmap step
  navigateToTutorialFromStep(tutorialId: string, step: RoadmapStep) {
    this.isAnimationPaused = true;

    // Reset all steps
    this.backendSteps.forEach((s) => (s.isActive = false));
    this.frontendSteps.forEach((s) => (s.isActive = false));
    step.isActive = true;

    // Navigate to the tutorial with roadmap context
    this.navigateToTutorial(tutorialId, step.id);

    setTimeout(() => {
      this.isAnimationPaused = false;
    }, 15000);
  }

  // Add this method to your TutorialsListComponent class
  navigateToFirstTutorialOrList(step: RoadmapStep) {
    this.isAnimationPaused = true;

    // Reset all steps and activate current step
    this.backendSteps.forEach((s) => (s.isActive = false));
    this.frontendSteps.forEach((s) => (s.isActive = false));
    step.isActive = true;

    // Find current index
    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    this.currentStepIndex = allSteps.findIndex((s) => s.id === step.id);

    // Check if step has tutorials
    if (step.tutorials && step.tutorials.length > 0) {
      // Navigate to the first tutorial in this step
      const firstTutorial = step.tutorials[0];
      this.router.navigate(['/tutorials', firstTutorial.id], {
        queryParams: { roadmapStep: step.id },
      });
    } else {
      // If no tutorials, navigate to tutorials list filtered by this step
      this.router.navigate(['/tutorials'], {
        queryParams: {
          roadmapStep: step.id,
          category: step.category,
        },
      });
    }

    // Resume animation after delay
    setTimeout(() => {
      this.isAnimationPaused = false;
    }, 15000);
  }

  private filterTutorialsByStep(step: RoadmapStep) {
    if (step.tutorials.length > 0) {
      this.filteredTutorials = step.tutorials;
    } else {
      this.filteredTutorials = this.tutorials.filter((tutorial) => {
        const matchesCategory = tutorial.category === step.category;
        const matchesTechnologies = step.technologies.some(
          (tech: string) =>
            tutorial.title.toLowerCase().includes(tech.toLowerCase()) ||
            tutorial.description.toLowerCase().includes(tech.toLowerCase()) ||
            tutorial.tags.some((tag) =>
              tag.toLowerCase().includes(tech.toLowerCase())
            )
        );
        return matchesCategory || matchesTechnologies;
      });
    }
  }

  resetRoadmapFilter() {
    this.selectedRoadmapStep = 0;
    this.filteredTutorials = [...this.tutorials];
    this.sortTutorials();
    this.isAnimationPaused = false;
  }

  // Handle roadmap step filter change
  onRoadmapStepFilterChange() {
    this.filterTutorials();
  }

  // Filter tutorials by roadmap step
  filterTutorialsByRoadmapStep(stepId: number) {
    this.filteredTutorials = this.tutorials.filter(
      (tutorial) => tutorial.roadmapStep === stepId
    );
  }

  // Get total tutorials count across all steps
  getTotalTutorialsCount(): number {
    return this.tutorials.length;
  }

  // Scroll to roadmap section
  scrollToRoadmap() {
    const roadmapSection = document.querySelector('.roadmap-pipeline-section');
    if (roadmapSection) {
      roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Get roadmap step order by ID
  getRoadmapStepOrder(stepId: number | undefined): number {
    if (!stepId) return 0;

    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    const step = allSteps.find((s) => s.id === stepId);
    return step ? step.order : 0;
  }

  // Add these methods to fix Math issues in template
  getPublishedProgressWidth(): number {
    return (
      (this.publishedTutorials.length / Math.max(this.tutorials.length, 1)) *
      100
    );
  }

  getTotalProgressWidth(): number {
    return (this.tutorials.length / Math.max(this.tutorials.length, 1)) * 100;
  }

  // Get roadmap step for a tutorial
  getTutorialRoadmapStep(tutorial: Tutorial): RoadmapStep | null {
    if (!tutorial.roadmapStep) return null;

    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    return allSteps.find((step) => step.id === tutorial.roadmapStep) || null;
  }

  // Enhanced tutorial mapping with roadmap context
  private mapTutorialsToRoadmap() {
    const allSteps = [...this.backendSteps, ...this.frontendSteps];

    allSteps.forEach((step) => {
      // Clear existing tutorials
      step.tutorials = [];

      // Find tutorials specifically assigned to this step
      const assignedTutorials = this.tutorials.filter(
        (tutorial) => tutorial.roadmapStep === step.id
      );

      // Find tutorials that match step technologies/category
      const matchingTutorials = this.tutorials.filter((tutorial) => {
        if (tutorial.roadmapStep) return false; // Skip already assigned

        const matchesCategory = tutorial.category === step.category;
        const matchesTechnologies = step.technologies.some((tech) =>
          // tutorial.technologies?.includes(tech) ||
          tutorial.tags.some((tag) =>
            tag.toLowerCase().includes(tech.toLowerCase())
          )
        );

        return matchesCategory || matchesTechnologies;
      });

      step.tutorials = [...assignedTutorials, ...matchingTutorials.slice(0, 3)];
    });
  }

  // Get roadmap progress for a step including tutorials
  getStepProgressWithTutorials(step: RoadmapStep): number {
    const tutorialCount = step.tutorials.length;
    const totalExpected = step.totalTopics || 5; // Default expectation
    return Math.min(100, Math.round((tutorialCount / totalExpected) * 100));
  }

  get filteredCategories(): string[] {
    return this.categories;
  }

  get filteredDifficulties(): string[] {
    return this.difficulties;
  }

  onSearchChange() {
    this.filterTutorials();
  }

  onCategoryChange() {
    this.filterTutorials();
  }

  onDifficultyChange() {
    this.filterTutorials();
  }

  onSortChange() {
    this.sortTutorials();
  }

  filterTutorials() {
    let filtered = this.tutorials;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tutorial) =>
          tutorial.title.toLowerCase().includes(query) ||
          tutorial.description.toLowerCase().includes(query) ||
          tutorial.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(
        (tutorial) => tutorial.category === this.selectedCategory
      );
    }

    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(
        (tutorial) => tutorial.difficulty === this.selectedDifficulty
      );
    }

    if (this.selectedRoadmapStep > 0) {
      const allSteps = [...this.backendSteps, ...this.frontendSteps];
      const step = allSteps.find((s) => s.id === this.selectedRoadmapStep);
      if (step) {
        filtered = filtered.filter((tutorial) =>
          step.tutorials.includes(tutorial)
        );
      }
    }

    this.filteredTutorials = filtered;
    this.sortTutorials();
  }

  private sortTutorials() {
    switch (this.sortBy) {
      case 'newest':
        this.filteredTutorials.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        this.filteredTutorials.sort((a, b) => b.views - a.views);
        break;
      case 'title':
        this.filteredTutorials.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
  }

  // Add this method to fix Math issue in template
  getProgressWidth(count: number): number {
    return (count / Math.max(this.tutorials.length, 1)) * 100;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      java: 'fas fa-coffee',
      spring: 'fas fa-leaf',
      angular: 'fab fa-angular',
      typescript: 'fab fa-js-square',
      database: 'fas fa-database',
      devops: 'fas fa-server',
      frontend: 'fas fa-desktop',
    };
    return icons[category] || 'fas fa-code';
  }

  getDifficultyBadgeClass(difficulty: string): string {
    const classes: { [key: string]: string } = {
      beginner: 'bg-success',
      intermediate: 'bg-warning',
      advanced: 'bg-danger',
    };
    return classes[difficulty] || 'bg-secondary';
  }

  getStepBadgeClass(stepId: number): string {
    const isBackend = this.backendSteps.some((step) => step.id === stepId);
    return isBackend ? 'backend-step' : 'frontend-step';
  }

  getTotalViews(): number {
    return this.tutorials.reduce((sum, tutorial) => sum + tutorial.views, 0);
  }

  getTotalLikes(): number {
    return this.tutorials.reduce((sum, tutorial) => sum + tutorial.likes, 0);
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedDifficulty = 'all';
    this.selectedRoadmapStep = 0;
    this.sortBy = 'newest';
    this.filteredTutorials = [...this.tutorials];
    this.sortTutorials();
    this.isAnimationPaused = false;
  }

  // Progress Calculation Methods - Safe access with fallbacks
  getOverallProgress(): number {
    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    const totalTutorials = allSteps.reduce(
      (sum, step) => sum + (step.tutorials?.length || 0),
      0
    );
    const maxPossible = allSteps.reduce(
      (sum, step) => sum + (step.totalTopics || 1),
      0
    );
    return Math.min(100, Math.round((totalTutorials / maxPossible) * 100));
  }

  getBackendProgress(): number {
    const totalTutorials = this.backendSteps.reduce(
      (sum, step) => sum + (step.tutorials?.length || 0),
      0
    );
    const maxPossible = this.backendSteps.reduce(
      (sum, step) => sum + (step.totalTopics || 1),
      0
    );
    return Math.min(100, Math.round((totalTutorials / maxPossible) * 100));
  }

  getFrontendProgress(): number {
    const totalTutorials = this.frontendSteps.reduce(
      (sum, step) => sum + (step.tutorials?.length || 0),
      0
    );
    const maxPossible = this.frontendSteps.reduce(
      (sum, step) => sum + (step.totalTopics || 1),
      0
    );
    return Math.min(100, Math.round((totalTutorials / maxPossible) * 100));
  }

  getStepProgress(step: RoadmapStep): number {
    const tutorialsCount = step.tutorials?.length || 0;
    const totalTopics = step.totalTopics || 1;
    return Math.min(100, Math.round((tutorialsCount / totalTopics) * 100));
  }

  getProgressHeight(): string {
    const progress = this.getOverallProgress();
    return `${progress}%`;
  }

  getProgressBubblePosition(): string {
    const progress = this.getOverallProgress();
    return `${100 - progress}%`;
  }

  getProgressPercentage(): number {
    return this.getOverallProgress();
  }

  // Utility methods
  toTitleCase(text: string): string {
    return text.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  sliceText(text: string, start: number, end: number): string {
    return text.length > end ? text.substring(start, end) + '...' : text;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Safe access methods with proper fallbacks
  getActiveStep(): RoadmapStep | null {
    const allSteps = [...this.backendSteps, ...this.frontendSteps];
    if (this.currentStepIndex >= 0 && this.currentStepIndex < allSteps.length) {
      return allSteps[this.currentStepIndex];
    }
    return null;
  }

  getActiveStepTopics(): string[] {
    const step = this.getActiveStep();
    return step?.topics || [];
  }

  getTopicsColumns(): string[][] {
    const topics = this.getActiveStepTopics();
    const mid = Math.ceil(topics.length / 2);
    return [topics.slice(0, mid), topics.slice(mid)];
  }

  // Add these methods to your component class

  // For RoadmapStep objects (used in roadmap steps)
  getStepBadgeClassForStep(step: RoadmapStep): string {
    return step.badgeClass || 'backend-badge';
  }

  getStepBadgeTextForStep(step: RoadmapStep): string {
    return step.badgeText || 'Step';
  }

  // For tutorial roadmapStep numbers (used in tutorial cards)
  getStepBadgeClassForId(stepId?: number): string {
    if (!stepId) {
      return 'general-step bg-secondary';
    }

    const isBackend = this.backendSteps.some((step) => step.id === stepId);
    if (isBackend) {
      return 'backend-step bg-primary';
    }

    const isFrontend = this.frontendSteps.some((step) => step.id === stepId);
    if (isFrontend) {
      return 'frontend-step bg-warning text-dark';
    }

    return 'general-step bg-secondary';
  }

  // For progress classes
  getStepProgressClassForStep(step: RoadmapStep): string {
    return step.progressClass || 'backend-progress';
  }

  getStepBadgeTextSafe(step: RoadmapStep): string {
    return step.badgeText || 'Step';
  }

  getStepProgressClassSafe(step: RoadmapStep): string {
    return step.progressClass || 'backend-progress';
  }

  // Animation control methods
  pauseAnimation() {
    this.isAnimationPaused = true;
  }

  resumeAnimation() {
    this.isAnimationPaused = false;
  }

  // Get tutorials count for a step
  getStepTutorialsCount(step: RoadmapStep): number {
    return step.tutorials?.length || 0;
  }

  // Get active step tutorials
  getActiveStepTutorials(): Tutorial[] {
    const step = this.getActiveStep();
    return step?.tutorials?.slice(0, 6) || [];
  }

  // FIXED: Enhanced navigateToTutorial method
  navigateToTutorial(tutorialId: string, roadmapStepId?: number) {
    if (roadmapStepId) {
      // Navigate to tutorial with roadmap context
      this.router.navigate(['/tutorials', tutorialId], {
        queryParams: { roadmapStep: roadmapStepId },
      });
    } else {
      this.router.navigate(['/tutorials', tutorialId]);
    }
  }

  // FIXED: Enhanced method to view all tutorials for a step
  viewAllStepTutorials(step: RoadmapStep) {
    // Navigate to tutorials page filtered by this roadmap step
    this.router.navigate(['/tutorials'], {
      queryParams: { roadmapStep: step.id, category: step.category },
    });
  }

  // Enhanced roadmap steps initialization
  private initializeRoadmap() {
    this.backendSteps = [
      {
        id: 1,
        title: 'Java Fundamentals',
        description:
          'Master core Java concepts and modern features including Java 17/21 LTS, OOP, Collections, Streams API, and Multithreading',
        category: 'backend',
        technologies: [
          'Java 17',
          'Java 21',
          'OOP',
          'Collections',
          'Lambda',
          'Streams',
          'Multithreading',
          'Virtual Threads',
        ],
        topics: [
          'Java 17/21 LTS features',
          'Object-Oriented Programming',
          'Collections Framework',
          'Streams API & Parallel Streams',
          'Exception Handling',
          'Multithreading & Concurrency',
          'Records, Sealed Classes',
          'Pattern Matching',
          'Text Blocks & Switch Expressions',
          'Functional Programming',
          'Java Module System',
          'Virtual Threads (Project Loom)',
        ],
        tutorials: [],
        isActive: true,
        isCompleted: false,
        order: 1,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 12,
      },
      {
        id: 2,
        title: 'Build Tools',
        description:
          'Master Maven and Gradle for project management, dependencies, and build automation',
        category: 'backend',
        technologies: [
          'Maven',
          'Gradle',
          'Build Tools',
          'Dependencies',
          'Plugins',
        ],
        topics: [
          'Project Structure',
          'Dependencies & Plugins',
          'Build Profiles',
          'Multi-module Projects',
          'Spring Boot Plugin',
          'Maven vs Gradle',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 2,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 6,
      },
      {
        id: 3,
        title: 'Spring Core',
        description:
          'Dependency Injection, Bean Lifecycle, and Spring Framework fundamentals',
        category: 'backend',
        technologies: [
          'Spring Framework',
          'IoC',
          'DI',
          'ApplicationContext',
          'Auto Configuration',
        ],
        topics: [
          'IoC / Dependency Injection',
          'Bean Lifecycle',
          'ApplicationContext',
          'Java-based Configuration',
          'Spring Boot Auto Configuration',
          'Conditional Beans',
          'Starter Dependencies',
          'Lombok Integration',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 3,
        badgeClass: 'core-badge',
        badgeText: 'Core',
        progressClass: 'backend-progress',
        totalTopics: 8,
      },
      {
        id: 4,
        title: 'Spring Boot 3.x',
        description:
          'Modern Spring Boot development with latest features and best practices',
        category: 'backend',
        technologies: [
          'Spring Boot 3.x',
          'Spring MVC',
          'Validation',
          'Actuator',
          'AOT',
        ],
        topics: [
          'Spring MVC Architecture',
          'Controllers & ControllerAdvice',
          'HTTP Status Codes',
          'Validation (Jakarta)',
          'Configuration Properties',
          'Profiles & Environment',
          'Actuator & Health Checks',
          'AOT Compilation',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 4,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 8,
      },
      {
        id: 5,
        title: 'Data Access & Persistence',
        description:
          'Database operations with Spring Data JPA, PostgreSQL, MySQL, and Redis',
        category: 'backend',
        technologies: [
          'Spring Data JPA',
          'PostgreSQL',
          'MySQL',
          'Redis',
          'Hibernate',
        ],
        topics: [
          'Spring Data JPA',
          'Entity Mapping & Relationships',
          'Query Methods & @Query',
          'DTO & Projection',
          'Lazy/Eager Loading',
          'Transactions',
          'Pagination & Sorting',
          'Flyway / Liquibase',
          'Spring Data JDBC',
          'Redis Cache',
          'MongoDB',
          'Testcontainers',
          'R2DBC',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 5,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 13,
      },
      {
        id: 6,
        title: 'RESTful APIs',
        description:
          'Build professional REST APIs with proper design patterns and best practices',
        category: 'backend',
        technologies: [
          'REST API',
          'Spring MVC',
          'DTOs',
          'MapStruct',
          'HATEOAS',
        ],
        topics: [
          'REST Design Principles',
          'Request/Response Models',
          'DTOs & Mappers (MapStruct)',
          'Pagination, Sorting, Filtering',
          'Exception Handling',
          'Global Error Handler',
          'File Upload/Download',
          'Versioning APIs',
          'HATEOAS',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 6,
        badgeClass: 'backend-badge',
        badgeText: 'Backend',
        progressClass: 'backend-progress',
        totalTopics: 9,
      },
      {
        id: 7,
        title: 'API Security',
        description:
          'Secure your applications with Spring Security, JWT, and OAuth2',
        category: 'backend',
        technologies: [
          'Spring Security',
          'JWT',
          'OAuth2',
          'OpenID Connect',
          'Keycloak',
        ],
        topics: [
          'Spring Security 6 Lambda DSL',
          'Roles & Authorities',
          'JWT Authentication',
          'OAuth2 / OpenID Connect',
          'Filters & Custom Authentication',
          'Keycloak / Auth0 Integration',
          'CSRF, CORS & Security Headers',
          'Password Encoders',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 7,
        badgeClass: 'backend-badge',
        badgeText: 'Security',
        progressClass: 'backend-progress',
        totalTopics: 8,
      },
      {
        id: 8,
        title: 'Testing',
        description:
          'Comprehensive testing strategies with JUnit, Mockito, and Testcontainers',
        category: 'backend',
        technologies: [
          'JUnit 5',
          'Mockito',
          'Testcontainers',
          'Integration Testing',
        ],
        topics: [
          'JUnit 5',
          'Mockito / MockBean',
          'Spring Boot Test',
          'Integration Tests',
          'RestAssured',
          'Test Slices',
          'Contract Testing',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 8,
        badgeClass: 'backend-badge',
        badgeText: 'Testing',
        progressClass: 'backend-progress',
        totalTopics: 7,
      },
      {
        id: 9,
        title: 'External API Clients',
        description:
          'Communicate with external APIs using RestTemplate, WebClient, and Feign',
        category: 'backend',
        technologies: ['RestTemplate', 'WebClient', 'Feign', 'Resilience4j'],
        topics: [
          'RestTemplate (Legacy)',
          'WebClient (Reactive)',
          'Feign Client',
          'Retry Mechanism',
          'Circuit Breaker',
          'Unit & Integration Testing',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 9,
        badgeClass: 'backend-badge',
        badgeText: 'Integration',
        progressClass: 'backend-progress',
        totalTopics: 6,
      },
      {
        id: 10,
        title: 'DevOps & Monitoring',
        description:
          'Deployment, monitoring, and DevOps practices for Spring Boot applications',
        category: 'backend',
        technologies: [
          'Docker',
          'Kubernetes',
          'Actuator',
          'Micrometer',
          'CI/CD',
        ],
        topics: [
          'Spring Boot Actuator',
          'Micrometer & Metrics',
          'Logging (Logback/SLF4J)',
          'Centralized Logging',
          'Dockerize Spring Apps',
          'CI/CD Pipelines',
          'Prometheus + Grafana',
          'Config Server',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 10,
        badgeClass: 'backend-badge',
        badgeText: 'DevOps',
        progressClass: 'backend-progress',
        totalTopics: 8,
      },
      {
        id: 11,
        title: 'Cloud & Deployment',
        description:
          'Deploy applications to cloud platforms and implement microservices architecture',
        category: 'backend',
        technologies: [
          'AWS',
          'Docker',
          'Kubernetes',
          'Microservices',
          'Spring Cloud',
        ],
        topics: [
          'Deploy to AWS/GCP/Azure',
          'Container Registry',
          'Kubernetes',
          'Serverless',
          'Spring Cloud Config',
          'Service Discovery',
          'Microservices Architecture',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 11,
        badgeClass: 'backend-badge',
        badgeText: 'Cloud',
        progressClass: 'backend-progress',
        totalTopics: 7,
      },
      {
        id: 12,
        title: 'Advanced Backend',
        description:
          'Advanced topics including reactive programming, messaging, and GraphQL',
        category: 'backend',
        technologies: [
          'Microservices',
          'WebFlux',
          'Kafka',
          'GraphQL',
          'Caching',
        ],
        topics: [
          'Microservices Architecture',
          'Service Discovery',
          'API Gateway',
          'Reactive Programming',
          'WebFlux & Reactor',
          'Messaging (RabbitMQ, Kafka)',
          'GraphQL with Spring Boot',
          'Caching Strategies',
          'Observability',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 12,
        badgeClass: 'backend-badge',
        badgeText: 'Advanced',
        progressClass: 'backend-progress',
        totalTopics: 9,
      },
    ];

    this.frontendSteps = [
      {
        id: 13,
        title: 'Web Fundamentals',
        description:
          'Master HTML5, CSS3, JavaScript ES6+, and TypeScript fundamentals',
        category: 'frontend',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'Git'],
        topics: [
          'HTML5 Semantic Elements',
          'CSS3 (Flexbox, Grid)',
          'JavaScript ES6+ Features',
          'TypeScript Fundamentals',
          'Interfaces & Generics',
          'Async/Await & Promises',
          'Decorators',
          'Basic Git & Version Control',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 1,
        badgeClass: 'frontend-badge',
        badgeText: 'Frontend',
        progressClass: 'frontend-progress',
        totalTopics: 8,
      },
      {
        id: 14,
        title: 'Angular Core (v19)',
        description:
          'Modern Angular development with standalone components, signals, and latest features',
        category: 'frontend',
        technologies: [
          'Angular 19',
          'TypeScript',
          'Standalone',
          'Signals',
          'Zones',
        ],
        topics: [
          'Angular Architecture',
          'Standalone Components',
          'Modules vs Standalone APIs',
          'Components & Templates',
          'Data Binding',
          'Directives (ngIf, ngFor)',
          'Pipes (built-in & custom)',
          'Signals (Angular 16+)',
          'Zone-less Change Detection',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 2,
        badgeClass: 'frontend-badge',
        badgeText: 'Angular',
        progressClass: 'frontend-progress',
        totalTopics: 9,
      },
      {
        id: 15,
        title: 'Routing & Navigation',
        description:
          'Client-side routing, lazy loading, guards, and navigation in Angular',
        category: 'frontend',
        technologies: [
          'Angular Router',
          'Lazy Loading',
          'Guards',
          'Navigation',
        ],
        topics: [
          'RouterModule & Routes',
          'Route Parameters',
          'Query Parameters',
          'Lazy Loading',
          'Route Guards',
          'Preloading Strategies',
          'Route Resolvers',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 3,
        badgeClass: 'frontend-badge',
        badgeText: 'Routing',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
      {
        id: 16,
        title: 'Services & Dependency Injection',
        description:
          'Angular services, dependency injection, and RxJS for reactive programming',
        category: 'frontend',
        technologies: ['Services', 'DI', 'RxJS', 'Observables', 'Subjects'],
        topics: [
          'Injectable Services',
          'Hierarchical DI',
          'RxJS Observables',
          'Subjects & BehaviorSubjects',
          'Common Operators',
          'Error Handling',
          'Reactive Patterns',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 4,
        badgeClass: 'frontend-badge',
        badgeText: 'Services',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
      {
        id: 17,
        title: 'HTTP Communication',
        description:
          'HTTP client, interceptors, and API communication in Angular',
        category: 'frontend',
        technologies: ['HttpClient', 'Interceptors', 'API', 'CRUD'],
        topics: [
          'HttpClient Module',
          'CRUD Operations',
          'Request/Response Interceptors',
          'JWT & Logging Interceptors',
          'Environment Configuration',
          'API Versioning',
          'Error Handling',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 5,
        badgeClass: 'frontend-badge',
        badgeText: 'HTTP',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
      {
        id: 18,
        title: 'Authentication & Authorization',
        description:
          'JWT authentication, route protection, and role-based access in Angular',
        category: 'frontend',
        technologies: ['JWT', 'Auth Guards', 'Route Protection', 'Roles'],
        topics: [
          'JWT Integration',
          'Login/Signup Flow',
          'Auth Guards',
          'Route Protection',
          'Role-based UI',
          'Refresh Tokens',
          'Persistent Auth State',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 6,
        badgeClass: 'frontend-badge',
        badgeText: 'Auth',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
      {
        id: 19,
        title: 'UI & Styling',
        description:
          'Modern UI development with Angular Material, Tailwind CSS, and responsive design',
        category: 'frontend',
        technologies: [
          'Angular Material',
          'Tailwind CSS',
          'SCSS',
          'Responsive',
        ],
        topics: [
          'Angular Material Components',
          'Tailwind CSS Setup',
          'SCSS & CSS Preprocessors',
          'Responsive Design',
          'Angular Animations',
          'Custom Themes',
          'Reusable Components',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 7,
        badgeClass: 'frontend-badge',
        badgeText: 'UI/UX',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
      {
        id: 20,
        title: 'Testing',
        description:
          'Comprehensive testing strategies for Angular applications',
        category: 'frontend',
        technologies: ['Jasmine', 'Karma', 'Cypress', 'Testing'],
        topics: [
          'Unit Testing (Jasmine)',
          'Component Testing',
          'Service Testing',
          'HttpTestingController',
          'E2E Testing (Cypress)',
          'Test Best Practices',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 8,
        badgeClass: 'frontend-badge',
        badgeText: 'Testing',
        progressClass: 'frontend-progress',
        totalTopics: 6,
      },
      {
        id: 21,
        title: 'Build & Deployment',
        description:
          'Build optimization, environment configuration, and deployment strategies',
        category: 'frontend',
        technologies: [
          'Angular CLI',
          'Build Optimization',
          'Deployment',
          'AWS',
        ],
        topics: [
          'Angular CLI Commands',
          'Environment Configs',
          'Code Optimization',
          'AOT Compilation',
          'Bundle Analyzer',
          'Deployment Platforms',
          'AWS S3 + CloudFront',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 9,
        badgeClass: 'frontend-badge',
        badgeText: 'Deployment',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
      {
        id: 22,
        title: 'Advanced Frontend',
        description:
          'Advanced Angular topics including state management, PWA, and performance',
        category: 'frontend',
        technologies: ['NgRx', 'Signals', 'PWA', 'SSR', 'Performance'],
        topics: [
          'State Management (NgRx)',
          'Signals Store',
          'Performance Optimization',
          'Progressive Web Apps',
          'SSR & SSG (Angular Universal)',
          'Monorepos with Nx',
          'Internationalization',
        ],
        tutorials: [],
        isActive: false,
        isCompleted: false,
        order: 10,
        badgeClass: 'frontend-badge',
        badgeText: 'Advanced',
        progressClass: 'frontend-progress',
        totalTopics: 7,
      },
    ];
  }

  // tutorials-list.component.ts - OPTIMIZE HAS TUTORIAL METHOD

  // FIXED: Optimized hasTutorial method to reduce multiple calls
  private stepTutorialCache: Map<String | number, boolean> = new Map();

  hasTutorial(step: RoadmapStep): boolean {
    // Check cache first
    if (this.stepTutorialCache.has(step.id)) {
      return this.stepTutorialCache.get(step.id)!;
    }

    // First check if we have tutorials mapped locally
    if (step.tutorials && step.tutorials.length > 0) {
      this.stepTutorialCache.set(step.id, true);
      return true;
    }

    // Check database
    const hasTutorialInDB = this.tutorials.some(
      (tutorial) => tutorial.roadmapStep === step.id && tutorial.published
    );

    this.stepTutorialCache.set(step.id, hasTutorialInDB);

    // tutorials-list.component.ts - FIX TEMPLATE LITERAL

    // FIXED: Use backticks for template literals
    // Only log once per step to reduce console noise
    if (!hasTutorialInDB && !this.stepTutorialCache.has(`logged_${step.id}`)) {
      console.log(`❌ Step ${step.id} has no tutorials in database`);
      this.stepTutorialCache.set(`logged_${step.id}`, true); // FIX: Use backticks here too
    }

    return hasTutorialInDB;
  }

  // tutorials-list.component.ts - ADD DEEP DEBUG METHOD

  // Add this method to debug the exact issue
  private debugStepMapping(stepId: number) {
    const step = [...this.backendSteps, ...this.frontendSteps].find(
      (s) => s.id === stepId
    );
    if (!step) {
      console.log(`❌ Step ${stepId} not found in steps array`);
      return;
    }

    console.log(`🔍 DEEP DEBUG for Step ${stepId} (${step.title}):`);

    // Check local tutorials mapping
    console.log(`   Local tutorials:`, step.tutorials?.length || 0);
    if (step.tutorials && step.tutorials.length > 0) {
      console.log(
        `   Tutorial details:`,
        step.tutorials.map((t) => ({
          id: t.id,
          title: t.title,
          roadmapStep: t.roadmapStep,
          published: t.published,
        }))
      );
    }

    // Check database tutorials
    const dbTutorials = this.tutorials.filter(
      (t) => t.roadmapStep === stepId && t.published
    );
    console.log(`   DB tutorials:`, dbTutorials.length);
    console.log(
      `   DB tutorial details:`,
      dbTutorials.map((t) => ({
        id: t.id,
        title: t.title,
        roadmapStep: t.roadmapStep,
        published: t.published,
      }))
    );

    // Check hasTutorial result
    const hasTut = this.hasTutorial(step);
    console.log(`   hasTutorial result:`, hasTut);
  }

  // In tutorials-list.component.ts - UPDATE the loadTutorials method:

  async loadTutorials() {
    try {
      this.isLoading = true;
      this.tutorials = await this.matrixNotesService.getPublishedTutorials();
      this.filteredTutorials = [...this.tutorials];

      // Debug the loaded data
      this.debugTutorialData();

      await this.enhancedMapTutorialsToRoadmap();

      // Clear cache when reloading
      this.stepTutorialCache.clear();

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading tutorials:', error);
      this.isLoading = false;
    }
  }

  // In tutorials-list.component.ts - ADD this test method:

  // Test method to verify roadmap step navigation
  async testRoadmapStepNavigation(stepId: number) {
    console.log(`🧪 Testing navigation for step ${stepId}`);

    const step = [...this.backendSteps, ...this.frontendSteps].find(
      (s) => s.id === stepId
    );
    if (!step) {
      console.error(`❌ Step ${stepId} not found`);
      return;
    }

    console.log(`Testing step: ${step.title}`);
    console.log(`hasTutorial result: ${this.hasTutorial(step)}`);

    // Manually test the service call
    const tutorials = await this.matrixNotesService.getTutorialsByRoadmapStep(
      stepId
    );
    console.log(`Service returned ${tutorials.length} tutorials`);

    if (tutorials.length > 0) {
      console.log(
        `First tutorial: ${tutorials[0].title} (ID: ${tutorials[0].id})`
      );
      // Try to navigate
      this.router.navigate(['/tutorials', tutorials[0].id], {
        queryParams: { roadmapStep: stepId },
      });
    }
  }
}
