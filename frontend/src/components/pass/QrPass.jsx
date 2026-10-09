import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'

// Shared by the Pass tab and the in-chat PassCard
export default function QrPass({ value, size = 200, mode = 'qr' }) {
  if (mode === 'barcode') {
    return (
      <Barcode value={value.replace(/^stacks:/, '')} format="CODE128" height={90} width={1.8} fontSize={13} margin={0} background="transparent" lineColor="#1d2a26" />
    )
  }
  return <QRCodeSVG value={value} size={size} level="M" fgColor="#1d2a26" bgColor="transparent" />
}
