import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TransposerService, NOTES, NOTE_DISPLAY } from '../services/transposer.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './translator.component.html',
  styleUrls: ['./translator.component.scss'],
})
export class TranslatorComponent implements OnInit {
  artistName = '';
  songName = '';

  sourceNote = 'C';
  targetNote = 'C';

  inputText = '';
  transposedText = '';
  showTransposed = false;
  copySuccess = false;

  showPdfModal = false;
  isDragOver = false;
  importError = '';
  isImporting = false;
  importProgress = 0;
  importSuccess = false;

  notes = NOTES;
  noteDisplay = NOTE_DISPLAY;

  constructor(
    private auth: AuthService,
    private router: Router,
    public transposer: TransposerService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedData()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  canDeactivate(): boolean {
    return this.confirmLeaveIfNeeded();
  }

  transpose(): void {
    if (this.inputText.trim().toLowerCase() === 'ja meteste') {
      this.transposedText = 'Tu é que já meteste';
      this.showTransposed = true;
      this.copySuccess = false;
      return;
    }
    const semitones = this.transposer.getSemitones(this.sourceNote, this.targetNote);
    this.transposedText = this.transposer.transposeText(this.inputText, semitones);
    this.showTransposed = true;
    this.copySuccess = false;
  }

  closeTransposed(): void {
    this.showTransposed = false;
    this.transposedText = '';
  }

  copyTransposed(): void {
    navigator.clipboard.writeText(this.transposedText).then(() => {
      this.copySuccess = true;
      setTimeout(() => (this.copySuccess = false), 2500);
    });
  }

  openPdfModal(): void {
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
  }

  exportPdf(mode: 'original' | 'transposed' | 'both'): void {
    this.showPdfModal = false;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Embed raw text in PDF metadata so we can recover it on import
    const meta = JSON.stringify({
      artist: this.artistName,
      song: this.songName,
      sourceNote: this.sourceNote,
      targetNote: this.targetNote,
      text: this.inputText,
    });
    doc.setDocumentProperties({
      title: this.songName || 'Music Translator',
      author: this.artistName || '',
      subject: '[[MT:' + btoa(unescape(encodeURIComponent(meta))) + ':MT]]',
      creator: 'Music Translator App',
    });
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const usableW = pageW - margin * 2;
    let y = margin;

    // Title block
    doc.setFillColor(42, 52, 71);
    doc.rect(0, 0, pageW, 40, 'F');

    doc.setTextColor(74, 144, 226);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = this.songName || 'Untitled Song';
    doc.text(title, margin, 18);

    doc.setFontSize(12);
    doc.setTextColor(176, 190, 197);
    doc.setFont('helvetica', 'normal');
    if (this.artistName) {
      doc.text(this.artistName, margin, 28);
    }

    const keyInfo = `Transposed: ${this.sourceNote} → ${this.targetNote}`;
    doc.text(keyInfo, margin, 36);

    y = 52;

    // Original tab
    if (mode === 'original' || mode === 'both') {
      doc.setTextColor(74, 144, 226);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Original', margin, y);
      y += 6;

      doc.setDrawColor(74, 144, 226);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      const originalLines = this.inputText.split('\n');
      let inRefO = false;
      let inItO = false;
      for (const line of originalLines) {
        if (y > 270) { doc.addPage(); y = margin; }
        if (line.trim() === '.ref') { inRefO = !inRefO; continue; }
        if (line.trim() === '.it')  { inItO  = !inItO;  continue; }
        const style = inRefO && inItO ? 'bolditalic' : inRefO ? 'bold' : inItO ? 'italic' : 'normal';
        doc.setFont('courier', style);
        const wrapped = doc.splitTextToSize(line || ' ', usableW);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5;
      }

      y += 8;
    }

    // Transposed tab
    if ((mode === 'transposed' || mode === 'both') && this.transposedText) {
      if (mode === 'transposed') {
        // Reset y if only transposed (original section not drawn)
        y = 52;
      }
      doc.setTextColor(74, 144, 226);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      if (y > 260) { doc.addPage(); y = margin; }
      doc.text(`Transposed (${this.targetNote})`, margin, y);
      y += 6;

      doc.setDrawColor(74, 144, 226);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      const transposedLines = this.transposedText.split('\n');
      let inRefT = false;
      let inItT = false;
      for (const line of transposedLines) {
        if (y > 270) { doc.addPage(); y = margin; }
        if (line.trim() === '.ref') { inRefT = !inRefT; continue; }
        if (line.trim() === '.it')  { inItT  = !inItT;  continue; }
        const style = inRefT && inItT ? 'bolditalic' : inRefT ? 'bold' : inItT ? 'italic' : 'normal';
        doc.setFont('courier', style);
        const wrapped = doc.splitTextToSize(line || ' ', usableW);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5;
      }
    }

    const filename = `${this.artistName ? this.artistName + ' - ' : ''}${this.songName || 'tab'}.pdf`;
    doc.save(filename);
  }

  logout(): void {
    if (!this.confirmLeaveIfNeeded()) return;
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getNoteDisplay(note: string): string {
    const idx = this.notes.indexOf(note);
    return idx !== -1 ? this.noteDisplay[idx] : note;
  }

  /** Converts .ref (bold) and .it (italic) blocks to styled HTML for the rendered preview panels */
  renderHtml(text: string): string {
    const lines = text.split('\n');
    let inRef = false;
    let inIt = false;
    return lines.map(line => {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (line.trim() === '.ref') { inRef = !inRef; return ``; }
      if (line.trim() === '.it')  { inIt  = !inIt;  return ``; }

      if (inRef && inIt) return `<strong><em>${escaped}</em></strong>`;
      if (inRef)         return `<strong>${escaped}</strong>`;
      if (inIt)          return `<em>${escaped}</em>`;
      return escaped;
    }).join('\n');
  }

  clearAll(): void {
    this.inputText = '';
    this.transposedText = '';
    this.showTransposed = false;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.importPdfFile(file);
  }

  onFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.importPdfFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  onDropZoneClick(fileInput: HTMLInputElement): void {
    if (!this.isImporting) fileInput.click();
  }

  private hasUnsavedData(): boolean {
    return Boolean(
      this.artistName.trim() ||
      this.songName.trim() ||
      this.inputText.trim() ||
      this.transposedText.trim()
    );
  }

  private confirmLeaveIfNeeded(): boolean {
    if (!this.hasUnsavedData()) return true;
    return window.confirm('If you leave this page, unsaved data may be lost. Do you want to continue?');
  }

  private importPdfFile(file: File): void {
    this.importError = '';
    this.importSuccess = false;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.importError = 'Please drop a PDF file exported by Music Translator.';
      return;
    }
    this.isImporting = true;
    this.importProgress = 5;

    // Smooth fake progress animation — real onprogress rarely fires for small files
    const progressInterval = setInterval(() => {
      if (this.importProgress < 85) {
        this.importProgress += Math.random() * 12;
        if (this.importProgress > 85) this.importProgress = 85;
      }
    }, 120);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const real = Math.round((e.loaded / e.total) * 85);
        if (real > this.importProgress) this.importProgress = real;
      }
    };

    reader.onload = (e) => {
      clearInterval(progressInterval);
      this.importProgress = 95;
      try {
        const raw = e.target?.result as string;
        const match = raw.match(/\[\[MT:([A-Za-z0-9+/=]+):MT\]\]/);
        if (!match) {
          this.importError = 'This PDF was not exported by Music Translator — no embedded data found.';
          this.isImporting = false;
          this.importProgress = 0;
          return;
        }
        const json = decodeURIComponent(escape(atob(match[1])));
        const data = JSON.parse(json);
        this.inputText      = data.text       || '';
        this.artistName     = data.artist     || '';
        this.songName       = data.song       || '';
        this.sourceNote     = data.sourceNote || 'C';
        this.targetNote     = data.targetNote || 'C';
        this.transposedText = '';
        this.showTransposed = false;
        this.importProgress = 100;
        this.importSuccess  = true;
        setTimeout(() => {
          this.isImporting    = false;
          this.importProgress = 0;
          this.importSuccess  = false;
        }, 2000);
      } catch {
        this.importError    = 'Failed to read the PDF. Make sure it was exported by Music Translator.';
        this.isImporting    = false;
        this.importProgress = 0;
      }
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      this.importError    = 'Error reading file.';
      this.isImporting    = false;
      this.importProgress = 0;
    };

    reader.readAsBinaryString(file);
  }
}
