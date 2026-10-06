import { randomUUID } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { Readable } from 'stream';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const RECEIPT_PREFIX = 'receipts/';
const LOCAL_ROOT = resolve(process.cwd(), 'uploads');

export interface StoredReceipt {
  key: string;
  contentType: string;
  fileName: string;
}

export interface ReceiptFile {
  stream: Readable;
  contentType: string;
  fileName: string;
}

@Injectable()
export class ReceiptStorageService {
  private readonly logger = new Logger(ReceiptStorageService.name);
  private readonly bucket = process.env.AWS_S3_BUCKET_NAME?.trim();
  private readonly client = this.bucket ? this.createClient() : null;

  isReceiptKey(key: string) {
    return key.startsWith(RECEIPT_PREFIX) && !key.includes('..');
  }

  async save(file: Express.Multer.File): Promise<StoredReceipt> {
    const originalName = this.decodeName(file.originalname);
    const contentType = file.mimetype || 'application/octet-stream';
    const key = `${RECEIPT_PREFIX}${randomUUID()}${extname(originalName).toLowerCase()}`;

    if (this.client && this.bucket) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: contentType,
          Metadata: { filename: encodeURIComponent(originalName) },
        }),
      );
    } else {
      const path = this.localPath(key);
      await mkdir(join(LOCAL_ROOT, RECEIPT_PREFIX), { recursive: true });
      await writeFile(path, file.buffer);
      await writeFile(`${path}.meta.json`, JSON.stringify({ contentType, fileName: originalName }));
    }

    return { key, contentType, fileName: originalName };
  }

  async read(key: string): Promise<ReceiptFile> {
    if (!this.isReceiptKey(key)) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    if (this.client && this.bucket) {
      try {
        const res = await this.client.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        );
        const encoded = res.Metadata?.filename;
        return {
          stream: res.Body as Readable,
          contentType: res.ContentType || 'application/octet-stream',
          fileName: encoded ? decodeURIComponent(encoded) : key.slice(RECEIPT_PREFIX.length),
        };
      } catch {
        throw new NotFoundException('Comprobante no encontrado');
      }
    }

    const path = this.localPath(key);
    if (!existsSync(path)) {
      throw new NotFoundException('Comprobante no encontrado');
    }
    let contentType = 'application/octet-stream';
    let fileName = key.slice(RECEIPT_PREFIX.length);
    if (existsSync(`${path}.meta.json`)) {
      try {
        const meta = JSON.parse(await readFile(`${path}.meta.json`, 'utf8'));
        contentType = meta.contentType || contentType;
        fileName = meta.fileName || fileName;
      } catch {
        // metadatos corruptos: se entrega el archivo con valores por defecto
      }
    }
    return { stream: createReadStream(path), contentType, fileName };
  }

  async remove(key: string) {
    if (!this.isReceiptKey(key)) return;
    try {
      if (this.client && this.bucket) {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      } else {
        const path = this.localPath(key);
        if (existsSync(path)) await unlink(path);
        if (existsSync(`${path}.meta.json`)) await unlink(`${path}.meta.json`);
      }
    } catch (error) {
      this.logger.warn(`No se pudo eliminar el comprobante ${key}: ${error}`);
    }
  }

  private createClient() {
    return new S3Client({
      region: process.env.AWS_DEFAULT_REGION?.trim() || 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT_URL?.trim() || undefined,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE?.trim() === 'true',
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  private localPath(key: string) {
    return join(LOCAL_ROOT, key);
  }

  private decodeName(name: string) {
    try {
      return Buffer.from(name, 'latin1').toString('utf8');
    } catch {
      return name;
    }
  }
}
