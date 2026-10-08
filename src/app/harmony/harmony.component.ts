import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import jsPDF from 'jspdf';

interface HarmonyRow {
  key: string;
  major: string[];
  minor: string[];
}

const MAJOR_DEGREES = ['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm', 'VIIdim'];
const MINOR_DEGREES = ['Im', 'IIdim', 'III', 'IVm', 'Vm', 'VI', 'VII'];

const HARMONY_DATA: HarmonyRow[] = [
  { key: 'C',  major: ['C',  'Dm',   'Em',   'F',  'G',  'Am',   'Bdim'],  minor: ['Cm',   'Ddim',  'Eb', 'Fm',   'Gm',   'Ab', 'Bb'] },
  { key: 'C#', major: ['C#', 'D#m',  'E#m',  'F#', 'G#', 'A#m',  'B#dim'], minor: ['C#m',  'D#dim', 'E',  'F#m',  'G#m',  'A',  'B']  },
  { key: 'D',  major: ['D',  'Em',   'F#m',  'G',  'A',  'Bm',   'C#dim'], minor: ['Dm',   'Edim',  'F',  'Gm',   'Am',   'Bb', 'C']  },
  { key: 'D#', major: ['D#', 'E#m',  'F##m', 'G#', 'A#', 'B#m',  'C##dim'],minor: ['D#m',  'E#dim', 'F#', 'G#m',  'A#m',  'B',  'C#'] },
  { key: 'E',  major: ['E',  'F#m',  'G#m',  'A',  'B',  'C#m',  'D#dim'], minor: ['Em',   'F#dim', 'G',  'Am',   'Bm',   'C',  'D']  },
  { key: 'F',  major: ['F',  'Gm',   'Am',   'Bb', 'C',  'Dm',   'Edim'],  minor: ['Fm',   'Gdim',  'Ab', 'Bbm',  'Cm',   'Db', 'Eb'] },
  { key: 'F#', major: ['F#', 'G#m',  'A#m',  'B',  'C#', 'D#m',  'E#dim'], minor: ['F#m',  'G#dim', 'A',  'Bm',   'C#m',  'D',  'E']  },
  { key: 'G',  major: ['G',  'Am',   'Bm',   'C',  'D',  'Em',   'F#dim'], minor: ['Gm',   'Adim',  'Bb', 'Cm',   'Dm',   'Eb', 'F']  },
  { key: 'G#', major: ['G#', 'A#m',  'B#m',  'C#', 'D#', 'E#m',  'F##dim'],minor: ['G#m',  'A#dim', 'B',  'C#m',  'D#m',  'E',  'F#'] },
  { key: 'A',  major: ['A',  'Bm',   'C#m',  'D',  'E',  'F#m',  'G#dim'], minor: ['Am',   'Bdim',  'C',  'Dm',   'Em',   'F',  'G']  },
  { key: 'A#', major: ['A#', 'B#m',  'C##m', 'D#', 'E#', 'F##m', 'G##dim'],minor: ['A#m',  'B#dim', 'C#', 'D#m',  'E#m',  'F#', 'G#'] },
  { key: 'B',  major: ['B',  'C#m',  'D#m',  'E',  'F#', 'G#m',  'A#dim'], minor: ['Bm',   'C#dim', 'D',  'Em',   'F#m',  'G',  'A']  },
];

@Component({
  selector: 'app-harmony',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './harmony.component.html',
  styleUrls: ['./harmony.component.scss'],
})
export class HarmonyComponent implements OnInit {
  majorDegrees = MAJOR_DEGREES;
  minorDegrees = MINOR_DEGREES;
  harmonyData = HARMONY_DATA;
  selectedKey = '';
  studyNotes = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  selectKey(key: string): void {
    this.selectedKey = this.selectedKey === key ? '' : key;
  }

  exportPdf(): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const margin = 14;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const drawHeader = () => {
      doc.setFillColor(30, 42, 58);
      doc.rect(0, 0, pageW, 20, 'F');
      doc.setTextColor(74, 144, 226);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Harmonic Field — Major & Minor', margin, 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(138, 151, 168);
      doc.text('Music Translator', pageW - margin, 13, { align: 'right' });
    };

    const drawTable = (
      title: string,
      degrees: string[],
      rows: { key: string; chords: string[] }[],
      startY: number
    ): number => {
      const colW = (pageW - margin * 2) / (degrees.length + 1);
      let y = startY;

      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(138, 151, 168);
      doc.text(title.toUpperCase(), margin, y);
      y += 6;

      const rowH = 7;
      const headerH = 8;

      // Header row
      doc.setFillColor(36, 48, 64);
      doc.rect(margin, y, pageW - margin * 2, headerH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(138, 151, 168);
      doc.text('Key', margin + colW * 0.5, y + 5.5, { align: 'center' });
      degrees.forEach((d, i) => {
        doc.text(d, margin + colW * (i + 1.5), y + 5.5, { align: 'center' });
      });
      y += headerH;

      // Data rows
      rows.forEach((row, ri) => {
        const bg = ri % 2 === 0 ? [20, 30, 46] : [26, 38, 54];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(margin, y, pageW - margin * 2, rowH, 'F');

        // Key cell
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(224, 232, 240);
        doc.text(row.key, margin + colW * 0.5, y + 4.8, { align: 'center' });

        // Chord cells
        row.chords.forEach((chord, ci) => {
          if (ci === 0)      doc.setTextColor(74, 144, 226);   // tonic — blue
          else if (ci === 4) doc.setTextColor(232, 164, 74);   // dominant — orange
          else if (ci === 1 && title.toLowerCase().includes('minor'))
                             doc.setTextColor(192, 120, 120);  // dim in minor
          else if (ci === 6 && title.toLowerCase().includes('major'))
                             doc.setTextColor(192, 120, 120);  // dim in major
          else               doc.setTextColor(200, 216, 232);

          doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
          doc.text(chord, margin + colW * (ci + 1.5), y + 4.8, { align: 'center' });
        });
        y += rowH;
      });

      return y;
    };

    drawHeader();

    const majorRows = HARMONY_DATA.map(r => ({ key: r.key,       chords: r.major }));
    const minorRows = HARMONY_DATA.map(r => ({ key: r.key + 'm', chords: r.minor }));

    let y = 28;
    y = drawTable('Major (Ionian)',   MAJOR_DEGREES, majorRows, y) + 10;

    if (y + 100 > pageH) { doc.addPage(); drawHeader(); y = 28; }
    drawTable('Minor (Aeolian)', MINOR_DEGREES, minorRows, y);

    doc.save('harmonic-field.pdf');
  }
}
