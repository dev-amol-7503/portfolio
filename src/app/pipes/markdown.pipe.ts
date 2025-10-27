import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    // Simple markdown to HTML conversion
    return value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/# (.*?)(?=\n|$)/g, '<h1>$1</h1>')
      .replace(/## (.*?)(?=\n|$)/g, '<h2>$1</h2>')
      .replace(/### (.*?)(?=\n|$)/g, '<h3>$1</h3>')
      .replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }
}