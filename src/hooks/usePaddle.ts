'use client'

import { useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

export function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle | undefined>()

  useEffect(() => {
    initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed' && event.data?.transaction_id) {
          window.dispatchEvent(
            new CustomEvent('paddle:checkout:completed', {
              detail: { transactionId: event.data.transaction_id },
            }),
          )
        }
      },
    }).then(setPaddle)
  }, [])

  return paddle
}
