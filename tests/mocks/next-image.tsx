import React from 'react'

type Props = {
  src: any
  alt?: string
  width?: number
  height?: number
  [key: string]: any
}

export default function NextImageMock({ src, alt = '', ...rest }: Props) {
  const resolved = typeof src === 'string' ? src : src?.src || ''
  return <img src={resolved} alt={alt} {...rest} />
}
