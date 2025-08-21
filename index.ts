import qpdfModule, { type QpdfModule } from "./qpdf.js";

export class QpdfError extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args);
    if (Error.captureStackTrace) Error.captureStackTrace(this, QpdfError);
    this.name = "QpdfError";
  }
}

export class Qpdf {
  module: QpdfModule;
  qpdfData: number;

  static async open(file: Buffer | Uint8Array): Promise<Qpdf> {
    const module = await qpdfModule();
    return new Qpdf(module, file);
  }

  private constructor(module: QpdfModule, file: Buffer | Uint8Array) {
    this.module = module;
    this.qpdfData = this.module._qpdf_init();
    if (this.qpdfData === 0) throw new QpdfError("Failed to init qpdf.");
    let ptr;
    try {
      ptr = this.module._malloc(file.byteLength + 8);
    } catch (cause) {
      throw new QpdfError("Failed to allocate space for input document.", {
        cause,
      });
    }
    const descriptionPtr = ptr;
    const filePtr = ptr + 8;
    this.module.HEAP8.set([100, 111, 99, 46, 112, 100, 102, 0], descriptionPtr); // "doc.pdf\0"
    this.module.HEAP8.set(file, filePtr);
    this.module._qpdf_read_memory(
      this.qpdfData,
      descriptionPtr,
      filePtr,
      BigInt(file.byteLength),
      0,
    );
    this.throwIfError();
    // libqpdf keeps a reference to the pdf file buffer so we must not free it here.
  }

  check(): void {
    try {
      this.module._qpdf_check_pdf(this.qpdfData);
    } catch (cause) {
      throw new QpdfError("Check function did not return normally.", { cause });
    }
    this.throwIfError();
  }

  write(): Uint8Array {
    this.module._qpdf_set_preserve_encryption(this.qpdfData, 1); // Cannot fail.
    this.module._qpdf_init_write_memory(this.qpdfData);
    this.throwIfError();
    this.module._qpdf_write(this.qpdfData);
    this.throwIfError();
    const bufferSize = this.module._qpdf_get_buffer_length(this.qpdfData);
    const bufferPtr = this.module._qpdf_get_buffer(this.qpdfData);
    return this.module.HEAP8.slice(bufferPtr, bufferPtr + bufferSize);
  }

  private throwIfError() {
    const qpdfError = this.module._qpdf_get_error(this.qpdfData);
    if (qpdfError === 0) return;
    const errorMessagePtr = this.module._qpdf_get_error_full_text(
      this.qpdfData,
      qpdfError,
    );
    const errorMessage = this.module.UTF8ToString(errorMessagePtr);
    throw new QpdfError(errorMessage);
  }
}
