export interface XmlInvoiceItemDto {
  nro: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface XmlInvoiceDto {
  invoiceId: string;
  emisor: string;
  receptor: string;
  fechaEmision: string;
  totalGeneral: number;
  items: XmlInvoiceItemDto[];
}
