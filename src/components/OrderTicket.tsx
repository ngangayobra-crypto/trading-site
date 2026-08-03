import { useMemo, useState } from 'react'
import type { Market, OrderSide, OrderType } from '../types/trading'
import { useTrading } from '../services/trading-context'
import { money } from '../utils/format'

export function OrderTicket({ market, defaultSide = 'buy' }: { market: Market; defaultSide?: OrderSide }) {
  const { submitVirtualOrder, settings } = useTrading()
  const [side, setSide] = useState<OrderSide>(defaultSide)
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [quantity, setQuantity] = useState('1')
  const [limitPrice, setLimitPrice] = useState(String(market.price))
  const [message, setMessage] = useState('')

  const estimated = useMemo(() => {
    const qty = Number(quantity)
    const price = orderType === 'limit' ? Number(limitPrice) : market.price
    return Number.isFinite(qty * price) ? qty * price : 0
  }, [limitPrice, market.price, orderType, quantity])

  function submit() {
    const response = submitVirtualOrder({
      marketId: market.id,
      side,
      orderType,
      quantity: Number(quantity),
      limitPrice: orderType === 'limit' ? Number(limitPrice) : undefined,
    })
    setMessage(response)
  }

  return (
    <div className="ticket">
      <div className="segmented" role="tablist" aria-label="Order side">
        <button className={side === 'buy' ? 'active buy' : ''} onClick={() => setSide('buy')} type="button">Buy</button>
        <button className={side === 'sell' ? 'active sell' : ''} onClick={() => setSide('sell')} type="button">Sell</button>
      </div>
      <label>
        Type
        <select value={orderType} onChange={(event) => setOrderType(event.target.value as OrderType)}>
          <option value="market">Market</option>
          <option value="limit">Limit</option>
        </select>
      </label>
      <label>
        Quantity
        <input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      </label>
      {orderType === 'limit' && (
        <label>
          Limit price
          <input inputMode="decimal" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} />
        </label>
      )}
      <dl>
        <div><dt>Reference price</dt><dd>{money(market.price)}</dd></div>
        <div><dt>Estimated value</dt><dd>{money(estimated)}</dd></div>
        <div><dt>Trading fee</dt><dd>{(settings.tradingFeeRate * 100).toFixed(3)}%</dd></div>
      </dl>
      <button className={`primary ${side}`} type="button" onClick={submit}>{side === 'buy' ? 'Buy' : 'Sell'} {market.symbol}</button>
      {message && <p className="form-note">{message}</p>}
    </div>
  )
}
