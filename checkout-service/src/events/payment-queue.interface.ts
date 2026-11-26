export interface PaymentOrderMessageItem {
  productId: string
  quantity: number
  price: number
}

export interface PaymentOrderMessage {
  orderId: string
  userId: string
  amount: number
  items: PaymentOrderMessageItem[]
  paymentMethod: string
  description?: string
  createdAt?: Date
}
