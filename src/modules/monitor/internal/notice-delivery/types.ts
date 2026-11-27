export interface Delivered {
  kind: "delivered"
}

export interface GaveUp {
  kind: "gave_up"
  reason: string
}

export interface DeliveryCancelled {
  kind: "cancelled"
}

export type DeliveryResult = Delivered | GaveUp | DeliveryCancelled

export type FailureHandler = (reason: string) => void

export type WakeHandler = () => void
