export type QpdfModule = {
  _qpdf_init(): number;
  _qpdf_cleanup(qpdfData: number): void;
  _qpdf_has_error(qpdfData: number): number;
  _qpdf_get_error(qpdfData: number): number;
  _qpdf_get_error_full_text(qpdfData: number, qpdfError: number): number;
  _qpdf_get_error_code(qpdfData: number, qpdfError: number): number;
  _qpdf_get_error_filename(qpdfData: number, qpdfError: number): number;
  _qpdf_get_error_file_position(qpdfData: number, qpdfError: number): BigInt;
  _qpdf_get_error_message_detail(qpdfData: number, qpdfError: number): number;
  _qpdf_check_pdf(qpdfData: number): number;
  _qpdf_read_memory(
    qpdfData: number,
    descriptionPtr: number,
    bufferPtr: number,
    bufferSize: BigInt,
    passwordPtr: number,
  ): number;
  _qpdf_init_write_memory(qpdfData: number): number;
  _qpdf_write(qpdfData: number): number;
  _qpdf_get_buffer_length(qpdfData: number): number;
  _qpdf_get_buffer(qpdfData: number): number;
  _qpdf_set_preserve_encryption(qpdfData: number, value: number): void;
  _malloc(size: number): number;
  _free(ptr: number): void;
  HEAP8: Uint8Array;
  UTF8ToString(
    ptr: number,
    maxBytesToRead?: number,
    ignoreNul?: boolean,
  ): string;
};

export default function MainModuleFactory(
  options?: unknown,
): Promise<QpdfModule>;
