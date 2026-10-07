import { IReconciliationRepository } from '../../domain/repositories/IReconciliationRepository';
import { GetReconciliationSummary } from './GetReconciliationSummary';

import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

export class GenerateReconciliationReport {
  constructor(private readonly reconciliationRepository: IReconciliationRepository) {}

  async execute(reconciliationId: string, format: 'pdf' | 'csv'): Promise<Buffer | string> {
    const getSummary = new GetReconciliationSummary(this.reconciliationRepository);
    const summary = await getSummary.execute(reconciliationId);

    if (format === 'csv') {
      const parser = new Parser({
        fields: ['reconciliationId', 'totalDispensed', 'variationSm3', 'certified', 'aforoSm3PerBar']
      });
      const csvData = [{
        reconciliationId,
        totalDispensed: summary.totalDispensed,
        variationSm3: summary.variationSm3,
        certified: summary.certified,
        aforoSm3PerBar: summary.aforoSm3PerBar
      }];
      return parser.parse(csvData);
    }

    if (format === 'pdf') {
      return new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        doc.fontSize(20).text('Reconciliation FinOps Report', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Reconciliation ID: ${reconciliationId}`);
        doc.moveDown();
        
        doc.text(`Total Dispensed (Sm3): ${summary.totalDispensed.toFixed(2)}`);
        doc.text(`Variation (Sm3): ${summary.variationSm3.toFixed(2)}`);
        doc.text(`Certified: ${summary.certified ? 'Yes' : 'No'}`);
        doc.text(`Aforo (Sm3/bar): ${summary.aforoSm3PerBar.toFixed(4)}`);

        doc.end();
      });
    }

    throw new Error(`Unsupported format: ${format}`);
  }
}
