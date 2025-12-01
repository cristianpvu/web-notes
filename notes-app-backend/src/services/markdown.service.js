class MarkdownService {
  static toHTML(markdown) {
    if (!markdown) return '';

    let html = markdown;

    html = html.replace(/^#1 (.+)$/gm, '<h1 style="font-size: 2em; font-weight: bold; margin: 0.67em 0;">$1</h1>');
    html = html.replace(/^#2 (.+)$/gm, '<h2 style="font-size: 1.5em; font-weight: bold; margin: 0.75em 0;">$1</h2>');
    html = html.replace(/^#3 (.+)$/gm, '<h3 style="font-size: 1.17em; font-weight: bold; margin: 0.83em 0;">$1</h3>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/__(.+?)__/g, '<u>$1</u>');

    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    html = html.replace(/\[color:(\w+)\](.+?)\[\/color\]/g, '<span style="color: $1;">$2</span>');

    html = html.replace(/\[size:(\d+)\](.+?)\[\/size\]/g, '<span style="font-size: $1px;">$2</span>');

    html = html.replace(/\[bg:(\w+)\](.+?)\[\/bg\]/g, '<span style="background-color: $1; padding: 2px 4px;">$2</span>');

    html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 20px;">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul style="list-style-type: disc;">$1</ul>');

    html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left: 4px solid #ddd; margin: 10px 0; padding-left: 15px; color: #666;">$1</blockquote>');

    html = html.replace(/\n/g, '<br>');

    return html;
  }

  static sanitize(markdown) {
    if (!markdown) return '';
    
    let sanitized = markdown
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    return sanitized;
  }

  static toPlainText(markdown) {
    if (!markdown) return '';

    let plain = markdown;

    plain = plain.replace(/^#[1-3] /gm, '');
    plain = plain.replace(/\*\*(.+?)\*\*/g, '$1');
    plain = plain.replace(/\*(.+?)\*/g, '$1');
    plain = plain.replace(/__(.+?)__/g, '$1');
    plain = plain.replace(/~~(.+?)~~/g, '$1');
    plain = plain.replace(/\[color:\w+\](.+?)\[\/color\]/g, '$1');
    plain = plain.replace(/\[size:\d+\](.+?)\[\/size\]/g, '$1');
    plain = plain.replace(/\[bg:\w+\](.+?)\[\/bg\]/g, '$1');
    plain = plain.replace(/^- /gm, '');
    plain = plain.replace(/^> /gm, '');

    return plain.trim();
  }

  static extractKeywords(text, limit = 10) {
    if (!text) return [];

    const plainText = this.toPlainText(text).toLowerCase();
    
    const stopWords = ['si', 'și', 'la', 'de', 'cu', 'în', 'pe', 'pentru', 'este', 'un', 'o', 'că', 'care', 'acest', 'a', 'al', 'sau', 'dar'];
    
    const words = plainText
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !stopWords.includes(word));

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }
}

module.exports = MarkdownService;