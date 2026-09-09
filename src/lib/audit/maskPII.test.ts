// ============================================================
// Audit Masking — Tests unitarios
// ============================================================

import { describe, it, expect } from 'vitest'
import { maskEmail, maskName, maskPhone, maskIp, maskAddress } from './maskPII'

describe('maskPII', () => {
  describe('maskEmail', () => {
    it('enmascara email normales', () => {
      expect(maskEmail('carlos@consultoria.com')).toBe('***los@consultoria.com')
      expect(maskEmail('alice@example.org')).toBe('***ice@example.org')
    })

    it('enmascara emails cortos', () => {
      expect(maskEmail('a@example.com')).toBe('*@example.com')
      expect(maskEmail('ab@example.com')).toBe('*b@example.com')
      expect(maskEmail('abc@example.com')).toBe('abc@example.com') // Exactamente 3, no oculta nada
    })

    it('retorna email como-está si no es válido', () => {
      expect(maskEmail('invalid')).toBe('invalid')
      expect(maskEmail('multiple@at@signs.com')).toBe('multiple@at@signs.com')
    })

    it('maneja strings vacíos y nulos', () => {
      expect(maskEmail('')).toBe('')
      expect(maskEmail(null as any)).toBe(null)
      expect(maskEmail(undefined as any)).toBe(undefined)
    })
  })

  describe('maskName', () => {
    it('enmascara nombres normales', () => {
      expect(maskName('Carlos')).toBe('C*****')
      expect(maskName('Alice')).toBe('A****')
      expect(maskName('Bob')).toBe('B**')
    })

    it('maneja nombres de 1 carácter', () => {
      expect(maskName('A')).toBe('A')
    })

    it('maneja strings vacíos y nulos', () => {
      expect(maskName('')).toBe('')
      expect(maskName(null as any)).toBe(null)
      expect(maskName(undefined as any)).toBe(undefined)
    })
  })

  describe('maskPhone', () => {
    it('enmascara teléfonos normales', () => {
      expect(maskPhone('+34612345678')).toBe('********5678')
      expect(maskPhone('612345678')).toBe('*****5678')
      expect(maskPhone('+1 (555) 123-4567')).toBe('**********4567')
    })

    it('enmascara teléfonos cortos', () => {
      expect(maskPhone('123')).toBe('***')
      expect(maskPhone('1234')).toBe('1234')
      expect(maskPhone('12345')).toBe('*1234')
    })

    it('maneja strings vacíos y nulos', () => {
      expect(maskPhone('')).toBe('')
      expect(maskPhone(null as any)).toBe(null)
      expect(maskPhone(undefined as any)).toBe(undefined)
    })
  })

  describe('maskIp', () => {
    it('enmascara IPv4', () => {
      expect(maskIp('192.168.1.42')).toBe('192.168.1.0')
      expect(maskIp('10.0.0.100')).toBe('10.0.0.0')
      expect(maskIp('127.0.0.1')).toBe('127.0.0.0')
    })

    it('enmascara IPv6', () => {
      expect(maskIp('2001:0db8:85a3::8a2e:0370:7334')).toBe('2001:0db8:85a3::8a2e:0370:0000')
      expect(maskIp('::1')).toBe('::0000')
      expect(maskIp('fe80::1')).toBe('fe80::0000')
    })

    it('retorna IP como-está si es formato desconocido', () => {
      expect(maskIp('not-an-ip')).toBe('not-an-ip')
      expect(maskIp('256.256.256.256')).toBe('256.256.256.0') // Válido sintácticamente
    })

    it('maneja strings vacíos y nulos', () => {
      expect(maskIp('')).toBe('')
      expect(maskIp(null as any)).toBe(null)
      expect(maskIp(undefined as any)).toBe(undefined)
    })
  })

  describe('maskAddress', () => {
    it('retorna dirección como-está (placeholder)', () => {
      expect(maskAddress('Calle Mayor 123, Madrid, 28001')).toBe('Calle Mayor 123, Madrid, 28001')
      expect(maskAddress('Av. Paseo 42, Barcelona')).toBe('Av. Paseo 42, Barcelona')
    })

    it('maneja strings vacíos y nulos', () => {
      expect(maskAddress('')).toBe('')
      expect(maskAddress(null as any)).toBe(null)
      expect(maskAddress(undefined as any)).toBe(undefined)
    })
  })
})
