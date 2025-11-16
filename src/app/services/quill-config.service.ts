// services/quill-config.service.ts
import { Injectable } from '@angular/core';
import hljs from 'highlight.js';

// Import specific languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';

@Injectable({
  providedIn: 'root'
})
export class QuillConfigService {
  
  constructor() {
    this.registerHighlightJSLanguages();
  }

  private registerHighlightJSLanguages() {
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('java', java);
    hljs.registerLanguage('python', python);
    hljs.registerLanguage('css', css);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('html', xml);
    hljs.registerLanguage('bash', bash);
    hljs.registerLanguage('sql', sql);
  }

  getQuillConfig() {
    return {
      syntax: {
        highlight: (text: string) => {
          return hljs.highlightAuto(text).value;
        }
      },
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean']
        ]
      }
    };
  }
}