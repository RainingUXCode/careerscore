import { describe, expect, it } from 'vitest'
import { separarValoresLista } from './listas'

describe('separarValoresLista', () => {
  it('aceita multiplos valores separados por virgula', () => {
    expect(separarValoresLista('React, SQL, Excel')).toEqual(['React', 'SQL', 'Excel'])
  })

  it('remove espacos e entradas vazias', () => {
    expect(separarValoresLista(' Inglês, , Espanhol ,')).toEqual(['Inglês', 'Espanhol'])
  })
})
