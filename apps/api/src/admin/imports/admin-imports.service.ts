import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import type { CsvImportResult } from '@shopvui/shared';

interface CsvOrderRow {
  externalOrderId: string;
  channel: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  total: string;
  subtotal?: string;
  paymentMethod: string;
  status?: string;
}

@Injectable()
export class AdminImportsService {
  async importOrdersCsv(buffer: Buffer): Promise<CsvImportResult> {
    let imported = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    const stream = Readable.from(buffer);
    const parser = stream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }),
    );

    let batch: Array<CsvOrderRow & { _rowIndex: number }> = [];
    let rowIndex = 1; // 1-based, +1 for header

    for await (const row of parser) {
      rowIndex++;
      batch.push({ ...(row as CsvOrderRow), _rowIndex: rowIndex });

      if (batch.length >= 100) {
        const result = await this.processBatch(batch, errors);
        imported += result.imported;
        skipped += result.skipped;
        batch = [];
      }
    }

    // Process remaining rows
    if (batch.length > 0) {
      const result = await this.processBatch(batch, errors);
      imported += result.imported;
      skipped += result.skipped;
    }

    return { imported, skipped, errors };
  }

  private async processBatch(
    batch: Array<CsvOrderRow & { _rowIndex: number }>,
    errors: { row: number; reason: string }[],
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const rowIndex = row._rowIndex;

        try {
          if (!row.externalOrderId || !row.channel) {
            errors.push({ row: rowIndex, reason: 'Missing externalOrderId or channel' });
            continue;
          }

          // Deduplication check
          const existing = await tx.order.findFirst({
            where: {
              externalOrderId: row.externalOrderId,
              channel: row.channel,
            },
          });

          if (existing) {
            skipped++;
            continue;
          }

          const total = parseInt(row.total, 10);
          if (isNaN(total)) {
            errors.push({ row: rowIndex, reason: 'Invalid total' });
            continue;
          }

          const today = new Date();
          const dateStr =
            today.getFullYear().toString() +
            (today.getMonth() + 1).toString().padStart(2, '0') +
            today.getDate().toString().padStart(2, '0');
          const orderNumber = `SV-${dateStr}-IMP-${Date.now()}-${rowIndex}`;

          await tx.order.create({
            data: {
              orderNumber,
              externalOrderId: row.externalOrderId,
              channel: row.channel,
              customerName: row.customerName || null,
              customerPhone: row.customerPhone || null,
              customerEmail: row.customerEmail || null,
              total,
              subtotal: row.subtotal ? parseInt(row.subtotal, 10) : total,
              paymentMethod: (row.paymentMethod as any) || 'COD',
              status: (row.status as any) || 'PENDING',
            },
          });

          imported++;
        } catch (err: any) {
          errors.push({ row: rowIndex, reason: err.message ?? 'Unknown error' });
        }
      }
    });

    return { imported, skipped };
  }
}
