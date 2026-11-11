import { TemplateNaskah } from '../types';

export function downloadWordTemplate(template: TemplateNaskah): void {
  // Generate a clean HTML-based Word document with Word XML namespaces that opens natively in MS Word
  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${template.judul}</title>
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.3;
    margin: 3cm 2cm 2.5cm 2.5cm;
    color: #000;
  }
  .kop {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 18px;
  }
  .kop h2 {
    font-size: 12pt;
    font-weight: bold;
    margin: 0;
    text-transform: uppercase;
  }
  .kop h1 {
    font-size: 14pt;
    font-weight: bold;
    margin: 2px 0;
    text-transform: uppercase;
  }
  .kop p {
    font-size: 9pt;
    margin: 0;
  }
  .nomor-bar {
    width: 100%;
    margin-bottom: 15px;
  }
  .nomor-bar td {
    vertical-align: top;
    font-size: 11pt;
  }
  .isi {
    text-align: justify;
    margin-bottom: 20px;
  }
  .ttd {
    float: right;
    width: 250px;
    text-align: left;
    margin-top: 30px;
  }
  .tembusan {
    clear: both;
    margin-top: 40px;
    font-size: 10pt;
  }
</style>
</head>
<body>

<div class="kop">
  <h2>BADAN PUSAT STATISTIK</h2>
  <h1>PROVINSI KALIMANTAN BARAT</h1>
  <p>Jl. Sutan Syahrir No. 24/42, Pontianak 78116 · Telp: (0561) 732049</p>
  <p>Email: bps6100@bps.go.id · Website: kalbar.bps.go.id</p>
</div>

<table class="nomor-bar">
  <tr>
    <td style="width: 60%;">
      Nomor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: B-...../61000/...... /2026<br>
      Sifat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Biasa / Segera<br>
      Lampiran &nbsp;&nbsp;&nbsp;&nbsp;: -<br>
      Perihal &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: [Tuliskan Perihal Naskah Dinas]
    </td>
    <td style="width: 40%; text-align: right;">
      Pontianak, [Tanggal Surat]
    </td>
  </tr>
</table>

<p style="margin-top: 15px;">
  Yth. [Nama Pejabat / Pimpinan Instansi Penerima]<br>
  di -<br>
  &nbsp;&nbsp;&nbsp;&nbsp;[Tempat / Kota Tujuan]
</p>

<div class="isi">
  <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Dalam rangka pelaksanaan tugas dan fungsi Badan Pusat Statistik Provinsi Kalimantan Barat terkait kegiatan [Tuliskan Latar Belakang / Maksud Kegiatan], bersama ini kami sampaikan hal-hal sebagai berikut:</p>
  
  <ol>
    <li>[Poin materi pokok pertama - penjelasan substantif]</li>
    <li>[Poin materi pokok kedua - data dukung, jadwal, atau permohonan koordinasi]</li>
    <li>[Poin penegasan atau tindak lanjut yang diharapkan]</li>
  </ol>

  <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Demikian kami sampaikan, atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>
</div>

<div class="ttd">
  <p>Kepala BPS Provinsi Kalimantan Barat,<br><br><br><br><br>
  <b>[NAMA LENGKAP KEPALA BPS]</b><br>
  NIP. [NIP Pejabat]</p>
</div>

<div class="tembusan">
  <p>Tembusan:<br>
  1. Sekretaris Utama BPS RI di Jakarta<br>
  2. Pertinggal / Arsip Tata Usaha</p>
</div>

</body>
</html>
`;

  const blob = new Blob([htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Template_${template.jenis.replace(/[\s\(\)\/]/g, '_')}_BPS_Kalbar.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
